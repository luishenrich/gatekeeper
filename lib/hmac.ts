import "server-only";
import crypto from "crypto";

function normalizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[._-]/g, "")
    .replace(/\d+$/, "");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function hmac(value: string): string {
  const secret = process.env.BLOCKLIST_HMAC_SECRET;
  if (!secret) {
    throw new Error("BLOCKLIST_HMAC_SECRET not configured");
  }
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function hashHandle(handle: string): string {
  return hmac(normalizeHandle(handle));
}

export function hashPhone(phone: string): string {
  return hmac(normalizePhone(phone));
}

/** Display form like `+44 7700 ***123`. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3) || "•••";
  if (digits.startsWith("44") && digits.length > 6) {
    return `+44 ${digits.slice(2, 6)} ***${last3}`;
  }
  const cc = digits.slice(0, Math.min(2, digits.length));
  return `+${cc} ***${last3}`;
}

/** HMAC when the secret is set, otherwise a masked number. */
export function auditPhone(phone: string): string {
  try {
    return hashPhone(phone);
  } catch {
    return maskPhone(phone);
  }
}

export function hashEmail(email: string): string {
  return hmac(normalizeEmail(email));
}

export { normalizeHandle, normalizePhone, normalizeEmail };
