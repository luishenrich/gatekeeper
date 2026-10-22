import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { hashHandle, hashPhone, hashEmail } from "@/lib/hmac";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = process.env.BOT_API_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { handle, email, phone } = body;

    if (!handle && !email && !phone) {
      return NextResponse.json({ error: "At least one identifier required" }, { status: 400 });
    }

    const phone_hmac = phone ? hashPhone(phone) : null;
    const handle_hmac = handle ? hashHandle(handle) : null;
    const email_hmac = email ? hashEmail(email) : null;

    const conditions = [];
    if (phone_hmac) conditions.push(`phone_hmac.eq.${phone_hmac}`);
    if (handle_hmac) conditions.push(`handle_norm_hmac.eq.${handle_hmac}`);
    if (email_hmac) conditions.push(`email_hmac.eq.${email_hmac}`);

    const { data: matches }: { data: any[] | null } = await supabaseServer
      .from("blocklist_entries")
      .select("phone_hmac, handle_norm_hmac, email_hmac, status, created_at")
      .eq("status", "confirmed")
      .or(conditions.join(","));

    if (!matches || matches.length === 0) {
      return NextResponse.json({ match: false });
    }

    const match: any = matches[0];
    const matched_on: string[] = [];
    if (phone_hmac && match.phone_hmac === phone_hmac) matched_on.push("phone");
    if (handle_hmac && match.handle_norm_hmac === handle_hmac) matched_on.push("handle");
    if (email_hmac && match.email_hmac === email_hmac) matched_on.push("email");

    return NextResponse.json({
      match: true,
      matched_on,
      status: match.status,
      reported_at: match.created_at,
    });
  } catch (error: any) {
    console.error("Blocklist check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
