import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = process.env.BOT_API_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "TODO: implement blocklist check logic" },
    { status: 501 }
  );
}
