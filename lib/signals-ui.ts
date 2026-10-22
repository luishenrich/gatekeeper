import type { Decision, UiSignal } from "@/components/decision-ui";

const RULE_TEXTS: Record<number, string> = {
  1: "You build. You are actively building with AI — show a repo, demo, or concrete work.",
  2: "Specifics over buzzwords. Say what you build or want to learn.",
  3: "London-based or regularly attending. We meet in person in London.",
  4: "No pitching. Sales/recruiting/VC roles need to confirm intent.",
  5: 'Zero tolerance: crypto/forex "guaranteed returns", fake recruiters asking for ID/bank details, link spam, phishing, or bots.',
};

export function parseRuleNumber(reason: string): number {
  const m = reason.match(/rule[s]?\s*(\d+)/i);
  if (m) return Number(m[1]);
  if (/crypto|presale|recruit|passport|bank|guaranteed/i.test(reason)) return 5;
  if (/sales|pitch/i.test(reason)) return 4;
  if (/london|remote/i.test(reason)) return 3;
  if (/ask|specific|building/i.test(reason)) return 2;
  return 1;
}

export function ruleText(n: number): string {
  return RULE_TEXTS[n] || RULE_TEXTS[1];
}

export function buildSignalsFromApi(
  signals: Record<string, unknown> | null | undefined,
  github?: string | null
): UiSignal[] {
  const s = signals || {};
  const out: UiSignal[] = [];

  const rf = s.rules_fit as
    | { score?: number; rule_refs?: string[] }
    | boolean
    | null
    | undefined;
  if (rf === null || rf === undefined) {
    out.push({
      key: "rules_fit",
      label: "Rules fit",
      status: "unknown",
      evidence: "not checked",
    });
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

  const st = s.spam_text as
    | { score?: number; matched_patterns?: string[] }
    | boolean
    | null
    | undefined;
  if (st === null || st === undefined) {
    out.push({
      key: "spam_text",
      label: "Spam text",
      status: "unknown",
      evidence: "not checked",
    });
  } else if (typeof st === "boolean") {
    out.push({
      key: "spam_text",
      label: "Spam text",
      status: st ? "fail" : "pass",
      evidence: st ? "Spam patterns detected" : "No spam patterns",
    });
  } else {
    const pats = Array.isArray(st.matched_patterns)
      ? st.matched_patterns.join(", ")
      : "";
    const score = st.score ?? 0;
    out.push({
      key: "spam_text",
      label: "Spam text",
      status: score >= 0.5 ? "fail" : "pass",
      evidence: score >= 0.5 ? `Matches ${pats || "spam patterns"}` : "Clean",
    });
  }

  const sfs = s.stopforumspam as
    | { appears?: boolean; frequency?: number; confidence?: number }
    | boolean
    | null
    | undefined;
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

  const gh = s.github as
    | { exists?: boolean; account_age_days?: number; public_repos?: number }
    | boolean
    | null
    | undefined;
  if (gh === null || gh === undefined) {
    out.push({
      key: "github",
      label: "GitHub",
      status: github ? "unknown" : "fail",
      evidence: github ? `${github} · not checked` : "none given",
    });
  } else if (typeof gh === "boolean") {
    out.push({
      key: "github",
      label: "GitHub",
      status: gh ? "pass" : "fail",
      evidence: gh ? github || "exists" : "none given",
    });
  } else {
    out.push({
      key: "github",
      label: "GitHub",
      status: gh.exists ? "pass" : "fail",
      evidence: gh.exists
        ? `${github || "account"} · ${gh.account_age_days ?? "?"}d · ${gh.public_repos ?? "?"} repos`
        : "none given",
    });
  }

  const dp = s.devpost as
    | { projects_found?: number }
    | boolean
    | null
    | undefined;
  if (dp === null || dp === undefined) {
    out.push({
      key: "devpost",
      label: "Devpost",
      status: "unknown",
      evidence: "not found",
    });
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

  const hit = s.blocklist_hit === true;
  out.push({
    key: "blocklist_hit",
    label: "Blocklist",
    status: hit ? "fail" : "pass",
    evidence: hit ? "hit in partner community" : "no match",
  });

  return out;
}

export function isDecision(v: unknown): v is Decision {
  return v === "accept" || v === "ask" || v === "decline";
}
