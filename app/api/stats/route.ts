import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { requireLead } from "@/lib/auth/requireLead";
import { londonDayRange } from "@/lib/london-day";
import { emptyStats, type StatsResponse } from "@/lib/stats";

type AppRow = {
  id: string;
  name: string | null;
  channel: string | null;
};

type DecisionRow = {
  application_id: string;
  decision: string;
  score: number | null;
  signals: Record<string, unknown> | null;
  created_at: string;
};

export async function GET(req: NextRequest) {
  if (!(await requireLead(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const community = req.nextUrl.searchParams.get("community");
  if (!community) {
    return NextResponse.json({ error: "Missing community query param" }, { status: 400 });
  }

  try {
    const db = getServiceClient();
    const { data: communityRecord, error: communityError } = (await db
      .from("communities")
      .select("id")
      .eq("slug", community)
      .maybeSingle()) as { data: { id: string } | null; error: { message: string } | null };

    if (communityError) {
      console.error("stats community lookup failed", communityError);
      return NextResponse.json({ error: communityError.message }, { status: 500 });
    }
    if (!communityRecord) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { data: applications, error: appError } = (await db
      .from("applications")
      .select("id, name, channel")
      .eq("community_id", communityRecord.id)) as {
      data: AppRow[] | null;
      error: { message: string } | null;
    };

    if (appError) {
      console.error("stats applications lookup failed", appError);
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    const apps = applications || [];
    const { start, end } = londonDayRange();

    if (apps.length === 0) {
      const autoSent = await countAutoSent(communityRecord.id, start, end);
      return NextResponse.json({ ...emptyStats(), auto_sent: autoSent });
    }

    const byId = new Map(apps.map((app) => [app.id, app]));
    const { data: decisions, error: decisionError } = (await db
      .from("decisions")
      .select("application_id, decision, score, signals, created_at")
      .in(
        "application_id",
        apps.map((app) => app.id)
      )
      .order("created_at", { ascending: false })) as {
      data: DecisionRow[] | null;
      error: { message: string } | null;
    };

    if (decisionError) {
      console.error("stats decisions lookup failed", decisionError);
      return NextResponse.json({ error: decisionError.message }, { status: 500 });
    }

    const latest = new Map<string, DecisionRow>();
    for (const row of decisions || []) {
      if (!latest.has(row.application_id)) latest.set(row.application_id, row);
    }

    const stats: StatsResponse = emptyStats();

    const ranked = [...latest.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const row of ranked) {
      const created = new Date(row.created_at).getTime();
      if (created < start.getTime() || created >= end.getTime()) continue;
      stats.handled_today += 1;
      if (row.decision === "accept") stats.accepted += 1;
      else if (row.decision === "ask") stats.asked += 1;
      else if (row.decision === "decline") stats.declined += 1;
      const signals = row.signals || {};
      if (signals.blocklist_hit === true) stats.blocklist_hits_cross_community += 1;
    }

    stats.auto_sent = await countAutoSent(communityRecord.id, start, end);
    stats.time_saved_minutes_estimate = stats.handled_today * 5;
    stats.recent = ranked.slice(0, 10).map((row) => {
      const app = byId.get(row.application_id);
      return {
        application_id: row.application_id,
        name: app?.name || "",
        decision: row.decision,
        score: row.score ?? 0,
        channel: app?.channel || "web",
        created_at: row.created_at,
      };
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function countAutoSent(communityId: string, start: Date, end: Date): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("auto", true)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());
  if (error) {
    console.error("stats auto_sent lookup failed", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}
