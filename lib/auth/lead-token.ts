/** Constant-time string compare that does not use Node's crypto (middleware runs on the Edge). */
export function tokensEqual(provided: string, token: string): boolean {
  if (provided.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}

export function matchesLeadToken(cookie: string | undefined): boolean {
  const token = process.env.QUEUE_ADMIN_TOKEN;
  if (!token || !cookie) return false;
  return tokensEqual(cookie, token);
}
