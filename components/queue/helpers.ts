import type { Decision, QueueApp, UiSignal } from "./types";

export const COMMUNITIES = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
] as const;

export const RULE_TEXTS: Record<number, string> = {
  1: "You build. You are actively building with AI — show a repo, demo, or concrete work.",
  2: "Specifics over buzzwords. Say what you build or want to learn.",
  3: "London-based or regularly attending. We meet in person in London.",
  4: "No pitching. Sales/recruiting/VC roles need to confirm intent.",
  5: 'Zero tolerance: crypto/forex "guaranteed returns", fake recruiters asking for ID/bank details, link spam, phishing, or bots.',
};

export function decisionRank(d: Decision): number {
  if (d === "decline") return 0;
  if (d === "ask") return 1;
  return 2;
}

export function sortQueue(items: QueueApp[]): QueueApp[] {
  return [...items].sort((a, b) => {
    const aHit = a.signals?.blocklist_hit === true || !!a.blocklist_match;
    const bHit = b.signals?.blocklist_hit === true || !!b.blocklist_match;
    if (aHit !== bHit) return aHit ? -1 : 1;
    const dr = decisionRank(a.decision) - decisionRank(b.decision);
    if (dr !== 0) return dr;
    const at = a.created_at ? Date.parse(a.created_at) : 0;
    const bt = b.created_at ? Date.parse(b.created_at) : 0;
    return bt - at;
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function parseRuleNumber(reason: string): number {
  const m = reason.match(/rule[s]?\s*(\d+)/i);
  if (m) return Number(m[1]);
  if (/crypto|presale|recruit|passport|bank|guaranteed/i.test(reason)) return 5;
  if (/sales|pitch/i.test(reason)) return 4;
  if (/london|remote/i.test(reason)) return 3;
  if (/ask|specific|building/i.test(reason)) return 2;
  return 1;
}

export function draftFor(decision: Decision, app: QueueApp): string {
  if (decision === "accept") {
    return `Hi ${app.name.split(" ")[0] || "there"}, welcome — you're in. Join us via the invite your community lead will share. Looking forward to what you ship.`;
  }
  if (decision === "ask") {
    const n = parseRuleNumber(app.reason);
    return `Thanks for applying. Quick follow-up on rule ${n}: could you share a concrete project, repo, or demo that shows what you're building?`;
  }
  return `Thanks for applying. We aren't able to accept this application right now. If you think this is a mistake, you can appeal via the community form.`;
}

export function confidenceLabel(score: number): string {
  if (score >= 80) return "High confidence";
  if (score >= 45) return "Medium confidence";
  return "Low confidence";
}

export function otherCommunityName(slug: string): string {
  if (slug === "south-london-hack-nights") return "London Agent Builders";
  if (slug === "london-agent-builders") return "South London Hack Nights";
  return "a partner community";
}

export function normalizeApp(raw: QueueApp): QueueApp {
  const hit = raw.signals?.blocklist_hit === true || !!raw.blocklist_match;
  if (!hit) return raw;
  const match = raw.blocklist_match || {};
  return {
    ...raw,
    blocklist_match: {
      ...match,
      prior_community_name:
        match.prior_community_name || otherCommunityName(raw.community_slug),
      hash_prefix: match.hash_prefix,
    },
  };
}

export function buildSignals(app: QueueApp): UiSignal[] {
  const s = app.signals || {};
  const out: UiSignal[] = [];

  const rf = s.rules_fit;
  if (rf === null || rf === undefined) {
    out.push({ key: "rules_fit", label: "Rules fit", status: "unknown", evidence: "not checked" });
  } else if (typeof rf === "boolean") {
    out.push({
      key: "rules_fit",
      label: "Rules fit",
      status: rf ? "pass" : "fail",
      evidence: rf ? "Fits community rules" : "Weak rules fit",
    });
  } else {
    const refs = Array.isArray(rf.rule_refs) ? rf.rule_refs.join(", ") : "";
    const score = rf.score ?? 0;
    out.push({
      key: "rules_fit",
      label: "Rules fit",
      status: score >= 70 ? "pass" : score >= 40 ? "unknown" : "fail",
      evidence: `score ${score}${refs ? ` · ${refs}` : ""}`,
    });
  }

  const st = s.spam_text;
  if (st === null || st === undefined) {
    out.push({ key: "spam_text", label: "Spam text", status: "unknown", evidence: "not checked" });
  } else if (typeof st === "boolean") {
    out.push({
      key: "spam_text",
      label: "Spam text",
      status: st ? "fail" : "pass",
      evidence: st ? "Spam patterns detected" : "No spam patterns",
    });
  } else {
    const pats = Array.isArray(st.matched_patterns) ? st.matched_patterns.join(", ") : "";
    const score = st.score ?? 0;
    out.push({
      key: "spam_text",
      label: "Spam text",
      status: score >= 0.5 ? "fail" : "pass",
      evidence: score >= 0.5 ? `Matches ${pats || "spam patterns"}` : "Clean",
    });
  }

  const sfs = s.stopforumspam;
  if (sfs === null || sfs === undefined) {
    out.push({
      key: "stopforumspam",
      label: "StopForumSpam",
      status: "unknown",
      evidence: "not checked",
    });
  } else if (typeof sfs === "boolean") {
    out.push({
      key: "stopforumspam",
      label: "StopForumSpam",
      status: sfs ? "fail" : "pass",
      evidence: sfs ? "Listed" : "Not listed",
    });
  } else {
    out.push({
      key: "stopforumspam",
      label: "StopForumSpam",
      status: sfs.appears ? "fail" : "pass",
      evidence: sfs.appears
        ? `appears · freq ${sfs.frequency ?? "?"} · conf ${sfs.confidence ?? "?"}`
        : "email not listed (0 reports)",
    });
  }

  const gh = s.github;
  if (gh === null || gh === undefined) {
    out.push({
      key: "github",
      label: "GitHub",
      status: app.github ? "unknown" : "fail",
      evidence: app.github ? `${app.github} · not checked` : "none given",
    });
  } else if (typeof gh === "boolean") {
    out.push({
      key: "github",
      label: "GitHub",
      status: gh ? "pass" : "fail",
      evidence: gh ? app.github || "exists" : "none given",
    });
  } else {
    out.push({
      key: "github",
      label: "GitHub",
      status: gh.exists ? "pass" : "fail",
      evidence: gh.exists
        ? `${app.github || "account"} · ${gh.account_age_days ?? "?"}d · ${gh.public_repos ?? "?"} repos`
        : "none given",
    });
  }

  const dp = s.devpost;
  if (dp === null || dp === undefined) {
    out.push({ key: "devpost", label: "Devpost", status: "unknown", evidence: "not found" });
  } else if (typeof dp === "boolean") {
    out.push({
      key: "devpost",
      label: "Devpost",
      status: dp ? "pass" : "unknown",
      evidence: dp ? "projects found" : "not found",
    });
  } else {
    const n = dp.projects_found ?? 0;
    out.push({
      key: "devpost",
      label: "Devpost",
      status: n > 0 ? "pass" : "unknown",
      evidence: n > 0 ? `${n} projects` : "not found",
    });
  }

  const hit = s.blocklist_hit === true || !!app.blocklist_match;
  out.push({
    key: "blocklist",
    label: "Blocklist",
    status: hit ? "fail" : "pass",
    evidence: hit
      ? `hit in ${app.blocklist_match?.prior_community_name || "partner community"}`
      : "no match",
  });

  return out.sort((a, b) => {
    const order = { fail: 0, unknown: 1, pass: 2 };
    return order[a.status] - order[b.status];
  });
}

export function isBlocklistHit(app: QueueApp): boolean {
  return app.signals?.blocklist_hit === true || !!app.blocklist_match;
}

export function isAutoSent(app: QueueApp): boolean {
  return app.auto_sent === true || app.signals?.auto === true;
}

export function sendLabel(channel: string | null | undefined): string {
  if (channel === "whatsapp") return "Send via WhatsApp";
  if (channel === "discord") return "Send via Discord";
  return "Send reply";
}

export function canSendChannel(channel: string | null | undefined): boolean {
  return channel === "whatsapp" || channel === "discord";
}
