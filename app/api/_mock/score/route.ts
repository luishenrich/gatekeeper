import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const body = await req.json();
  const { application } = body;

  const mockResponse = {
    application_id: `A${Math.floor(Math.random() * 1000)}`,
    decision: "ask",
    score: 65,
    reason: "Mock response: application needs review",
    signals: {
      rules_fit: {
        score: 65,
        rule_refs: [],
      },
      spam_text: {
        score: 0,
        matched_patterns: [],
      },
      stopforumspam: application.email ? {
        appears: false,
        frequency: 0,
        confidence: 0,
      } : null,
      github: application.github ? {
        exists: true,
        account_age_days: 180,
        public_repos: 3,
      } : null,
      devpost: application.handle ? {
        projects_found: 1,
      } : null,
      blocklist_hit: false,
    },
  };

  return NextResponse.json(mockResponse);
}
