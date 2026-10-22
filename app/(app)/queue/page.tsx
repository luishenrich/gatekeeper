import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import QueueClient from "@/components/queue/QueueClient";
import { QueueListSkeleton } from "@/components/queue/QueueList";
import { QueueDetailSkeleton } from "@/components/queue/QueueDetail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Review queue" };

function QueueFallback() {
  return (
    <div className="flex flex-col md:h-[calc(100dvh-66px)] md:overflow-hidden">
      <div className="h-[70px] shrink-0 border-b-2 border-slate-200" />
      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        <div className="border-b-2 border-slate-200 md:w-2/5 md:border-b-0 md:border-r-2">
          <QueueListSkeleton />
        </div>
        <div className="flex flex-col md:w-3/5">
          <QueueDetailSkeleton />
        </div>
      </div>
    </div>
  );
}

export default async function QueuePage() {
  const jar = await cookies();
  if (!matchesLeadToken(jar.get("gk_lead")?.value)) {
    redirect("/login?next=/queue");
  }
  const useMocks = process.env.USE_MOCKS === "true";
  return (
    <Suspense fallback={<QueueFallback />}>
      <QueueClient useMocks={useMocks} />
    </Suspense>
  );
}
