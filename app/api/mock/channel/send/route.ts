import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const body = await req.json();
  const { application_id, text } = body;

  if (!application_id || !text?.trim()) {
    return NextResponse.json(
      { error: "application_id and text are required" },
      { status: 400 }
    );
  }

  console.log(`[mock channel/send] ${application_id}: ${text}`);

  return NextResponse.json({
    ok: true,
    channel: "whatsapp",
    sent_at: new Date().toISOString(),
  });
}
