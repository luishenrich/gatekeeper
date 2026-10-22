import { NextRequest } from "next/server";
import { matchesLeadToken, tokensEqual } from "@/lib/auth/lead-token";

export { matchesLeadToken };

/** Bearer QUEUE_ADMIN_TOKEN or the gk_lead cookie. Does not look at a Supabase session. */
export function hasAdminCredential(req: NextRequest): boolean {
  const token = process.env.QUEUE_ADMIN_TOKEN;
  if (!token) return false;

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ") && tokensEqual(bearer.slice(7), token)) {
    return true;
  }

  return matchesLeadToken(req.cookies.get("gk_lead")?.value);
}

export function checkQueueAuth(req: NextRequest): boolean {
  return hasAdminCredential(req);
}
