import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  return createSupabaseClient(
    // @ts-ignore: TS2339
    import.meta.env.VITE_SUPABASE_URL!,
    // @ts-ignore: TS2339
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
  );
}
