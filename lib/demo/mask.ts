/** Projector mask: `+44 77•• •••555`. Never the raw number. */
export function maskDemoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3) || "•••";
  if (digits.startsWith("44") && digits.length >= 8) {
    const national = digits.slice(2);
    return `+44 ${national.slice(0, 2)}•• •••${last3}`;
  }
  const head = digits.slice(0, Math.min(2, Math.max(0, digits.length - 3)));
  return `+${head} •••${last3}`;
}

const PHONE_KEYS = new Set(["from", "wa_id", "phone", "sender_id", "channel_user_id"]);

export function redactPhone(value: string, phone: string): string {
  const masked = maskDemoPhone(phone);
  const digits = phone.replace(/\D/g, "");
  let out = value.split(phone).join(masked);
  if (digits) {
    out = out.split(digits).join(masked);
    if (digits.startsWith("44")) out = out.split(`0${digits.slice(2)}`).join(masked);
  }
  return out;
}

/** Copy a webhook body for the response, with the applicant number masked. */
export function maskPayload(value: unknown, phone: string): unknown {
  const masked = maskDemoPhone(phone);
  const walk = (node: unknown, key?: string): unknown => {
    if (typeof node === "string") {
      if (key && PHONE_KEYS.has(key)) return masked;
      if (key === "phone_number_id" || key === "display_phone_number") return node;
      return redactPhone(node, phone);
    }
    if (Array.isArray(node)) return node.map((item) => walk(item));
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) out[k] = walk(v, k);
      return out;
    }
    return node;
  };
  return walk(value);
}
