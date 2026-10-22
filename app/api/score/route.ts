import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "TODO: implement scorer logic" },
    { status: 501 }
  );
}
