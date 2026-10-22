import { NextResponse } from "next/server";
import applicants from "@/fixtures/applicants.json";

export async function GET() {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const queue = applicants.filter(
    (app) => app.decision === "ask" || app.signals.blocklist_hit
  );

  return NextResponse.json({ applications: queue });
}
