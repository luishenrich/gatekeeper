import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const body = await req.json();
  const { community_slug, application } = body;

  const mockResponse = {
    application_id: `A${Math.floor(Math.random() * 1000)}`,
    decision: "ask",
    score: 65,
    reason: "Mock response: application needs review",
    signals: {
      rules_fit: true,
      stopforumspam: false,
      github: !!application.github,
      spam_text: false,
      blocklist_hit: false,
    },
  };

  return NextResponse.json(mockResponse);
}
