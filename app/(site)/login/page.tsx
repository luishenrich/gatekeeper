import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasLeadPageAccess } from "@/lib/auth/requireLeadPage";
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

  if (await hasLeadPageAccess()) {
    redirect(next);
  }

  return <LoginForm next={next} />;
}
