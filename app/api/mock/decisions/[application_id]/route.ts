import { NextRequest, NextResponse } from "next/server";
import queue from "@/fixtures/queue.json";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ application_id: string }> }
) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const { application_id } = await params;
  const body = await req.json();
  const { decision, report_to_blocklist } = body;

  const app = queue.find((a) => a.id === application_id) as
    | (typeof queue)[number] & { channel?: string }
    | undefined;

  const response: {
    ok: boolean;
    blocklist_entry_id?: string;
    blocklist_status?: string;
    reply_draft?: { channel: string; text: string };
  } = { ok: true };

  if (report_to_blocklist) {
    response.blocklist_entry_id = `bl_${Math.random().toString(36).slice(2, 11)}`;
    response.blocklist_status = "pending";
  }

  const channel = app?.channel && app.channel !== "web" ? app.channel : null;
  if (channel && (decision === "accept" || decision === "decline")) {
    response.reply_draft = {
      channel,
      text:
        decision === "accept"
          ? "Thanks! Your application has been accepted. A community lead will reach out shortly with next steps."
          : "Thanks for applying. We aren't able to accept this application right now.",
    };
  }

  return NextResponse.json(response);
}
