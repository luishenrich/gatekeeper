import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import DashboardClient, { DashboardSkeleton } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const jar = await cookies();
  if (!matchesLeadToken(jar.get("gk_lead")?.value)) {
    redirect("/login?next=/dashboard");
  }

  const useMocks = process.env.USE_MOCKS === "true";
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient useMocks={useMocks} />
      </Suspense>
    </main>
  );
}
