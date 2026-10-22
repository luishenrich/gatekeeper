"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Emails a magic link. Leads must already exist in Supabase Auth. */
export async function sendMagicLink(email: string) {
  const supabase = createSupabaseBrowserClient();
  const origin = window.location.origin;
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/queue`,
    },
  });
}

/** Verifies the 6-digit code from the magic-link email. */
export async function verifyCode(email: string, code: string) {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
}
