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
    <div className="flex flex-col bg-background md:h-[calc(100svh-1rem-3.5rem)] md:overflow-hidden">
      <div className="h-[61px] shrink-0 border-b border-border" />
      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        <div className="border-b border-border md:w-2/5 md:border-b-0 md:border-r">
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
