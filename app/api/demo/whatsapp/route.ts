import crypto from "crypto";
import { NextResponse } from "next/server";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/server";
import { hashHandle, hashPhone } from "@/lib/hmac";
import { maskPayload, redactPhone } from "@/lib/demo/mask";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COMMUNITIES = ["london-agent-builders", "south-london-hack-nights"] as const;
type CommunitySlug = (typeof COMMUNITIES)[number];

const SCAMMER_PHONE = "+447700900901";
const SCAMMER_HANDLE = "@cryptomax_alpha1";
const SCAMMER_PROFILE = "Max Moonshot @cryptomax_alpha1";
const SCAMMER_TEXT =
  "Hello builders! Exclusive AI token presale, 10x guaranteed, message me for whitelist spot before it closes.";
const NORMAL_PROFILE = "Alex Rivera";
const NORMAL_TEXT =
  "Hi, I build evaluation harnesses for tool-using agents and I maintain a small TypeScript library for them. I live in Hackney and I can make the Tuesday in-person nights. Happy to help with the next hack night.";

const REPORTER_SLUG: CommunitySlug = "london-agent-builders";
const POLL_MS = 25_000;

type Step = Record<string, unknown>;

function isCommunity(value: string): value is CommunitySlug {
  return (COMMUNITIES as readonly string[]).includes(value);
}

function toE164(input: string): string | null {
  const compact = input.trim().replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) return null;
  return compact;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeText(value: unknown, phone: string): string {
  const raw = typeof value === "string" ? value : "Request failed";
  return redactPhone(raw, phone).slice(0, 300);
}

function webhookUrl(req: Request, community: string): string {
  const configured = process.env.GATEKEEPER_API_URL?.replace(/\/$/, "");
  const base = configured || new URL(req.url).origin;
  const url = new URL("/api/whatsapp/webhook", base);
  url.searchParams.set("community", community);
  return url.toString();
}

