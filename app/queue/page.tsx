import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import LegacyQueue from "@/components/queue/LegacyQueue";

export const dynamic = "force-dynamic";

function cookieMatches(cookie: string | undefined, token: string): boolean {
  if (!cookie || !token || cookie.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(cookie), Buffer.from(token));
  } catch {
    return false;
  }
}

export default async function QueuePage() {
  const useMocks = process.env.USE_MOCKS === "true";
  const token = process.env.QUEUE_ADMIN_TOKEN || "";
  const jar = await cookies();
  const authed = cookieMatches(jar.get("gk_lead")?.value, token);
  return <LegacyQueue useMocks={useMocks} authed={authed} />;
}
