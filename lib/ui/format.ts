/** "+44 7700 900123" → "+44 7700 ***123". Never use for blocklist matches. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.length < 6) return "***";
  const tail = digits.slice(-3);
  const head = digits.startsWith("+44") ? "+44 7700" : digits.slice(0, Math.min(4, digits.length - 3));
  return `${head} ***${tail}`;
}

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function initials(name: string | null | undefined, handle?: string | null): string {
  const source = (name || handle || "?").replace(/^@/, "").trim();
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
