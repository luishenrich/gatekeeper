import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { scoreApplication } from "@/lib/scorer";
import { hashHandle, hashPhone, hashEmail } from "@/lib/hmac";
import { classifySpamText } from "@/lib/spam-classifier";
import { checkStopForumSpam, checkGitHub, checkDevpost } from "@/lib/signals";
import type { Application } from "@/lib/scorer";

export interface ScoringResult {
  application_id: string;
  decision: string;
  score: number;
  reason: string;
  signals: any;
  blocklist_match?: any;
}

export async function scoreApplicationInternal(
  communitySlug: string,
  application: {
    name?: string;
    handle?: string;
    phone?: string;
    email?: string;
    github?: string;
    text: string;
    channel?: string;
    channel_user_id?: string;
    forwarded?: boolean;
  }
): Promise<ScoringResult> {
  const db = getServiceClient();

  const { data: community, error: communityError } = await db
    .from("communities")
    .select("id, rules_md")
    .eq("slug", communitySlug)
    .maybeSingle();

  if (communityError || !community) {
    console.error("score: community lookup failed", {
      communitySlug,
      error: communityError,
    });
    const detail = communityError
      ? [communityError.message, communityError.code, communityError.details, communityError.hint]
          .filter(Boolean)
          .join(" ")
      : "no row returned";
    throw new Error(`Community not found: ${detail}`);
  }

  const { data: appRecord, error: appError } = await db
    .from("applications")
    .insert({
      community_id: community.id,
      name: application.name,
      handle: application.handle,
      phone: application.phone,
      email: application.email,
      github: application.github,
      text: application.text,
      channel: application.channel || "web",
      channel_user_id: application.channel_user_id,
    } as any)
    .select("id")
    .single();

  if (appError || !appRecord) {
    console.error("score: application insert failed", appError);
    const detail = appError
      ? [appError.message, appError.code, appError.details].filter(Boolean).join(" ")
      : "no row returned";
    throw new Error(`Failed to create application: ${detail}`);
  }

  const phone_hmac = application.phone ? hashPhone(application.phone) : null;
  const handle_hmac = application.handle ? hashHandle(application.handle) : null;
  const email_hmac = application.email ? hashEmail(application.email) : null;

  const { data: blocklistMatches, error: blocklistError } = await db
    .from("blocklist_entries")
    .select("phone_hmac, handle_norm_hmac, email_hmac, status, created_at")
    .eq("status", "confirmed")
    .or(`phone_hmac.eq.${phone_hmac},handle_norm_hmac.eq.${handle_hmac},email_hmac.eq.${email_hmac}`);

  if (blocklistError) {
    console.error("score: blocklist lookup failed", blocklistError);
    throw new Error(
      `Blocklist check failed: ${[blocklistError.message, blocklistError.code, blocklistError.details].filter(Boolean).join(" ")}`
    );
  }

  let blocklist_match: any = undefined;
  let decision = "";
  let score = 0;
  let reason = "";
  const signals: any = {
    rules_fit: { score: 0, rule_refs: [] },
    spam_text: { score: 0, matched_patterns: [] },
    stopforumspam: null,
    github: null,
    devpost: null,
    blocklist_hit: false,
    forwarded: application.forwarded || false,
  };

  if (blocklistMatches && blocklistMatches.length > 0) {
    const match = blocklistMatches[0];
    const matched_on: string[] = [];
    if (phone_hmac && match.phone_hmac === phone_hmac) matched_on.push("phone");
    if (handle_hmac && match.handle_norm_hmac === handle_hmac) matched_on.push("handle");
    if (email_hmac && match.email_hmac === email_hmac) matched_on.push("email");

    signals.blocklist_hit = true;
    signals.spam_text = classifySpamText(application.text);

    blocklist_match = {
      matched_on,
      status: "confirmed",
      reported_at: match.created_at,
    };

    if (matched_on.length === 1 && matched_on[0] === "email") {
      decision = "ask";
      score = 30;
      reason = "Matched shared blocklist on email (weak signal); manual review required.";
    } else {
      decision = "decline";
      score = 10;
      reason = `Matched shared blocklist on ${matched_on.join(", ")} (confirmed in another community).`;
    }
  } else {
    const [spamResult, sfsResult, ghResult, devpostResult, scorerResult] = await Promise.all([
      Promise.resolve(classifySpamText(application.text)),
      checkStopForumSpam(application.email, application.handle),
      checkGitHub(application.github),
      checkDevpost(application.handle),
      scoreApplication(community.rules_md || "", {
        name: application.name,
        handle: application.handle,
        phone: application.phone,
        email: application.email,
        github: application.github,
        linkedin: null,
        text: application.text,
        community_slug: communitySlug,
      } as Application),
    ]);

    decision = scorerResult.verdict;
    score = scorerResult.score;
    reason = scorerResult.reasons.join(" ");

    signals.rules_fit = {
      score: scorerResult.score,
      rule_refs: scorerResult.rule_refs,
    };
    signals.spam_text = spamResult;
    signals.stopforumspam = sfsResult;
    signals.github = ghResult;
    signals.devpost = devpostResult;
  }

  const { error: decisionError } = await db.from("decisions").insert({
    application_id: appRecord.id,
    decision,
    score,
    reason,
    signals,
    decided_by: "scorer",
    final: false,
  } as any);

  if (decisionError) {
    console.error("score: decision insert failed", decisionError);
    throw new Error(
      `Failed to save decision: ${[decisionError.message, decisionError.code, decisionError.details].filter(Boolean).join(" ")}`
    );
  }

  const { error: auditError } = await db.from("audit_log").insert({
    community_id: community.id,
    actor: "system",
    action: "score_application",
    details: { application_id: appRecord.id, decision, score, channel: application.channel },
  } as any);

  if (auditError) {
    console.error("score: audit insert failed", auditError);
    throw new Error(
      `Failed to write audit log: ${[auditError.message, auditError.code, auditError.details].filter(Boolean).join(" ")}`
    );
  }

  return {
    application_id: appRecord.id,
    decision,
    score,
    reason,
    signals,
    blocklist_match,
  };
}
