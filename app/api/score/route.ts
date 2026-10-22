import { NextResponse } from "next/server";
import { scoreApplicationInternal } from "@/lib/scoring";
import { allowRequest, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!allowRequest(`score:${clientIp(req)}`)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await req.json();
    const { community_slug, application } = body;

    if (!community_slug || !application?.text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await scoreApplicationInternal(community_slug, {
      name: application.name,
      handle: application.handle,
      phone: application.phone,
      email: application.email,
      github: application.github,
      text: application.text,
      channel: application.channel || "web",
      channel_user_id: application.channel_user_id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Score error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
