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

export function hashEmail(email: string): string {
  return hmac(normalizeEmail(email));
}

export { normalizeHandle, normalizePhone, normalizeEmail };
