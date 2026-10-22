export type BlocklistCheckResult = {
  match: boolean;
  matched_on?: string[];
  status?: string;
  reported_at?: string;
};

export async function checkBlocklist(handle: string): Promise<BlocklistCheckResult> {
  const base = process.env.GATEKEEPER_API_URL;
  const token = process.env.BOT_API_TOKEN;
  const community = process.env.COMMUNITY_SLUG;

  if (!base || !token || !community) {
    throw new Error("Missing GATEKEEPER_API_URL, BOT_API_TOKEN, or COMMUNITY_SLUG");
  }

  const useMocks = process.env.USE_MOCKS === "true";
  const path = useMocks ? "/api/_mock/blocklist/check" : "/api/blocklist/check";
  const url = `${base.replace(/\/$/, "")}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      community_slug: community,
      handle,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`blocklist/check ${res.status}: ${text}`);
  }

  return (await res.json()) as BlocklistCheckResult;
}
