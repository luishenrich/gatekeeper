import { NextRequest, NextResponse } from "next/server";
import { WhatsAppAdapter } from "@/lib/channels/whatsapp";
import { scoreApplicationInternal } from "@/lib/scoring";

const adapter = new WhatsAppAdapter();

export async function GET(req: NextRequest) {
  const verification = await adapter.handleVerification(req);
  if (verification) return verification;
  return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const message = await adapter.parseInbound(req);

    if (!message) {
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const requested = req.nextUrl.searchParams.get("community");
    const known =
      requested === "london-agent-builders" || requested === "south-london-hack-nights";
    const communitySlug = known
      ? requested
      : process.env.WHATSAPP_COMMUNITY_SLUG || "london-agent-builders";

    await scoreApplicationInternal(communitySlug, {
      name: message.name,
      phone: message.phone,
      handle: message.handle,
      text: message.text,
      channel: "whatsapp",
      channel_user_id: message.sender_id,
      forwarded: message.forwarded,
    });

    // Only automatic outbound allowed: fixed neutral ack (no verdict).
    if (message.phone) {
      await adapter.sendReply(
        message.phone,
        "Thanks, a moderator will review your application."
      );
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    if (error?.message === "Invalid signature") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
