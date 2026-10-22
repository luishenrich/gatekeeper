import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CheckBody = {
  community_slug?: string;
  handle?: string;
  email?: string;
  phone?: string;
};

/**
 * Fictional identities already confirmed on the shared blocklist in the demo
 * snapshot. Matching is a literal compare of the fixture values. This route
 * does not compute HMACs, does not read or write blocklist_entries, and
 * returns match-only fields (no evidence).
 */
const CONFIRMED = {
  reported_at: "2026-10-22T18:00:00Z",
  handles: ["cryptomax_alpha", "cryptomax_alpha1", "best_deals_4u"],
  phones: ["447700900901", "447700900903"],
  emails: [
    "max.moonshot@example.com",
    "max.moonshot.vip@example.com",
    "deals4u@example.com",
  ],
};

function normHandle(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "");
}

function normPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/** Mock only. Does not compute HMACs or write blocklist_entries. */
export async function POST(req: NextRequest) {
  if (process.env.USE_MOCKS !== "true") {
    return NextResponse.json({ error: "Mocks disabled" }, { status: 503 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CheckBody;
  try {
    body = (await req.json()) as CheckBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const matchedOn: Array<"phone" | "handle" | "email"> = [];

  if (body.phone && CONFIRMED.phones.includes(normPhone(body.phone))) {
    matchedOn.push("phone");
  }
  if (body.handle && CONFIRMED.handles.includes(normHandle(body.handle))) {
    matchedOn.push("handle");
  }
  if (
    body.email &&
    CONFIRMED.emails.includes(body.email.trim().toLowerCase())
  ) {
    matchedOn.push("email");
  }

  if (matchedOn.length === 0) {
    return NextResponse.json({ match: false });
  }

  return NextResponse.json({
    match: true,
    matched_on: matchedOn,
    status: "confirmed",
    reported_at: CONFIRMED.reported_at,
  });
}
