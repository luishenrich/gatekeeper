import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { WhatsAppAdapter } from "@/lib/channels/whatsapp";
import { checkQueueAuth } from "@/lib/auth/queue-admin";
import { auditPhone } from "@/lib/hmac";

const NEUTRAL_FALLBACK =
  "Thanks for applying. A community lead will follow up if needed.";

export async function POST(req: NextRequest) {
  if (!checkQueueAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { application_id, text } = body as {
      application_id?: string;
      text?: string;
    };

    if (!application_id || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "application_id and text are required" },
        { status: 400 }
      );
    }

    const { data: application }: { data: any | null } = await getServiceClient()
      .from("applications")
      .select("id, community_id, channel, channel_user_id, phone")
      .eq("id", application_id)
      .single();

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const channel = application.channel || "web";
    if (channel === "web") {
      return NextResponse.json(
        { error: "No outbound channel for web applications" },
        { status: 400 }
      );
    }

    const to =
      application.channel_user_id ||
      (application.phone ? String(application.phone).replace(/^\+/, "") : null);

    if (!to) {
      return NextResponse.json(
        { error: "Missing channel_user_id / phone for send" },
        { status: 400 }
      );
    }

    const message = text.trim() || NEUTRAL_FALLBACK;
    const sent_at = new Date().toISOString();

    if (channel === "whatsapp") {
      const whatsapp = new WhatsAppAdapter();
      await whatsapp.sendReply(to.startsWith("+") ? to : `+${to}`, message);
    } else if (channel === "discord") {
      // Discord applicant replies are out of scope for the join-check bot;
      // log only so the queue click still completes safely.
      console.log(`[channel/send] discord draft logged for ${to}: ${message}`);
    } else {
      return NextResponse.json({ error: `Unsupported channel: ${channel}` }, { status: 400 });
    }

    const phoneLike = channel === "whatsapp" || /^\+?\d[\d\s-]{6,}$/.test(to);
    const recipient = phoneLike
      ? auditPhone(to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`)
      : to;

    await getServiceClient().from("audit_log").insert({
      community_id: application.community_id,
      actor: "moderator",
      action: "channel_send",
      details: { application_id, channel, to: recipient, text: message, sent_at },
    } as any);

    return NextResponse.json({ ok: true, channel, sent_at });
  } catch (error: any) {
    console.error("channel/send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
