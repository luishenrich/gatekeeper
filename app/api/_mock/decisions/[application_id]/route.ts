import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ application_id: string }> }
) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  await params;
  const body = await req.json();
  const { report_to_blocklist } = body;

  const response: {
    ok: boolean;
    blocklist_entry_id?: string;
    blocklist_status?: string;
  } = { ok: true };

  if (report_to_blocklist) {
    response.blocklist_entry_id = `bl_${Math.random().toString(36).substr(2, 9)}`;
    response.blocklist_status = "pending";
  }

  return NextResponse.json(response);
}
