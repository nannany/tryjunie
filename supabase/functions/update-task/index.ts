// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

interface TaskUpdateData {
  id: string; // Mandatory task ID to update
  title?: string;
  description?: string;
  estimated_minute?: number;
  task_date?: string; // ISO date format YYYY-MM-DD
  task_order?: number;
  start_time?: string; // ISO 8601 datetime string
  end_time?: string;   // ISO 8601 datetime string
}

// Define a type for the updateObject to ensure type safety
type TaskUpdateObject = Omit<Partial<TaskUpdateData>, 'id'>;

// Helper function to validate ISO 8601 datetime string
function isValidISODateTimeString(timeStr: string): boolean {
  if (typeof timeStr !== 'string') return false;
  try {
    const date = new Date(timeStr);
    // Check if the date is valid and if the string is a full ISO string including timezone (Z or +-HH:MM)
    // new Date(timeStr).toISOString() === timeStr only works if the input is already in UTC ("Z" suffix).
    // A more robust check involves ensuring the date is not "Invalid Date" and matches common ISO patterns.
    // For simplicity here, we check if it's a valid date and roughly matches the format.
    // A regex could be more precise: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|([+-]\d{2}:\d{2}))$/
    return !isNaN(date.getTime()) && timeStr.includes('T'); // Basic check, consider regex for production
  } catch (e) {
    return false;
  }
}

function validateTaskUpdateData(data: any): { valid: boolean; errors?: string[]; validatedData?: TaskUpdateData } {
  if (!data) {
    return { valid: false, errors: ["Request body is required."] };
  }

  const errors: string[] = [];
  const validatedData: Partial<TaskUpdateData> = {};

  if (typeof data.id !== 'string' || data.id.trim() === '') {
    errors.push("id is required and must be a non-empty string.");
  } else {
    validatedData.id = data.id.trim();
  }

  // Title
  if (data.title !== undefined) {
    if (data.title === null || (typeof data.title === 'string' && data.title.trim() === '')) {
        validatedData.title = "";
    } else if (typeof data.title !== 'string') {
      errors.push("title must be a string if provided.");
    } else {
      validatedData.title = data.title.trim();
    }
  }

  // Description
  if (data.description !== undefined) {
    if (data.description === null) {
        validatedData.description = null as any;
    } else if (typeof data.description !== 'string') {
      errors.push("description must be a string if provided.");
    } else {
      validatedData.description = data.description;
    }
  }

  // Estimated Minute
  if (data.estimated_minute !== undefined) {
    if (data.estimated_minute === null) {
        validatedData.estimated_minute = null as any;
    } else if (typeof data.estimated_minute !== 'number' || data.estimated_minute < 0) {
      errors.push("estimated_minute must be a non-negative number or null if provided.");
    } else {
      validatedData.estimated_minute = data.estimated_minute;
    }
  }

  // Task Date (YYYY-MM-DD)
  if (data.task_date !== undefined) {
    if (data.task_date === null) {
        validatedData.task_date = null as any;
    } else if (typeof data.task_date !== 'string') {
      errors.push("task_date must be a string or null if provided.");
    } else {
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoDatePattern.test(data.task_date)) {
        errors.push("task_date must be a valid ISO date string (YYYY-MM-DD) or null if provided.");
      } else {
        const date = new Date(data.task_date);
        const [year, month, day] = data.task_date.split('-').map(Number);
        if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
            errors.push("task_date is not a valid calendar date (e.g., 2023-02-30 is invalid or date doesn't exist).");
        } else {
            validatedData.task_date = data.task_date;
        }
      }
    }
  }

  // Task Order
  if (data.task_order !== undefined) {
     if (data.task_order === null) {
        validatedData.task_order = null as any;
    } else if (typeof data.task_order !== 'number') {
      errors.push("task_order must be a number or null if provided.");
    } else {
      validatedData.task_order = data.task_order;
    }
  }

  // Start Time (ISO 8601 DateTime)
  if (data.start_time !== undefined) {
    if (data.start_time === null) {
      validatedData.start_time = null as any;
    } else if (!isValidISODateTimeString(data.start_time)) {
      errors.push("start_time must be a valid ISO 8601 datetime string (e.g., YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+-HH:MM) or null if provided.");
    } else {
      validatedData.start_time = data.start_time;
    }
  }

  // End Time (ISO 8601 DateTime)
  if (data.end_time !== undefined) {
    if (data.end_time === null) {
      validatedData.end_time = null as any;
    } else if (!isValidISODateTimeString(data.end_time)) {
      errors.push("end_time must be a valid ISO 8601 datetime string (e.g., YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+-HH:MM) or null if provided.");
    } else {
      validatedData.end_time = data.end_time;
    }
  }

  // Check if end_time is after start_time (only if both are valid and not null)
  if (validatedData.start_time && validatedData.end_time &&
      isValidISODateTimeString(validatedData.start_time) && isValidISODateTimeString(validatedData.end_time)) {
    const startTime = new Date(validatedData.start_time);
    const endTime = new Date(validatedData.end_time);
    if (endTime <= startTime) {
      errors.push("end_time must be after start_time.");
    }
  }


  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, validatedData: validatedData as TaskUpdateData };
}

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

