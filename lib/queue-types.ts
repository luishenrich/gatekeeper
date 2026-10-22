export type CommunitySlug =
  | "london-agent-builders"
  | "south-london-hack-nights";

export type Verdict = "accept" | "ask" | "decline";

export type RulesFitSignal = {
  score: number;
  rule_refs: string[];
};

export type SpamTextSignal = {
  score: number;
  matched_patterns: string[];
};

export type StopForumSpamSignal = {
  appears: boolean;
  frequency: number;
  confidence: number;
};

export type GithubSignal = {
  exists: boolean;
  account_age_days: number;
  public_repos: number;
};

export type DevpostSignal = {
  projects_found: number;
};

/** Null means that check was skipped or timed out. */
export type QueueSignals = {
  rules_fit: RulesFitSignal | null;
  spam_text: SpamTextSignal | null;
  stopforumspam: StopForumSpamSignal | null;
  github: GithubSignal | null;
  devpost: DevpostSignal | null;
  blocklist_hit: boolean | null;
};

export type BlocklistMatch = {
  matched_on: Array<"phone" | "handle" | "email">;
  status: "confirmed";
  reported_at: string;
};

/** An application joined with its latest decisions row. */
export type QueueApplication = {
  id: string;
  community_slug: CommunitySlug;
  community_name: string;
  name: string;
  handle: string;
  phone: string;
  email: string;
  github: string | null;
  text: string;
  created_at: string;
  decision: Verdict;
  score: number;
  reason: string;
  signals: QueueSignals;
  final: boolean;
  blocklist_match?: BlocklistMatch;
};

export type DecisionRequest = {
  decision: "accept" | "decline";
  report_to_blocklist: boolean;
  evidence?: string;
};

export type DecisionResponse = {
  ok: true;
  blocklist_entry_id?: string;
  blocklist_status?: "pending" | "confirmed";
};

export const COMMUNITIES: { slug: CommunitySlug; name: string }[] = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
];

export function isInReviewQueue(app: {
  decision: string;
  final: boolean;
  signals?: { blocklist_hit?: boolean | null } | null;
}): boolean {
  return (
    app.decision === "ask" ||
    app.signals?.blocklist_hit === true ||
    app.final === false
  );
}

export function sortQueueNewestFirst<T extends { created_at: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
