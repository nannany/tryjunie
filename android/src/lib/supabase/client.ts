import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// シングルトンインスタンス
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  // 既にインスタンスが存在する場合はそれを返す
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // 新しいインスタンスを作成
  supabaseInstance = createSupabaseClient(
    // @ts-ignore: TS2339
    import.meta.env.VITE_SUPABASE_URL!,
    // @ts-ignore: TS2339
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
  );

  return supabaseInstance;
}
