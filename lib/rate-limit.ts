const WINDOW_MS = 60_000;
const LIMIT = 10;

const hits = new Map<string, number[]>();

/** Sliding window. Returns false when the IP is already at the limit. */
export function allowRequest(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) || []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
