import "server-only";
import crypto from "crypto";
import { ChannelAdapter, InboundMessage } from "./adapter";

export class WhatsAppAdapter implements ChannelAdapter {
  name = "whatsapp";
  private token: string;
  private phoneNumberId: string;
  private appSecret: string;
  private verifyToken: string;
  private processedIds = new Set<string>();

  constructor() {
    this.token = process.env.WHATSAPP_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.appSecret = process.env.WHATSAPP_APP_SECRET || "";
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "";
  }

  async handleVerification(req: Request): Promise<Response | null> {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === this.verifyToken) {
      return new Response(challenge, { status: 200 });
    }

    return null;
  }

  verifySignature(body: string, signature: string): boolean {
    if (!this.appSecret || !signature) return false;
    const expected = crypto
      .createHmac("sha256", this.appSecret)
      .update(body)
      .digest("hex");
    return `sha256=${expected}` === signature;
  }

  async parseInbound(req: Request): Promise<InboundMessage | null> {
    const body = await req.text();
    const signature = req.headers.get("X-Hub-Signature-256") || "";

    if (!this.verifySignature(body, signature)) {
      throw new Error("Invalid signature");
    }

    const data = JSON.parse(body);

    for (const entry of data.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;

        const value = change.value;
        if (!value?.messages) continue;

        for (const message of value.messages) {
          if (message.type !== "text") continue;

          const messageId = message.id;
          if (this.processedIds.has(messageId)) continue;
          this.processedIds.add(messageId);

          if (this.processedIds.size > 1000) {
            const first = this.processedIds.values().next().value;
            if (first) this.processedIds.delete(first);
          }

          const waId = message.from;
          const text = message.text?.body || "";

          return {
            sender_id: waId,
            phone: `+${waId}`,
            text,
            channel_ref: messageId,
          };
        }
      }
    }

    return null;
  }

  async sendReply(to: string, text: string): Promise<void> {
    if (!this.token || !this.phoneNumberId) {
      throw new Error("WhatsApp credentials not configured");
    }

    const waId = to.replace(/^\+/, "");

    await fetch(`https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: waId,
        type: "text",
        text: { body: text },
      }),
    });
  }
}
