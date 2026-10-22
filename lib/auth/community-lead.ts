import type { SupabaseClient } from "@supabase/supabase-js";

/** True when this session's user has a row in community_leads. The table stores no email. */
export async function userIsCommunityLead(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_leads")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

export async function hasCommunityLeadRow(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return userIsCommunityLead(supabase, data.user.id);
}
