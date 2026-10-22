import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { auditPhone } from "@/lib/hmac";
import { WhatsAppAdapter } from "@/lib/channels/whatsapp";

export function autoReplyText(decision: string): string | null {
  if (decision === "accept") {
    return "Thanks! Your application has been accepted. A community lead will reach out shortly with next steps.";
  }
  if (decision === "decline") {
    return "Thanks for applying. We aren't able to accept this application right now.";
  }
  return null;
}

function auditRecipient(channel: string, to: string): string {
  const phoneLike = channel === "whatsapp" || /^\+?\d[\d\s-]{6,}$/.test(to);
  if (!phoneLike) return to;
  return auditPhone(to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`);
}

/** Sends a clear accept/decline when the community has auto mode on.
 *  Ask decisions and blocklist hits stay for a person. Failures are logged
 *  and do not throw, so scoring still completes. */
export async function maybeAutoSend(opts: {
  autoMode: boolean;
  communityId: string;
  applicationId: string;
  decision: string;
  blocklistHit: boolean;
  channel?: string | null;
  channelUserId?: string | null;
  phone?: string | null;
}): Promise<boolean> {
  const channel = opts.channel || "web";
  const text = autoReplyText(opts.decision);
  if (!opts.autoMode || opts.blocklistHit || !text) return false;
  if (channel !== "whatsapp" && channel !== "discord") return false;

  const to =
    opts.channelUserId ||
    (opts.phone ? String(opts.phone).replace(/^\+/, "") : null);
  if (!to) return false;

  const recipient = auditRecipient(channel, to);
  const db = getServiceClient();

  try {
    if (channel === "whatsapp") {
      const whatsapp = new WhatsAppAdapter();
      await whatsapp.sendReply(to.startsWith("+") ? to : `+${to}`, text);
    } else {
      console.log(`[auto-send] discord logged for ${recipient}: ${text}`);
    }

    await db.from("audit_log").insert({
      community_id: opts.communityId,
      actor: "system",
      action: "auto_send",
      details: {
        application_id: opts.applicationId,
        channel,
        decision: opts.decision,
        to: recipient,
      },
    } as any);
    return true;
  } catch (error) {
    console.error("auto-send failed", error);
    await db.from("audit_log").insert({
      community_id: opts.communityId,
      actor: "system",
      action: "auto_send_failed",
      details: {
        application_id: opts.applicationId,
        channel,
        decision: opts.decision,
        to: recipient,
      },
    } as any);
    return false;
  }
}
