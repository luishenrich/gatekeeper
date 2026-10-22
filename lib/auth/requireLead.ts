import "server-only";
import { NextRequest } from "next/server";
import { userLeadsCommunity } from "@/lib/auth/community-lead";
import { hasAdminCredential } from "@/lib/auth/queue-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lead API gate for one community. Accepts any one of:
 * - Authorization: Bearer QUEUE_ADMIN_TOKEN
 * - the gk_lead cookie
 * - a Supabase session with a community_leads row for communitySlug
 */
export async function requireLead(req: NextRequest, communitySlug: string): Promise<boolean> {
  if (hasAdminCredential(req)) return true;
  if (!communitySlug) return false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return false;

    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", communitySlug)
      .maybeSingle();
    if (communityError || !community?.id) return false;

    return userLeadsCommunity(supabase, userData.user.id, community.id);
  } catch (error) {
    console.error("lead session check failed", error);
    return false;
  }
}
