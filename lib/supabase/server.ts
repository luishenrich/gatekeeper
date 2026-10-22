import "server-only";
import { createClient } from "@supabase/supabase-js";

let _supabaseServer: ReturnType<typeof createClient> | null = null;

export function getSupabaseServer() {
  if (_supabaseServer) return _supabaseServer;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  _supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseServer;
}

export const supabaseServer = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabaseServer() as any)[prop];
  },
});
