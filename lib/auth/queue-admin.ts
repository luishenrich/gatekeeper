import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

function tokensEqual(provided: string, token: string): boolean {
  if (provided.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(token));
  } catch {
    return false;
  }
}

export function checkQueueAuth(req: NextRequest): boolean {
  const token = process.env.QUEUE_ADMIN_TOKEN;
  if (!token) return false;

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ") && tokensEqual(bearer.slice(7), token)) {
    return true;
  }

  const cookie = req.cookies.get("gk_lead")?.value;
  return !!cookie && tokensEqual(cookie, token);
}
