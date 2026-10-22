import { NextResponse } from "next/server";
import { scoreApplicationInternal } from "@/lib/scoring";

export async function POST(req: Request) {
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
      channel: "web",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Score error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