console.log("Update Task Function initialized");

const requestHandler = async (req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const jwtSecret = Deno.env.get("X_SUPABASE_JWT_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !jwtSecret) {
    console.error("Missing required environment variables.");
    return new Response(JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Only POST requests are accepted." }),
      { status: 405, headers: { "Content-Type": "application/json", "Allow": "POST" } });
  }

  const integrationId = req.headers.get("x-integration-id");
  if (!integrationId) {
    return new Response(JSON.stringify({ error: "x-integration-id header is missing." }),
      { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { data: keyData, error: keyError } = await serviceRoleClient
      .from("integration_keys")
      .select("user_id, is_active")
      .eq("key", integrationId)
      .single();

    if (keyError) {
      console.error("Error querying integration_keys:", keyError.message);
      if (keyError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: "Integration key not found." }),
          { status: 404, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Failed to retrieve integration key." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (!keyData) {
        return new Response(JSON.stringify({ error: "Integration key not found (no data)." }),
            { status: 404, headers: { "Content-Type": "application/json" } });
    }

    if (!keyData.is_active) {
      return new Response(JSON.stringify({ error: "Integration key is inactive." }),
        { status: 403, headers: { "Content-Type": "application/json" } });
    }

    serviceRoleClient.from("integration_keys").update({ last_used_at: new Date().toISOString() })
      .eq("key", integrationId).then(({ error: updateError }) => {
        if (updateError) console.error("Error updating last_used_at:", updateError.message);
      });

    const actualUserId = keyData.user_id;
    let token;
    try {
      token = await createToken(actualUserId, jwtSecret, supabaseUrl);
    } catch (e) {
      console.error("JWT generation error:", e.message);
      return new Response(JSON.stringify({ error: "Failed to generate authentication token." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const userSupabaseClient: SupabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body.", details: e.message }),
        { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const validationResult = validateTaskUpdateData(requestBody);
    if (!validationResult.valid || !validationResult.validatedData) {
      return new Response(JSON.stringify({ error: "Invalid task data.", details: validationResult.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { id: taskId, ...fieldsToUpdate } = validationResult.validatedData;

    const updateObject: TaskUpdateObject = {};

    if (fieldsToUpdate.title !== undefined) updateObject.title = fieldsToUpdate.title;
    if (fieldsToUpdate.description !== undefined) updateObject.description = fieldsToUpdate.description;
    if (fieldsToUpdate.estimated_minute !== undefined) updateObject.estimated_minute = fieldsToUpdate.estimated_minute;
    if (fieldsToUpdate.task_date !== undefined) updateObject.task_date = fieldsToUpdate.task_date;
    if (fieldsToUpdate.task_order !== undefined) updateObject.task_order = fieldsToUpdate.task_order;
    if (fieldsToUpdate.start_time !== undefined) updateObject.start_time = fieldsToUpdate.start_time;
    if (fieldsToUpdate.end_time !== undefined) updateObject.end_time = fieldsToUpdate.end_time;


    if (Object.keys(updateObject).length === 0) {
      return new Response(
        JSON.stringify({ error: "No updatable fields provided.", message: "You must provide at least one field to update (e.g., title, description, etc.) besides the id." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: updatedTask, error: updateError } = await userSupabaseClient
      .from('tasks')
      .update(updateObject)
      .eq('id', taskId)
      .eq('user_id', actualUserId)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      if (updateError.code === 'PGRST116') {
         return new Response(
          JSON.stringify({ error: "Task not found or user does not have permission to update it.", details: updateError.message }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to update task.", details: updateError.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!updatedTask) {
      return new Response(
        JSON.stringify({ error: "Task not found after update attempt, or no changes made that returned data." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Task updated successfully.", task: updatedTask }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected server error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: "An unexpected server error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export { requestHandler as handler };

Deno.serve(requestHandler);

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-task' \
    --header 'x-integration-id: your-integration-key' \
    --header 'Content-Type: application/json' \
    --data '{"id": "task_id_to_update", "title": "Updated Title", "start_time": "2024-01-01T10:00:00Z", "end_time": "2024-01-01T11:00:00Z"}'
*/
