import { NextRequest, NextResponse } from "next/server";
import rawQueue from "@/fixtures/queue.json";
import type { QueueApplication } from "@/lib/queue-types";

export const dynamic = "force-dynamic";

const applications = rawQueue as QueueApplication[];

type ScoreBody = {
  community_slug?: string;
  application?: {
    name?: string;
    handle?: string;
    phone?: string;
    email?: string;
    github?: string;
    text?: string;
  };
};

function findFixture(
  application: ScoreBody["application"],
  communitySlug?: string,
): QueueApplication | undefined {
  const handle = application?.handle?.trim().toLowerCase();
  if (!handle) return undefined;
  const matches = applications.filter(
    (row) => row.handle.toLowerCase() === handle,
  );
  if (communitySlug) {
    const exact = matches.find((row) => row.community_slug === communitySlug);
    if (exact) return exact;
  }
  return matches[0];
}

/** Mock only. Does not compute HMACs or write blocklist_entries. */
export async function POST(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  let body: ScoreBody;
  try {
    body = (await req.json()) as ScoreBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const found = findFixture(body.application, body.community_slug);
  if (found) {
    return NextResponse.json({
      application_id: found.id,
      decision: found.decision,
      score: found.score,
      reason: found.reason,
      signals: found.signals,
      ...(found.blocklist_match
        ? { blocklist_match: found.blocklist_match }
        : {}),
    });
  }

  const github = body.application?.github?.trim();
  return NextResponse.json({
    application_id: "mock-new",
    decision: "ask",
    score: 50,
    reason: "Mock response: application needs review.",
    signals: {
      rules_fit: { score: 50, rule_refs: [] },
      spam_text: { score: 0, matched_patterns: [] },
      stopforumspam: null,
      github: github
        ? { exists: true, account_age_days: 100, public_repos: 1 }
        : null,
      devpost: null,
      blocklist_hit: false,
    },
  });
}
