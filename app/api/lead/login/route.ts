import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode } = body as { passcode?: string };

    const token = process.env.QUEUE_ADMIN_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    if (!passcode || passcode.length !== token.length) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    let valid = false;
    try {
      valid = timingSafeEqual(Buffer.from(passcode), Buffer.from(token));
    } catch {
      valid = false;
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("gk_lead", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("lead/login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
