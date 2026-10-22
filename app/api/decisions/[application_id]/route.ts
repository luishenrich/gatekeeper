import { NextRequest, NextResponse } from "next/server";
import { requireLead } from "@/lib/auth/requireLead";
import { getServiceClient } from "@/lib/supabase/server";
import { hashHandle, hashPhone, hashEmail } from "@/lib/hmac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ application_id: string }> }) {
  if (!(await requireLead(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { application_id } = await params;
    const body = await req.json();
    const { decision, report_to_blocklist, evidence } = body;

    if (!decision || !["accept", "decline"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    if (report_to_blocklist && !evidence) {
      return NextResponse.json({ error: "Evidence required for blocklist report" }, { status: 400 });
    }

    const { data: application }: { data: any | null } = await getServiceClient()
      .from("applications")
      .select("*, community_id")
      .eq("id", application_id)
      .single();

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    await getServiceClient().from("decisions").insert({
      application_id,
      decision,
      score: decision === "accept" ? 100 : 0,
      reason: `Moderator decision: ${decision}`,
      signals: {},
      decided_by: "moderator",
      final: true,
    } as any);

    let blocklist_entry_id: string | undefined;
    let blocklist_status: string | undefined;
    let reply_draft: { channel: string; text: string } | undefined;

    if (report_to_blocklist && decision === "decline") {
      const phone_hmac = application.phone ? hashPhone(application.phone) : null;
      const handle_hmac = application.handle ? hashHandle(application.handle) : null;
      const email_hmac = application.email ? hashEmail(application.email) : null;

      const { data: entry }: { data: any | null } = await getServiceClient()
        .from("blocklist_entries")
        .insert({
          community_id: application.community_id,
          phone_hmac,
          handle_norm_hmac: handle_hmac,
          email_hmac,
          evidence,
          reporter: "moderator",
          status: "confirmed",
        } as any)
        .select("id")
        .single();

      if (entry) {
        blocklist_entry_id = entry.id;
        blocklist_status = "confirmed";
      }
    }

    if (application.channel && application.channel !== "web") {
      if (decision === "accept") {
        reply_draft = {
          channel: application.channel,
          text: "Thanks! Your application has been accepted. A community lead will reach out shortly with next steps.",
        };
      } else if (decision === "decline") {
        reply_draft = {
          channel: application.channel,
          text: "Thanks for applying. We aren't able to accept this application right now.",
        };
      }
    }

    await getServiceClient().from("audit_log").insert({
      community_id: application.community_id,
      actor: "moderator",
      action: "moderator_decision",
      details: { application_id, decision, report_to_blocklist, blocklist_entry_id },
    } as any);

    return NextResponse.json({
      ok: true,
      blocklist_entry_id,
      blocklist_status,
      reply_draft,
    });
  } catch (error: any) {
    console.error("Decision error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
