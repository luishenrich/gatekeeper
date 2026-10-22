import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasLeadPageAccess } from "@/lib/auth/requireLeadPage";
import DashboardClient, { DashboardSkeleton } from "./DashboardClient";
import { BENCHMARK } from "@/lib/ui/benchmark";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  if (!(await hasLeadPageAccess())) {
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
