import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DecisionBody = {
  decision?: string;
  report_to_blocklist?: boolean;
  evidence?: string;
};

/**
 * Mock only. Does not compute HMACs or write blocklist_entries.
 * A reported decision returns a status the queue can show; nothing is stored.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ application_id: string }> },
) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const { application_id } = await params;

  let body: DecisionBody;
  try {
    body = (await req.json()) as DecisionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.decision !== "accept" && body.decision !== "decline") {
    return NextResponse.json(
      { error: "Decision must be accept or decline" },
      { status: 400 },
    );
  }

  const report = body.report_to_blocklist === true;
  const evidence = body.evidence?.trim() ?? "";
  if (report && !evidence) {
    return NextResponse.json(
      { error: "Evidence is required when reporting to the shared blocklist" },
      { status: 400 },
    );
  }

  if (!report) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({
    ok: true,
    blocklist_entry_id: `mock-${application_id}`,
    blocklist_status: "pending",
  });
}
