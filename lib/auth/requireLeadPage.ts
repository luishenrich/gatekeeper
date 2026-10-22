import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { userHasAnyLead } from "@/lib/auth/community-lead";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Page gate. The demo cookie unlocks every community.
 * A magic-link session unlocks the page when the user leads at least one
 * community; each API still checks the community slug.
 */
export async function hasLeadPageAccess(): Promise<boolean> {
  const jar = await cookies();
  if (matchesLeadToken(jar.get("gk_lead")?.value)) return true;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return false;
    return userHasAnyLead(supabase, data.user.id);
  } catch (error) {
    console.error("lead page check failed", error);
    return false;
  }
}

/** Redirects to /login unless the demo cookie or a lead session is present. */
export async function requireLeadPage(): Promise<void> {
  if (!(await hasLeadPageAccess())) redirect("/login");
}
