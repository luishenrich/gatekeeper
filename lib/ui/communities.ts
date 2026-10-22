export const COMMUNITIES = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
] as const;

export type CommunitySlug = (typeof COMMUNITIES)[number]["slug"];

export const DEFAULT_COMMUNITY: CommunitySlug = "london-agent-builders";
export const COMMUNITY_STORAGE_KEY = "gk.community";

export function communityName(slug: string | null | undefined): string {
  return COMMUNITIES.find((c) => c.slug === slug)?.name ?? "Unknown community";
}

export function isCommunitySlug(value: string | null | undefined): value is CommunitySlug {
  return COMMUNITIES.some((c) => c.slug === value);
}

export const REPO_URL = "https://github.com/luishenrich/gatekeeper";
