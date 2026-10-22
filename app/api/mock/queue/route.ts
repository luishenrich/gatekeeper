import { NextResponse } from "next/server";
import rawQueue from "@/fixtures/queue.json";
import {
  isInReviewQueue,
  sortQueueNewestFirst,
  type QueueApplication,
} from "@/lib/queue-types";

export const dynamic = "force-dynamic";

const applications = rawQueue as QueueApplication[];

/** Mock only. Does not compute HMACs or write blocklist_entries. */
export async function GET() {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const applicationsInQueue = sortQueueNewestFirst(
    applications.filter(isInReviewQueue),
  );

  return NextResponse.json({ applications: applicationsInQueue });
}
