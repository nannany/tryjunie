// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

interface RequestData {
  date?: string;
}

// JWTを生成する関数
// jwtSecret and supabaseUrl are passed directly as they are already retrieved and checked
export async function createToken(
  userId: string,
  currentJwtSecret: string,
  currentSupabaseUrl: string,
) {
  const payload = {
    sub: userId,
    role: "authenticated",
    aud: "authenticated",
    iss: currentSupabaseUrl,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
  };

  const secretKeyData = new TextEncoder().encode(currentJwtSecret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretKeyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return await djwt.create({ alg: "HS256", typ: "JWT" }, payload, key);
}

console.log("Hello from Functions!")

// Exported handler for testing
export const handler = async (req: Request): Promise<Response> => {
  // Environment variable checks
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const jwtSecret = Deno.env.get("X_SUPABASE_JWT_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !jwtSecret) {
    // Construct the error message carefully
    const missing = [
      !supabaseUrl ? "SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      !anonKey ? "SUPABASE_ANON_KEY" : null,
      !jwtSecret ? "X_SUPABASE_JWT_SECRET" : null,
    ].filter(Boolean).join(", ");
    console.error(`Missing environment variables: ${missing}`);
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Method check
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  let requestData: RequestData;
  try {
    requestData = await req.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON format" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!requestData || typeof requestData.date !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid date parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const dateString = requestData.date;
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return new Response(
      JSON.stringify({ error: "Invalid date format" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Retrieve x-integration-id header
  const integrationId = req.headers.get("x-integration-id");
  if (!integrationId) {
    return new Response(
      JSON.stringify({ error: "x-integration-id header is missing" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Initialize Service Role Client
  const serviceRoleClient = createClient(
    supabaseUrl, // Already checked
    serviceRoleKey, // Already checked
    {
      auth: {
        persistSession: false,
      },
    },
  );

  // Query integration_keys table
  const { data: keyData, error: keyError } = await serviceRoleClient
    .from("integration_keys")
    .select("user_id, is_active")
    .eq("key", integrationId)
    .single();

  if (keyError || !keyData) {
    console.error("Error fetching integration key or key not found:", keyError);
    return new Response(
      JSON.stringify({ error: "Integration key not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!keyData.is_active) {
    return new Response(
      JSON.stringify({ error: "Integration key is inactive." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  // ==> ADD THE UPDATE LOGIC HERE <==
  try {
    const { error: updateError } = await serviceRoleClient
      .from("integration_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key", integrationId)
      .eq("user_id", keyData.user_id); // <== ADD THIS CONDITION

    if (updateError) {
      console.error("Error updating last_used_at for integration key:", updateError);
      // Non-critical error, so we don't return. Log and continue.
    }
  } catch (e: any) {
      console.error("Exception during last_used_at update for integration key:", e.message);
      // Non-critical error, so we don't return. Log and continue.
  }
  // ==> END OF ADDED LOGIC <==

  // Generate JWT
  const actualUserId = keyData.user_id;
  let token;
  try {
    token = await createToken(actualUserId, jwtSecret!, supabaseUrl!);
  } catch (e: any) {
    console.error("JWT generation error:", e.message);
    return new Response(
      JSON.stringify({ error: "Failed to generate authentication token." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Initialize User-Specific Supabase Client
  const userSupabaseClient = createClient(
    supabaseUrl, // Already checked
    anonKey!, // Already checked and asserted as non-null
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  // Fetch Tasks
  const { data: tasksData, error: tasksError } = await userSupabaseClient
    .from("tasks")
    .select("*") // Or specify columns: "id, title, description, ..."
    .eq("task_date", dateString) // dateString is the validated date from request
    .eq("user_id", actualUserId); // actualUserId from integration_keys

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
    return new Response(
      JSON.stringify({ error: "Failed to fetch tasks", details: tasksError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ tasks: tasksData === null ? [] : tasksData }),
    { headers: { "Content-Type": "application/json" }, status: 200 },
  )
};

// Start the server
Deno.serve(handler);

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/search-tasks-per-day' \
    --header 'x-integration-id: your-integration-id' \
    --header 'Content-Type: application/json' \
    --data '{"date":"2025-05-23"}'

*/
