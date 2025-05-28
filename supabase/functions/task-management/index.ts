// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

// タスクデータの型定義
interface TaskData {
  title: string;
  description?: string;
  estimated_minute?: number;
  task_date?: string; // ISO形式の日付文字列
  task_order?: number;
  user_id?: string; // リクエストからユーザーIDを指定することも可能
}

// リクエストデータの検証
function validateTaskData(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!data) {
    return { valid: false, errors: ["リクエストボディが空です"] };
  }

  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.trim() === ""
  ) {
    errors.push("タイトルは必須です");
  }

  if (data.description !== undefined && typeof data.description !== "string") {
    errors.push("説明は文字列である必要があります");
  }

  if (
    data.estimated_minute !== undefined &&
    (typeof data.estimated_minute !== "number" || data.estimated_minute < 0)
  ) {
    errors.push("見積時間は0以上の数値である必要があります");
  }

  if (data.task_date !== undefined) {
    try {
      new Date(data.task_date);
    } catch (e) {
      errors.push("日付の形式が無効です");
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
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

console.log("Task Management Function initialized");

Deno.serve(async (req) => {
  // Essential configuration check
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET"); // Checked here for early exit

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !jwtSecret) {
    // debug用にどの環境系変数が欠けているかをログに出力
    console.error("Environment variables:");
    console.error("SUPABASE_URL:", supabaseUrl);
    console.error("SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey);
    console.error("SUPABASE_ANON_KEY:", anonKey);
    console.error("SUPABASE_JWT_SECRET:", jwtSecret);

    console.error(
      "Missing one or more required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET",
    );
    return new Response(
      JSON.stringify({
        error: "Server configuration error.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // POSTメソッド以外は許可しない
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // リクエストからデータを取得
    const taskData: TaskData = await req.json();

    // データのバリデーション
    const validation = validateTaskData(taskData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: "Invalid task data",
          details: validation.errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Supabaseクライアントの初期化 (integration_keys の検証にのみ使用)
    const serviceRoleClient = createClient(
      supabaseUrl, // Already checked
      serviceRoleKey, // Already checked
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // --no-verify-jwt オプションが指定されている場合、
    // リクエストから提供されたユーザーIDを使用する
    const integrationId = req.headers.get("x-integration-id");

    // x-integration-idヘッダーの存在チェック
    if (!integrationId) {
      return new Response(
        JSON.stringify({
          error: "x-integration-id header is missing",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // integration_keysテーブルからキー情報を取得
    const { data: keyData, error: keyError } = await serviceRoleClient // serviceRoleClient を使用
      .from("integration_keys")
      .select("user_id, is_active")
      .eq("key", integrationId)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({
          error: "Integration key not found.",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!keyData.is_active) {
      return new Response(
        JSON.stringify({
          error: "Integration key is inactive.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const actualUserId = keyData.user_id;

    let token;
    try {
      // supabaseUrl and jwtSecret are already confirmed to exist from the top check
      token = await createToken(actualUserId, jwtSecret!, supabaseUrl!); // jwtSecret and supabaseUrl are checked at the beginning of Deno.serve
    } catch (e) {
      // This catch block is now for unexpected errors during token creation itself,
      // as specific env var checks are done earlier or within createToken.
      console.error("JWT generation error:", e.message);
      return new Response(
        JSON.stringify({
          error: "Failed to generate authentication token.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ユーザー固有の操作のための新しいSupabaseクライアントを初期化
    const userSupabaseClient = createClient(
      supabaseUrl, // Already checked
      anonKey, // Already checked
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }, // JWTをヘッダーで渡す
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    // タスクデータの作成
    const newTask = {
      ...taskData,
      // リクエストボディでuser_idが指定されていなければ、検証済みのactualUserIdを使用
      user_id: taskData.user_id || actualUserId,
      // task_dateが指定されていなければ今日の日付を使用
      task_date: taskData.task_date || new Date().toISOString().split("T")[0],
    };

    // タスクの保存
    const { data, error } = await userSupabaseClient // userSupabaseClient を使用
      .from("tasks")
      .insert(newTask)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(
        JSON.stringify({
          error: "タスクの保存に失敗しました",
          details: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        message: "タスクが正常に作成されました",
        task: data,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    // 予期しないエラー
    console.error("Unexpected server error:", error.message, error.stack); // Log more details for server-side debugging
    return new Response(
      JSON.stringify({
        error: "An unexpected server error occurred.", // Generic message to client
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
    --header 'x-integration-id: your-integration-id' \
    --header 'Content-Type: application/json' \
    --data '{"title":"新しいタスク", "description":"これはタスクの説明です", "estimated_minute":30}' \
    --no-verify-jwt

*/
