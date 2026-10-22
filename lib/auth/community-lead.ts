import type { SupabaseClient } from "@supabase/supabase-js";

/** True when the session user leads this community. The table stores no email. */
export async function userLeadsCommunity(
  supabase: SupabaseClient,
  userId: string,
  communityId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_leads")
    .select("user_id")
    .eq("user_id", userId)
    .eq("community_id", communityId)
    .maybeSingle();
  return !error && !!data;
}

/** True when the session user leads at least one community. */
export async function userHasAnyLead(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_leads")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1);
  return !error && !!data?.length;
}
