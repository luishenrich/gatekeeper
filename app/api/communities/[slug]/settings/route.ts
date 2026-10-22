import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { requireLead } from "@/lib/auth/requireLead";

type CommunitySettings = {
  id: string;
  slug: string;
  name: string;
  auto_mode: boolean;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await requireLead(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const { data, error } = (await getServiceClient()
    .from("communities")
    .select("id, slug, name, auto_mode")
    .eq("slug", slug)
    .maybeSingle()) as { data: CommunitySettings | null; error: { message: string } | null };

  if (error) {
    console.error("community settings read failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: data.slug,
    name: data.name,
    auto_mode: data.auto_mode === true,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await requireLead(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  let body: { auto_mode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.auto_mode !== "boolean") {
    return NextResponse.json({ error: "auto_mode boolean is required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = (await db
    .from("communities")
    .update({ auto_mode: body.auto_mode } as any)
    .eq("slug", slug)
    .select("id, slug, name, auto_mode")
    .maybeSingle()) as { data: CommunitySettings | null; error: { message: string } | null };

  if (error) {
    console.error("community settings update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  await db.from("audit_log").insert({
    community_id: data.id,
    actor: "moderator",
    action: "community_settings",
    details: { slug: data.slug, auto_mode: body.auto_mode },
  } as any);

  return NextResponse.json({
    slug: data.slug,
    name: data.name,
    auto_mode: data.auto_mode === true,
  });
}
