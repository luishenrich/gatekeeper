import { NextRequest, NextResponse } from "next/server";
import statsByCommunity from "@/fixtures/stats.json";

export async function GET(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const community = req.nextUrl.searchParams.get("community");
  if (!community) {
    return NextResponse.json(
      { error: "Missing community query param" },
      { status: 400 }
    );
  }

  const stats =
    (statsByCommunity as Record<string, unknown>)[community] ?? null;
  if (!stats) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  return NextResponse.json(stats);
}
