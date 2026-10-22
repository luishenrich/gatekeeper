import { createBrowserClient } from "@supabase/ssr";

/** Browser client. Session cookies are readable by the server helper and middleware. */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase browser environment variables");
  }
  return createBrowserClient(url, key);
}
