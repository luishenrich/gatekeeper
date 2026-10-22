import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { WhatsAppAdapter } from "@/lib/channels/whatsapp";

/** Reply text for the two auto-send cases. Decline, blocklist, and web never qualify. */
export function autoReplyText(
  decision: string,
  reason: string,
  score: number
): string | null {
  if (decision === "ask") {
    const question = reason.trim();
    return question
      ? question
      : "Thanks for applying. Could you share a bit more about what you're building?";
  }
  if (decision === "accept" && score >= 80) {
    return "Thanks! Your application has been accepted. A community lead will reach out shortly with next steps.";
  }
  return null;
}

/**
 * After a scorer decision, send only:
 * - ask: the clarifying question
 * - accept with score >= 80: the welcome
 * Never decline, blocklist hits, or web. A failed send is audited and swallowed
 * so the application stays in the queue.
 */
export async function maybeAutoSend(opts: {
  autoMode: boolean;
  communityId: string;
  applicationId: string;
  decision: string;
  reason: string;
  score: number;
  blocklistHit: boolean;
  channel?: string | null;
  channelUserId?: string | null;
  phone?: string | null;
}): Promise<boolean> {
  const channel = opts.channel || "web";
  const text = autoReplyText(opts.decision, opts.reason, opts.score);
  if (!opts.autoMode || opts.blocklistHit || !text) return false;
  if (channel !== "whatsapp" && channel !== "discord") return false;

  const to =
    opts.channelUserId ||
    (opts.phone ? String(opts.phone).replace(/^\+/, "") : null);
  if (!to) {
    await logAuto(opts, channel, false);
    return false;
  }

  try {
    if (channel === "whatsapp") {
      const whatsapp = new WhatsAppAdapter();
      await whatsapp.sendReply(to.startsWith("+") ? to : `+${to}`, text);
    } else {
      console.log(
        `[auto-send] discord draft logged for application ${opts.applicationId}`
      );
    }
    await logAuto(opts, channel, true);
    return true;
  } catch (error) {
    console.error("auto-send failed", error);
    await logAuto(opts, channel, false);
    return false;
  }
}

async function logAuto(
  opts: { communityId: string; applicationId: string; decision: string },
  channel: string,
  ok: boolean
): Promise<void> {
  const { error } = await getServiceClient().from("audit_log").insert({
    community_id: opts.communityId,
    actor: "system",
    action: ok ? "auto_send" : "auto_send_failed",
    auto: ok,
    details: {
      application_id: opts.applicationId,
      decision: opts.decision,
      channel,
    },
  } as any);
  if (error) console.error("auto-send audit failed", error);
}