async function communityBySlug(slug: string) {
  const db = getServiceClient();
  const { data, error } = (await db
    .from("communities")
    .select("id, name, auto_mode")
    .eq("slug", slug)
    .maybeSingle()) as {
    data: { id: string; name: string; auto_mode: boolean | null } | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return data;
}

/** Confirmed blocklist row for the drama number, reported by London Agent Builders. */
async function ensureScammerBlocklist(phone: string, handle: string) {
  const reporter = await communityBySlug(REPORTER_SLUG);
  if (!reporter) throw new Error("Reporter community was not found");
  const db = getServiceClient();
  const phone_hmac = hashPhone(phone);
  const handle_norm_hmac = hashHandle(handle);
  const { data: existing, error: readError } = (await db
    .from("blocklist_entries")
    .select("id, status")
    .eq("community_id", reporter.id)
    .eq("phone_hmac", phone_hmac)
    .limit(1)) as {
    data: { id: string; status: string }[] | null;
    error: { message: string } | null;
  };
  if (readError) throw new Error(readError.message);
  const row = existing?.[0];
  if (row?.status === "confirmed") return;
  if (row) {
    const { error } = await db
      .from("blocklist_entries")
      .update({
        status: "confirmed",
        evidence: "demo seed",
        reporter: REPORTER_SLUG,
        handle_norm_hmac,
      } as any)
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await db.from("blocklist_entries").insert({
    community_id: reporter.id,
    phone_hmac,
    handle_norm_hmac,
    email_hmac: null,
    evidence: "demo seed",
    reporter: REPORTER_SLUG,
    status: "confirmed",
  } as any);
  if (error) throw new Error(error.message);
}

function buildPayload(phone: string, profileName: string, text: string) {
  const waId = phone.replace(/\D/g, "");
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "demo",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550000000",
                phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
              },
              contacts: [{ profile: { name: profileName }, wa_id: waId }],
              messages: [
                {
                  from: waId,
                  id: `wamid.demo.${crypto.randomUUID()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

async function latestApplicationId(communityId: string, waId: string): Promise<string | null> {
  const db = getServiceClient();
  const { data, error } = (await db
    .from("applications")
    .select("id")
    .eq("community_id", communityId)
    .eq("channel", "whatsapp")
    .eq("channel_user_id", waId)
    .order("created_at", { ascending: false })
    .limit(1)) as { data: { id: string }[] | null; error: { message: string } | null };
  if (error) throw new Error(error.message);
  return data?.[0]?.id ?? null;
}

async function pollDecision(communityId: string, waId: string, previousId: string | null) {
  const db = getServiceClient();
  const deadline = Date.now() + POLL_MS;
  while (Date.now() < deadline) {
    const { data: apps, error } = (await db
      .from("applications")
      .select("id")
      .eq("community_id", communityId)
      .eq("channel", "whatsapp")
      .eq("channel_user_id", waId)
      .order("created_at", { ascending: false })
      .limit(1)) as { data: { id: string }[] | null; error: { message: string } | null };
    if (error) throw new Error(error.message);
    const app = apps?.[0];
    if (app && app.id !== previousId) {
      const { data: decision, error: decisionError } = (await db
        .from("decisions")
        .select("decision, score, reason, signals")
        .eq("application_id", app.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()) as {
        data: {
          decision: string;
          score: number | null;
          reason: string | null;
          signals: Record<string, unknown> | null;
        } | null;
        error: { message: string } | null;
      };
      if (decisionError) throw new Error(decisionError.message);
      if (decision) return { applicationId: app.id, decision };
    }
    await sleep(500);
  }
  return null;
}

async function priorCommunityName(
  phoneHmac: string,
  handleHmac: string | null,
  appliedCommunityId: string
): Promise<string | null> {
  const db = getServiceClient();
  const filters = [`phone_hmac.eq.${phoneHmac}`];
  if (handleHmac) filters.push(`handle_norm_hmac.eq.${handleHmac}`);
  const { data: entries, error } = (await db
    .from("blocklist_entries")
    .select("community_id")
    .eq("status", "confirmed")
    .or(filters.join(","))) as {
    data: { community_id: string }[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  const ids = [...new Set((entries || []).map((row) => row.community_id))];
  if (ids.length === 0) return null;
  const ordered = [
    ...ids.filter((id) => id !== appliedCommunityId),
    ...ids.filter((id) => id === appliedCommunityId),
  ];
  const { data: communities, error: communityError } = (await db
    .from("communities")
    .select("id, name")
    .in("id", ordered)) as {
    data: { id: string; name: string }[] | null;
    error: { message: string } | null;
  };
  if (communityError) throw new Error(communityError.message);
  const byId = new Map((communities || []).map((row) => [row.id, row.name]));
  return byId.get(ordered[0]) || null;
}

async function wasAutoSent(communityId: string, applicationId: string): Promise<boolean> {
  const db = getServiceClient();
  const { data, error } = (await db
    .from("audit_log")
    .select("id")
    .eq("community_id", communityId)
    .eq("action", "auto_send")
    .eq("auto", true)
    .filter("details->>application_id", "eq", applicationId)
    .limit(1)) as { data: { id: number }[] | null; error: { message: string } | null };
  if (error) throw new Error(error.message);
  return (data || []).length > 0;
}

export async function POST(req: Request) {
  if (!allowRequest(`demo:${clientIp(req)}`)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let phoneForErrors = "";
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const preset = (body as { preset?: unknown }).preset;
    if (preset !== undefined && preset !== "normal" && preset !== "scammer") {
      return NextResponse.json({ error: "preset must be normal or scammer" }, { status: 400 });
    }
    const communitySlug = String((body as { community_slug?: unknown }).community_slug || "");
    if (!isCommunity(communitySlug)) {
      return NextResponse.json({ error: "Unknown community" }, { status: 400 });
    }

    const rawPhone = String((body as { phone?: unknown }).phone || "");
    const rawText = String((body as { text?: unknown }).text || "");
    let phone = toE164(rawPhone);
    let text = rawText.trim();
    let profileName = NORMAL_PROFILE;

    if (preset === "scammer") {
      phone = SCAMMER_PHONE;
      text = SCAMMER_TEXT;
      profileName = SCAMMER_PROFILE;
    } else if (preset === "normal") {
      text = NORMAL_TEXT;
      profileName = NORMAL_PROFILE;
    }

    if (!phone) {
      return NextResponse.json({ error: "phone must be E.164" }, { status: 400 });
    }
    phoneForErrors = phone;
    if (!text || text.length > 4000) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const secret = process.env.WHATSAPP_APP_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "WhatsApp signing secret is not configured" },
        { status: 500 }
      );
    }

    const community = await communityBySlug(communitySlug);
    if (!community) {
      return NextResponse.json({ error: "Unknown community" }, { status: 400 });
    }

    if (preset === "scammer") {
      await ensureScammerBlocklist(phone, SCAMMER_HANDLE);
    }

    const payload = buildPayload(phone, profileName, text);
    const rawBody = JSON.stringify(payload);
    const signature = `sha256=${crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
    const waId = phone.replace(/\D/g, "");
    const previousId = await latestApplicationId(community.id, waId);

    let httpStatus = 0;
    let signatureVerified = false;
    let webhookError = "";
    try {
      const webhook = await fetch(webhookUrl(req, communitySlug), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": signature,
        },
        body: rawBody,
        signal: AbortSignal.timeout(40_000),
      });
      httpStatus = webhook.status;
      signatureVerified = webhook.status !== 401;
      await webhook.arrayBuffer().catch(() => undefined);
    } catch (error) {
      webhookError = "The webhook did not respond";
      console.error("demo webhook post failed", safeText(error instanceof Error ? error.message : error, phone));
    }

    const maskedPayload = maskPayload(payload, phone);
    const steps: Step[] = [
      { n: 1, label: "Payload sent", payload: maskedPayload },
      {
        n: 2,
        label: "Signature check",
        http_status: httpStatus,
        signature_verified: signatureVerified,
      },
    ];

    if (httpStatus === 401) {
      return NextResponse.json(
        { error: "The webhook rejected the signature", steps },
        { status: 502 }
      );
    }

    const found = await pollDecision(community.id, waId, previousId);
    if (!found) {
      return NextResponse.json(
        {
          error: webhookError || "No application appeared within 25 seconds",
          steps,
        },
        { status: 504 }
      );
    }

    if (httpStatus !== 401) {
      steps[1].signature_verified = true;
    }

    const signals = found.decision.signals || {};
    const blocklistHit = signals.blocklist_hit === true;
    const match = (signals.blocklist_match || {}) as { matched_on?: unknown };
    const matchedOn = Array.isArray(match.matched_on) ? match.matched_on.map(String) : [];
    const phoneHmac = hashPhone(phone);
    const handleHmac = preset === "scammer" ? hashHandle(SCAMMER_HANDLE) : null;
    const hashPrefix = phoneHmac.slice(0, 8);
    let priorName: string | null = null;
    if (blocklistHit) {
      try {
        priorName = await priorCommunityName(phoneHmac, handleHmac, community.id);
      } catch (error) {
        console.error("demo blocklist community lookup failed", safeText(error instanceof Error ? error.message : error, phone));
      }
    }
    const rulesFit = signals.rules_fit as { rule_refs?: unknown } | undefined;
    const ruleRefs = Array.isArray(rulesFit?.rule_refs) ? rulesFit.rule_refs.map(String) : [];
    let autoSent = false;
    if (!blocklistHit && (found.decision.decision === "accept" || found.decision.decision === "ask")) {
      try {
        autoSent = await wasAutoSent(community.id, found.applicationId);
      } catch (error) {
        console.error("demo auto-send lookup failed", safeText(error instanceof Error ? error.message : error, phone));
      }
    }
    const held = found.decision.decision === "decline" || blocklistHit || !autoSent;

    const publicSignals = maskPayload(signals, phone);

    steps.push(
      {
        n: 3,
        label: "Blocklist check",
        matched: blocklistHit,
        hash_prefix: hashPrefix,
        matched_on: matchedOn,
        prior_community_name: priorName,
      },
      {
        n: 4,
        label: "Scorer",
        application_id: found.applicationId,
        decision: found.decision.decision,
        score: found.decision.score,
        reason: redactPhone(found.decision.reason || "", phone),
        rule_refs: ruleRefs,
        signals: publicSignals,
      },
      {
        n: 5,
        label: "Human in the loop",
        auto_mode: community.auto_mode === true,
        auto_sent: autoSent,
        outcome: held ? "held for lead" : "auto-sent",
        queue_path: "/queue",
      }
    );

    return NextResponse.json({ ok: true, steps });
  } catch (error) {
    const message = safeText(error instanceof Error ? error.message : error, phoneForErrors);
    console.error("demo whatsapp failed", message);
    return NextResponse.json({ error: message || "Request failed" }, { status: 500 });
  }
}
