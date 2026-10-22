import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { handle } = body;

  const isBlocklisted = handle === "@cryptomax_alpha1" || handle === "@best_deals_4u";

  if (isBlocklisted) {
    return NextResponse.json({
      match: true,
      matched_on: ["phone", "handle"],
      status: "confirmed",
      reported_at: "2026-10-22T18:00:00Z",
    });
  }

  return NextResponse.json({ match: false });
}
