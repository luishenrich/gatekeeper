import { NextRequest, NextResponse } from "next/server";
import queue from "@/fixtures/queue.json";
import { emptyStats, type StatsResponse } from "@/lib/stats";

export async function GET(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const community = req.nextUrl.searchParams.get("community");
  if (!community) {
    return NextResponse.json({ error: "Missing community query param" }, { status: 400 });
  }

  const rows = queue.filter((app) => app.community_slug === community);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const stats: StatsResponse = emptyStats();
  const newestFirst = [...rows].reverse();
  const now = Date.now();

  for (const app of rows) {
    stats.handled_today += 1;
    if (app.decision === "accept") stats.accepted += 1;
    else if (app.decision === "ask") stats.asked += 1;
    else if (app.decision === "decline") stats.declined += 1;
    if (app.signals.blocklist_hit === true) stats.blocklist_hits_cross_community += 1;

    const channel = app.channel || "web";
    const wouldAutoSend =
      channel !== "web" &&
      app.signals.blocklist_hit !== true &&
      (app.decision === "ask" || (app.decision === "accept" && app.score >= 80));
    if (wouldAutoSend) stats.auto_sent += 1;
  }

  stats.time_saved_minutes_estimate = stats.handled_today * 5;
  stats.recent = newestFirst.slice(0, 10).map((app, index) => ({
    application_id: app.id,
    name: app.name,
    decision: app.decision,
    score: app.score,
    channel: app.channel || "web",
    created_at: new Date(now - index * 60_000).toISOString(),
  }));

  return NextResponse.json(stats);
}
