import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import DashboardClient, { DashboardSkeleton } from "./DashboardClient";
import { BENCHMARK } from "@/lib/ui/benchmark";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const jar = await cookies();
  if (!matchesLeadToken(jar.get("gk_lead")?.value)) {
    redirect("/login?next=/dashboard");
  }

  const useMocks = process.env.USE_MOCKS === "true";
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient useMocks={useMocks} benchmark={BENCHMARK} />
      </Suspense>
    </div>
  );
}
