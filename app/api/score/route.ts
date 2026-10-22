import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "TODO: implement scorer logic" },
    { status: 501 }
  );
}
