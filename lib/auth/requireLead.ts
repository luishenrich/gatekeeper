import "server-only";
import { NextRequest } from "next/server";
import { hasCommunityLeadRow } from "@/lib/auth/community-lead";
import { hasAdminCredential } from "@/lib/auth/queue-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lead API gate. Accepts any one of:
 * - Authorization: Bearer QUEUE_ADMIN_TOKEN
 * - the gk_lead cookie
 * - a Supabase session whose user has a community_leads row
 */
export async function requireLead(req: NextRequest): Promise<boolean> {
  if (hasAdminCredential(req)) return true;
  try {
    const supabase = await createSupabaseServerClient();
    return await hasCommunityLeadRow(supabase);
  } catch (error) {
    console.error("lead session check failed", error);
    return false;
  }
}
