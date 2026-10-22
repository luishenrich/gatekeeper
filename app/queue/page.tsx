"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Decision = "accept" | "ask" | "decline";

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

type QueueApp = {
  id: string;
  community_slug: string;
  community_name: string;
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

function decisionsPath(id: string): string {
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
  const prefix = useMocks ? "/api/_mock" : "/api";
  return `${apiBase()}${prefix}/decisions/${id}`;
}

function queuePath(community: string): string {
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
  const prefix = useMocks ? "/api/_mock" : "/api";
  return `${apiBase()}${prefix}/queue?community=${encodeURIComponent(community)}`;
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(queuePath(community));
      if (!res.ok) throw new Error(`Queue failed (${res.status})`);
      const data = await res.json();
      setApps(data.applications ?? []);
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

  async function submitDecision(
    app: QueueApp,
    decision: "accept" | "decline",
    report: boolean,
    evidenceText?: string
  ) {
    setSubmitting(app.id);
    setError(null);
    const prev = apps;
    setApps((list) => list.filter((a) => a.id !== app.id));
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
      if (data.blocklist_status) {
        setToast(`Reported to blocklist · status: ${data.blocklist_status}`);
      } else {
        setToast(`Marked ${decision}`);
      }
    } catch (e) {
      setApps(prev);
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setSubmitting(null);
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
        {loading && (
          <p className="text-sm text-slate-500">Loading queue…</p>
        )}
        {!loading && apps.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
            Queue empty for this community.
          </p>
        )}

        {apps.map((app) => {
          const match = app.blocklist_match;
          const openSignals = signalsOpen[app.id];
          const declining = declineOpen === app.id;

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
            </article>
          );
        })}
      </div>
    </main>
  );
}
