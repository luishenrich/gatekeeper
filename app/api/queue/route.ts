import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { checkQueueAuth } from "@/lib/auth/queue-admin";
import { hashPhone } from "@/lib/hmac";

type AppRow = {
  id: string;
  community_id: string;
  channel: string | null;
  channel_user_id: string | null;
  name: string | null;
  handle: string | null;
  phone: string | null;
  email: string | null;
  github: string | null;
  text: string | null;
  created_at: string;
};

type DecisionRow = {
  application_id: string;
  decision: string;
  score: number | null;
  reason: string | null;
  signals: Record<string, unknown> | null;
  final: boolean;
  auto_sent: boolean | null;
  created_at: string;
};

function otherCommunityName(slug: string): string {
  if (slug === "south-london-hack-nights") return "London Agent Builders";
  if (slug === "london-agent-builders") return "South London Hack Nights";
  return "a partner community";
}

export async function GET(req: NextRequest) {
  if (!checkQueueAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const community = req.nextUrl.searchParams.get("community");
    if (!community) {
      return NextResponse.json(
        { error: "Missing community query param" },
        { status: 400 }
      );
    }

    const { data: communityRecord } = (await getServiceClient()
      .from("communities")
      .select("id, name")
      .eq("slug", community)
      .single()) as { data: { id: string; name: string } | null };

    if (!communityRecord) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { data: applications } = (await getServiceClient()
      .from("applications")
      .select(
        "id, community_id, channel, channel_user_id, name, handle, phone, email, github, text, created_at"
      )
      .eq("community_id", communityRecord.id)
      .order("created_at", { ascending: false })) as { data: AppRow[] | null };

    if (!applications || applications.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    const { data: decisions } = (await getServiceClient()
      .from("decisions")
      .select("application_id, decision, score, reason, signals, final, auto_sent, created_at")
      .in(
        "application_id",
        applications.map((a) => a.id)
      )
      .order("created_at", { ascending: false })) as { data: DecisionRow[] | null };

    const latestDecisions = new Map<string, DecisionRow>();
    for (const d of decisions || []) {
      if (!latestDecisions.has(d.application_id)) {
        latestDecisions.set(d.application_id, d);
      }
    }

    const queue = applications.flatMap((app) => {
      const latest = latestDecisions.get(app.id);
      if (!latest) return [];
      const signals = (latest.signals || {}) as Record<string, any>;
      const blocklistHit = signals.blocklist_hit === true;
      const inQueue =
        latest.decision === "ask" || blocklistHit || latest.final === false;
      if (!inQueue) return [];

      const nested = signals.blocklist_match;
      const publicSignals = { ...signals };
      delete publicSignals.blocklist_match;

      let blocklist_match = nested || null;
      if (blocklistHit) {
        let hash_prefix: string | undefined;
        if (app.phone) {
          try {
            hash_prefix = `hmac:${hashPhone(app.phone).slice(0, 4)}…`;
          } catch {
            hash_prefix = undefined;
          }
        }
        blocklist_match = {
          matched_on: nested?.matched_on ?? ["phone"],
          status: nested?.status ?? "confirmed",
          reported_at: nested?.reported_at ?? latest.created_at,
          hash_prefix,
          prior_community_name: otherCommunityName(community),
        };
      }

      return [
        {
          id: app.id,
          community_id: app.community_id,
          community_slug: community,
          community_name: communityRecord.name,
          channel: app.channel || "web",
          channel_user_id: app.channel_user_id,
          name: app.name,
          handle: app.handle,
          phone: app.phone,
          email: app.email,
          github: app.github,
          text: app.text,
          created_at: app.created_at,
          decision: latest.decision,
          score: latest.score,
          reason: latest.reason,
          final: latest.final,
          auto_sent: latest.auto_sent === true,
          signals: publicSignals,
          blocklist_match,
        },
      ];
    });

    return NextResponse.json({ applications: queue });
  } catch (error: any) {
    console.error("queue error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
