"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Decision = "accept" | "ask" | "decline";
type Channel = "whatsapp" | "discord" | "web";

type Signals = {
  rules_fit?: { score?: number; rule_refs?: string[] } | boolean | null;
  spam_text?: { score?: number; matched_patterns?: string[] } | boolean | null;
  stopforumspam?: {
    appears?: boolean;
    frequency?: number;
    confidence?: number;
  } | boolean | null;
  github?: {
    exists?: boolean;
    account_age_days?: number;
    public_repos?: number;
  } | boolean | null;
  devpost?: { projects_found?: number } | boolean | null;
  blocklist_hit?: boolean;
};

type BlocklistMatch = {
  matched_on: string[];
  status: string;
  reported_at: string;
};

type ReplyDraft = { channel: string; text: string };

type QueueApp = {
  id: string;
  community_slug: string;
  community_name: string;
  channel?: Channel | string | null;
  channel_user_id?: string | null;
  name: string;
  handle: string;
  phone: string;
  email: string;
  github?: string | null;
  text: string;
  decision: Decision;
  score: number;
  reason: string;
  final: boolean;
  signals: Signals;
  blocklist_match?: BlocklistMatch;
};

const COMMUNITIES = [
  {
    slug: "london-agent-builders",
    name: "London Agent Builders",
  },
  {
    slug: "south-london-hack-nights",
    name: "South London Hack Nights",
  },
] as const;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last2 = digits.slice(-2) || "••";
  const cc = phone.trim().startsWith("+")
    ? phone.trim().split(/\s/)[0]
    : "+••";
  return `${cc} •••• ${last2}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••@•••";
  const head = local.slice(0, 1) || "•";
  return `${head}•••@${domain}`;
}

function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-600 text-white";
  if (score >= 45) return "bg-amber-500 text-white";
  return "bg-rose-600 text-white";
}

function verdictStyles(decision: Decision): string {
  if (decision === "accept") return "bg-emerald-100 text-emerald-800";
  if (decision === "ask") return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-800";
}

function channelStyles(channel: string): string {
  if (channel === "whatsapp") return "bg-emerald-600 text-white";
  if (channel === "discord") return "bg-indigo-600 text-white";
  return "bg-slate-400 text-white";
}

function formatReportedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function formatSignal(key: string, value: unknown): string {
  if (value === null || value === undefined) return "not checked";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value !== "object") return String(value);

  const v = value as Record<string, unknown>;
  if (key === "rules_fit") {
    const refs = Array.isArray(v.rule_refs) ? v.rule_refs.join(", ") : "";
    return `score ${v.score ?? "?"}${refs ? ` · ${refs}` : ""}`;
  }
  if (key === "spam_text") {
    const pats = Array.isArray(v.matched_patterns)
      ? v.matched_patterns.join(", ")
      : "";
    return `score ${v.score ?? "?"}${pats ? ` · ${pats}` : ""}`;
  }
  if (key === "stopforumspam") {
    return `appears=${String(v.appears)} · freq=${String(v.frequency)} · conf=${String(v.confidence)}`;
  }
  if (key === "github") {
    return `exists=${String(v.exists)} · age=${String(v.account_age_days)}d · repos=${String(v.public_repos)}`;
  }
  if (key === "devpost") {
    return `projects_found=${String(v.projects_found)}`;
  }
  return JSON.stringify(value);
}

function apiBase(): string {
  return process.env.NEXT_PUBLIC_GATEKEEPER_API_URL || "";
}

function useMocks(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
}

function decisionsPath(id: string): string {
  const prefix = useMocks() ? "/api/_mock" : "/api";
  return `${apiBase()}${prefix}/decisions/${id}`;
}

function queuePath(community: string): string {
  const prefix = useMocks() ? "/api/_mock" : "/api";
  return `${apiBase()}${prefix}/queue?community=${encodeURIComponent(community)}`;
}

function channelSendPath(): string {
  const prefix = useMocks() ? "/api/_mock" : "/api";
  return `${apiBase()}${prefix}/channel/send`;
}

export default function QueuePage() {
  const [community, setCommunity] = useState<string>(COMMUNITIES[0].slug);
  const [apps, setApps] = useState<QueueApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState<string | null>(null);
  const [reportToggle, setReportToggle] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [signalsOpen, setSignalsOpen] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, ReplyDraft>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(queuePath(community));
      if (!res.ok) throw new Error(`Queue failed (${res.status})`);
      const data = await res.json();
      setApps(data.applications ?? []);
      setReplyDrafts({});
      setReplyText({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [community]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function removeCard(id: string) {
    setApps((list) => list.filter((a) => a.id !== id));
    setReplyDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    setReplyText((t) => {
      const next = { ...t };
      delete next[id];
      return next;
    });
    setDeclineOpen((open) => (open === id ? null : open));
  }

  async function submitDecision(
    app: QueueApp,
    decision: "accept" | "decline",
    report: boolean,
    evidenceText?: string
  ) {
    setSubmitting(app.id);
    setError(null);
    setDeclineOpen(null);
    setReportToggle(false);
    setEvidence("");

    try {
      const res = await fetch(decisionsPath(app.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          report_to_blocklist: report,
          evidence: report ? evidenceText : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Decision failed (${res.status})`);
      const data = await res.json();

      const parts: string[] = [`Marked ${decision}`];
      if (data.blocklist_status) {
        parts.push(`blocklist: ${data.blocklist_status}`);
      }
      setToast(parts.join(" · "));

      if (data.reply_draft?.channel && data.reply_draft?.text) {
        setReplyDrafts((d) => ({ ...d, [app.id]: data.reply_draft }));
        setReplyText((t) => ({ ...t, [app.id]: data.reply_draft.text }));
      } else {
        removeCard(app.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setSubmitting(null);
    }
  }

  async function sendReply(app: QueueApp) {
    const draft = replyDrafts[app.id];
    const text = (replyText[app.id] ?? draft?.text ?? "").trim();
    if (!text) return;

    setSendingReply(app.id);
    setError(null);
    try {
      const res = await fetch(channelSendPath(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: app.id, text }),
      });
      if (!res.ok) throw new Error(`Send failed (${res.status})`);
      const data = await res.json();
      setToast(`Sent via ${data.channel ?? draft?.channel ?? "channel"}`);
      removeCard(app.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingReply(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
              Gatekeeper
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">Review Queue</h1>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Community</span>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 font-medium"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
            >
              {COMMUNITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {toast && (
          <div className="rounded-md bg-slate-900 px-4 py-3 text-sm text-white shadow">
            {toast}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {loading && <p className="text-sm text-slate-500">Loading queue…</p>}
        {!loading && apps.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
            Queue empty for this community.
          </p>
        )}

        {apps.map((app) => {
          const match = app.blocklist_match;
          const openSignals = signalsOpen[app.id];
          const declining = declineOpen === app.id;
          const channel = (app.channel || "web") as string;
          const draft = replyDrafts[app.id];

          return (
            <article
              key={app.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              {(app.signals.blocklist_hit || match) && (
                <div className="mb-4 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white">
                  Matched shared blocklist on{" "}
                  {(match?.matched_on ?? ["unknown"]).join(", ")} ·{" "}
                  {match?.status ?? "confirmed"} · reported{" "}
                  {match?.reported_at
                    ? formatReportedAt(match.reported_at)
                    : "—"}
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${channelStyles(channel)}`}
                    >
                      {channel}
                    </span>
                    <h2 className="text-lg font-semibold">{app.name}</h2>
                    <span className="text-slate-500">{app.handle}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${verdictStyles(app.decision)}`}
                    >
                      {app.decision}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {app.community_name} · {maskPhone(app.phone)} ·{" "}
                    {maskEmail(app.email)}
                  </p>
                </div>
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${scoreColor(app.score)}`}
                  title="Score 0–100"
                >
                  {app.score}
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-800">
                {app.reason}
              </p>

              <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                “{app.text}”
              </p>

              <button
                type="button"
                className="mt-3 text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
                onClick={() =>
                  setSignalsOpen((s) => ({ ...s, [app.id]: !s[app.id] }))
                }
              >
                {openSignals ? "Hide Why?" : "Why?"}
              </button>
              {openSignals && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {(
                    [
                      "rules_fit",
                      "spam_text",
                      "stopforumspam",
                      "github",
                      "devpost",
                      "blocklist_hit",
                    ] as const
                  ).map((k) => (
                    <li key={k}>
                      <span className="font-mono text-xs text-slate-400">
                        {k}
                      </span>
                      : {formatSignal(k, app.signals?.[k])}
                    </li>
                  ))}
                </ul>
              )}

              {!draft && (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={submitting === app.id}
                      onClick={() => submitDecision(app, "accept", false)}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={submitting === app.id}
                      onClick={() => {
                        setDeclineOpen(declining ? null : app.id);
                        setReportToggle(false);
                        setEvidence("");
                      }}
                      className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>

                  {declining && (
                    <div className="mt-4 space-y-3 rounded-md border border-rose-200 bg-rose-50 p-4">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={reportToggle}
                          onChange={(e) => setReportToggle(e.target.checked)}
                        />
                        Report to shared blocklist
                      </label>
                      {reportToggle && (
                        <textarea
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                          rows={3}
                          placeholder="Evidence (required when reporting)"
                          value={evidence}
                          onChange={(e) => setEvidence(e.target.value)}
                        />
                      )}
                      <button
                        type="button"
                        disabled={
                          submitting === app.id ||
                          (reportToggle && evidence.trim().length === 0)
                        }
                        onClick={() =>
                          submitDecision(app, "decline", reportToggle, evidence)
                        }
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        Confirm decline
                      </button>
                    </div>
                  )}
                </>
              )}

              {draft && (
                <div className="mt-5 space-y-3 rounded-md border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-medium text-sky-900">
                    Reply draft — nothing is sent until you click Send
                  </p>
                  <textarea
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    rows={4}
                    value={replyText[app.id] ?? draft.text}
                    onChange={(e) =>
                      setReplyText((t) => ({ ...t, [app.id]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        sendingReply === app.id ||
                        !(replyText[app.id] ?? draft.text).trim()
                      }
                      onClick={() => sendReply(app)}
                      className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
                    >
                      Send reply via {draft.channel}
                    </button>
                    <button
                      type="button"
                      disabled={sendingReply === app.id}
                      onClick={() => {
                        setToast("Skipped send — applicant not contacted");
                        removeCard(app.id);
                      }}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Skip send
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
