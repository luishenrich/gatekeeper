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

  verifySignature(rawBody: string, header: string): boolean {
    if (!this.appSecret || !header?.startsWith("sha256=")) return false;
    const expected = crypto.createHmac("sha256", this.appSecret).update(rawBody, "utf8").digest("hex");
    const receivedHex = header.slice(7);
    const a = Buffer.from(receivedHex, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async parseInbound(req: Request): Promise<InboundMessage | null> {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Hub-Signature-256") || "";

    if (!this.verifySignature(rawBody, signature)) {
      throw new Error("Invalid signature");
    }

    const data = JSON.parse(rawBody);

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

          const waId = String(message.from || "").replace(/^\+/, "");
          const text = message.text?.body || "";
          const context = message.context;
          const forwarded = !!(context?.forwarded || context?.frequently_forwarded);
          const contacts: { wa_id?: string; profile?: { name?: string } }[] = value.contacts || [];
          const contact =
            contacts.find((c) => String(c.wa_id || "").replace(/^\+/, "") === waId) || contacts[0];
          const profileName = String(contact?.profile?.name || "").trim();
          const handleMatch = profileName.match(/@[A-Za-z0-9._-]+/);
          const handle = handleMatch?.[0];
          const name = handle
            ? profileName.replace(handle, "").replace(/[()]/g, "").trim() || undefined
            : profileName || undefined;

          return {
            sender_id: waId,
            phone: waId ? `+${waId}` : undefined,
            name,
            handle,
            text,
            channel_ref: messageId,
            forwarded,
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

    const res = await fetch(`https://graph.facebook.com/v26.0/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: waId,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`WhatsApp API error (${res.status}): ${body}`);
    }
  }
}
