import { NextRequest, NextResponse } from "next/server";
import queue from "@/fixtures/queue.json";

export async function GET(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const community = req.nextUrl.searchParams.get("community");
  const filtered = queue.filter((app) => {
    const inQueue =
      app.decision === "ask" ||
      app.signals.blocklist_hit === true ||
      app.final === false;
    if (!inQueue) return false;
    if (!community) return true;
    return app.community_slug === community;
  });

  // Newest first (fixture order is demo-friendly; reverse for newest-first feel)
  const applications = [...filtered].reverse();

  return NextResponse.json({ applications });
}
