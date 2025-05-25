// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

console.log("Task Management Function initialized");

Deno.serve(async (req) => {
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

    // Supabaseクライアントの初期化（--no-verify-jwtオプションを使用する想定）
    const supabaseClient = createClient(
      // SupabaseのURLとanonキーはエッジ関数の環境変数から自動的に利用可能
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        // JWTの検証は行わない
        auth: {
          persistSession: false,
        },
      },
    );

    // --no-verify-jwt オプションが指定されている場合、
    // リクエストから提供されたユーザーIDを使用する
    const userId = req.headers.get("x-user-id") || "system";

    // タスクデータの作成
    const newTask = {
      ...taskData,
      // リクエストボディでuser_idが指定されていなければ、ヘッダーのuser_idを使用
      user_id: taskData.user_id || userId,
      // task_dateが指定されていなければ今日の日付を使用
      task_date: taskData.task_date || new Date().toISOString().split("T")[0],
    };

    // タスクの保存
    const { data, error } = await supabaseClient
      .from("tasks")
      .insert(newTask)
      .select()
      .single();

    if (error) {
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
    return new Response(
      JSON.stringify({
        error: "サーバーエラーが発生しました",
        details: error.message,
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
    --header 'X-User-ID: 00000000-0000-0000-0000-000000000000' \
    --header 'Content-Type: application/json' \
    --data '{"title":"新しいタスク", "description":"これはタスクの説明です", "estimated_minute":30}' \
    --no-verify-jwt

*/
