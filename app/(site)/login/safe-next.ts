export const DEFAULT_NEXT = "/queue";

/**
 * Only allow same-origin relative paths: must start with "/" but not "//"
 * (protocol-relative) or "/\" (some browsers normalise "\" to "/").
 */
export function safeNext(raw: string | string[] | null | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || typeof value !== "string") return DEFAULT_NEXT;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_NEXT;
  if (/[\u0000-\u001f]/.test(value)) return DEFAULT_NEXT;
  if (value === "/login" || value.startsWith("/login?") || value.startsWith("/login/")) return DEFAULT_NEXT;
  return value;
}
