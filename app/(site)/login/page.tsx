import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import LoginForm from "./LoginForm";
import { safeNext } from "./safe-next";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const jar = await cookies();
  if (matchesLeadToken(jar.get("gk_lead")?.value)) {
    redirect(next);
  }

  return <LoginForm next={next} />;
}
