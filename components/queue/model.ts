import type { Decision } from "@/components/ui";
import { parseRuleNumber } from "@/lib/signals-ui";
import { COMMUNITIES } from "@/lib/ui/communities";

/** Shape of one item in `GET /api/queue` (and the mock). Only fields the API returns. */
export type QueueBlocklistMatch = {
  matched_on?: string[] | null;
  status?: string | null;
  reported_at?: string | null;
  hash_prefix?: string | null;
  prior_community_name?: string | null;
};

export type QueueApp = {
  id: string;
  community_slug?: string;
  community_name?: string | null;
  channel?: string | null;
  channel_user_id?: string | null;
  name: string | null;
  handle: string | null;
  phone?: string | null;
  email?: string | null;
  github?: string | null;
  text: string | null;
  created_at?: string | null;
  decision: string;
  score: number | null;
  reason: string | null;
  final?: boolean;
  signals: Record<string, unknown> | null;
  blocklist_match?: QueueBlocklistMatch | null;
  auto_sent?: boolean;
};

export type QueueResponse = { applications: QueueApp[] };

export type DecisionFilter = "all" | Decision;
export type ChannelFilter = "all" | "whatsapp" | "discord" | "web";

export function isBlocklistHit(app: QueueApp): boolean {
  return app.signals?.blocklist_hit === true || !!app.blocklist_match;
}

export function channelOf(app: QueueApp): "whatsapp" | "discord" | "web" {
  return app.channel === "whatsapp" || app.channel === "discord" ? app.channel : "web";
}

export function channelLabel(channel: string): string {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "discord") return "Discord";
  return "Web";
}

export function recommended(app: QueueApp): Decision {
  return app.decision === "accept" || app.decision === "decline" ? app.decision : "ask";
}

export function displayHandle(app: QueueApp): string {
  return app.handle || app.name || "applicant";
}

const DECISION_RANK: Record<Decision, number> = { decline: 0, ask: 1, accept: 2 };

/** Blocklist hits first, then decline → ask → accept, then newest. */
export function sortQueue(apps: QueueApp[]): QueueApp[] {
  const order = new Map(apps.map((a, i) => [a.id, i]));
  return [...apps].sort((a, b) => {
    const bl = Number(isBlocklistHit(b)) - Number(isBlocklistHit(a));
    if (bl !== 0) return bl;
    const d = DECISION_RANK[recommended(a)] - DECISION_RANK[recommended(b)];
    if (d !== 0) return d;
    const ta = a.created_at ? Date.parse(a.created_at) : NaN;
    const tb = b.created_at ? Date.parse(b.created_at) : NaN;
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    // API already returns newest first.
    return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  });
}

/** The real API names the partner community; the mock does not, so mirror its rule. */
export function priorCommunityName(app: QueueApp): string {
  if (app.blocklist_match?.prior_community_name) return app.blocklist_match.prior_community_name;
  const other = COMMUNITIES.find((c) => c.slug !== app.community_slug);
  return app.community_slug && other ? other.name : "a partner community";
}

const ASK_QUESTIONS: Record<number, string> = {
  1: "Thanks for applying! Before we decide: could you share a repo, demo or something concrete you've built with AI recently?",
  2: "Thanks for applying! Before we decide: what specifically are you building, or what do you want to learn here?",
  3: "Thanks for applying! We meet in person in London. Are you based here, or able to come along regularly?",
  4: "Thanks for applying! Quick check: what brings you to the community? We ask everyone in sales, recruiting or investing roles to confirm they're not here to pitch.",
};

/**
 * Starting text for the reply composer. Accept/decline mirror the wording the
 * decisions API drafts; ask is one clarifying question tied to the cited rule.
 * The lead edits it before anything is sent.
 */
export function draftTemplate(app: QueueApp, decision: Decision): string {
  if (decision === "accept") {
    return "Thanks! Your application has been accepted. A community lead will reach out shortly with next steps.";
  }
  if (decision === "decline") {
    return "Thanks for applying. We aren't able to accept this application right now.";
  }
  const rule = parseRuleNumber(app.reason || "");
  return ASK_QUESTIONS[rule] ?? ASK_QUESTIONS[2];
}
