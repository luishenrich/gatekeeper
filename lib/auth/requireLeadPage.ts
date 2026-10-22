import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasCommunityLeadRow } from "@/lib/auth/community-lead";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Page gate for the design pass: gk_lead cookie or a community_leads session. */
export async function hasLeadPageAccess(): Promise<boolean> {
  const jar = await cookies();
  if (matchesLeadToken(jar.get("gk_lead")?.value)) return true;
  try {
    const supabase = await createSupabaseServerClient();
    return await hasCommunityLeadRow(supabase);
  } catch (error) {
    console.error("lead page check failed", error);
    return false;
  }
}

/** Call at the top of a lead page. Redirects to /login when access is missing. */
export async function requireLeadPage(): Promise<void> {
  if (!(await hasLeadPageAccess())) redirect("/login");
}
