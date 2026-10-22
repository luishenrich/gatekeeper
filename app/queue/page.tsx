"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  COMMUNITIES,
  isInReviewQueue,
  sortQueueNewestFirst,
  type CommunitySlug,
  type DecisionRequest,
  type DecisionResponse,
  type QueueApplication,
} from "@/lib/queue-types";

const NOT_CHECKED = "not checked";
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Notice = { tone: "ok" | "err"; text: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  const last2 = digits.slice(-2);
  if (digits.startsWith("44")) return `+44 •••• ${last2}`;
  return `+•• •••• ${last2}`;
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "••••";
  return `${email.slice(0, 1)}•••@${email.slice(at + 1)}`;
}

function formatRulesFit(value: unknown): string {
  if (!isRecord(value) || typeof value.score !== "number") return NOT_CHECKED;
  const refs = Array.isArray(value.rule_refs)
    ? value.rule_refs.filter((ref): ref is string => typeof ref === "string")
    : [];
  return `${value.score} · ${refs.length > 0 ? refs.join(", ") : "no rule refs"}`;
}

function formatSpam(value: unknown): string {
  if (!isRecord(value) || typeof value.score !== "number") return NOT_CHECKED;
  const patterns = Array.isArray(value.matched_patterns)
    ? value.matched_patterns.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  return `${value.score.toFixed(2)} · ${patterns.length > 0 ? patterns.join(", ") : "no patterns"}`;
}

function formatStopForumSpam(value: unknown): string {
  if (!isRecord(value) || typeof value.appears !== "boolean") return NOT_CHECKED;
  const frequency = typeof value.frequency === "number" ? value.frequency : 0;
  const confidence =
    typeof value.confidence === "number" ? value.confidence.toFixed(2) : "—";
  return `appears ${value.appears ? "yes" : "no"} · frequency ${frequency} · confidence ${confidence}`;
}

function formatGithub(value: unknown): string {
  if (!isRecord(value) || typeof value.exists !== "boolean") return NOT_CHECKED;
  const age =
    typeof value.account_age_days === "number" ? value.account_age_days : 0;
  const repos = typeof value.public_repos === "number" ? value.public_repos : 0;
  return `exists ${value.exists ? "yes" : "no"} · account age ${age} days · ${repos} public repos`;
}

function formatDevpost(value: unknown): string {
  if (!isRecord(value) || typeof value.projects_found !== "number") {
    return NOT_CHECKED;
  }
  return value.projects_found === 1
    ? "1 project"
    : `${value.projects_found} projects`;
}

function formatBlocklistHit(value: unknown): string {
  if (typeof value !== "boolean") return NOT_CHECKED;
  return value ? "yes" : "no";
}

function formatReported(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

function blocklistBanner(app: QueueApplication): string | null {
  const hit = app.signals?.blocklist_hit === true;
  const match = app.blocklist_match;
  if (!hit && !match) return null;
  if (!match?.matched_on?.length) return "Matched shared blocklist";
  return `Matched shared blocklist on ${match.matched_on.join(", ")} · ${match.status} · reported ${formatReported(match.reported_at)}`;
}

function scoreTone(score: number): string {
  if (score >= 70) return "bg-emerald-700 text-white";
  if (score >= 40) return "bg-amber-400 text-amber-950";
  return "bg-rose-700 text-white";
}

function verdictTone(decision: string): string {
  if (decision === "accept") return "bg-emerald-100 text-emerald-900";
  if (decision === "decline") return "bg-rose-100 text-rose-900";
  return "bg-amber-100 text-amber-950";
}

function verdictLabel(decision: string): string {
  if (decision === "accept" || decision === "ask" || decision === "decline") {
    return decision;
  }
  return decision || "unknown";
}

function SignalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[9.5rem_1fr] sm:gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}

function QueueCard({
  app,
  onDecide,
}: {
  app: QueueApplication;
  onDecide: (app: QueueApplication, body: DecisionRequest) => Promise<void>;
}) {
  const [declining, setDeclining] = useState(false);
  const [report, setReport] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [pending, setPending] = useState(false);
  const banner = blocklistBanner(app);
  const signals = app.signals;
  const evidenceMissing = report && evidence.trim() === "";

  function resetDecline() {
    setDeclining(false);
    setReport(false);
    setEvidence("");
  }

  async function submit(body: DecisionRequest) {
    setPending(true);
    try {
      await onDecide(app, body);
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-semibold tabular-nums ${scoreTone(app.score)}`}
          aria-label={`Score ${app.score} out of 100`}
        >
          {app.score}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-lg font-semibold text-slate-950">{app.name}</h2>
            <span className="font-mono text-sm text-slate-600">{app.handle}</span>
            <span className="font-mono text-xs text-slate-400">{app.id}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">{app.community_name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${verdictTone(app.decision)}`}
            >
              {verdictLabel(app.decision)}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Phone {maskPhone(app.phone)}
            <span className="px-1.5 text-slate-300">·</span>
            Email {maskEmail(app.email)}
            {app.github ? (
              <>
                <span className="px-1.5 text-slate-300">·</span>
                GitHub {app.github}
              </>
            ) : null}
          </p>
        </div>
      </div>

      {banner ? (
        <p
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900"
          role="status"
        >
          {banner}
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-slate-800">{app.reason}</p>

      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
        {app.text}
      </p>

      <details className="mt-3 rounded-lg border border-slate-200 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">
          Why?
        </summary>
        <dl className="mt-1 divide-y divide-slate-100 text-sm">
          <SignalLine label="Rules fit" value={formatRulesFit(signals?.rules_fit)} />
          <SignalLine label="Spam text" value={formatSpam(signals?.spam_text)} />
          <SignalLine
            label="StopForumSpam"
            value={formatStopForumSpam(signals?.stopforumspam)}
          />
          <SignalLine label="GitHub" value={formatGithub(signals?.github)} />
          <SignalLine label="Devpost" value={formatDevpost(signals?.devpost)} />
          <SignalLine
            label="Blocklist hit"
            value={formatBlocklistHit(signals?.blocklist_hit)}
          />
        </dl>
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            void submit({ decision: "accept", report_to_blocklist: false })
          }
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setDeclining(true)}
          className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-50"
        >
          Decline
        </button>
      </div>

      {declining ? (
        <form
          className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (evidenceMissing || pending) return;
            void submit({
              decision: "decline",
              report_to_blocklist: report,
              ...(report ? { evidence: evidence.trim() } : {}),
            });
          }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={report}
              onChange={(event) => setReport(event.target.checked)}
            />
            Report to shared blocklist
          </label>
          {report ? (
            <textarea
              className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900"
              rows={3}
              required
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              placeholder="What did you see? Required to report."
              aria-label="Evidence"
            />
          ) : null}
          {evidenceMissing ? (
            <p className="mt-1 text-xs text-rose-700">
              Evidence is required when reporting to the shared blocklist.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending || evidenceMissing}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Confirm decline
            </button>
            <button
              type="button"
              onClick={resetDecline}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

export default function QueuePage() {
  const [community, setCommunity] = useState<CommunitySlug>(
    "london-agent-builders",
  );
  const [items, setItems] = useState<QueueApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const pendingIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/mock/queue", { cache: "no-store" });
        const data = (await res.json()) as {
          applications?: QueueApplication[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "Could not load the queue");
        }
        if (!cancelled) {
          setItems(sortQueueNewestFirst(data.applications ?? []));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the queue");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = (items ?? []).filter(
    (app) => app.community_slug === community && isInReviewQueue(app),
  );

  async function onDecide(app: QueueApplication, body: DecisionRequest) {
    if (pendingIds.current.has(app.id)) return;
    pendingIds.current.add(app.id);
    setItems((current) => (current ?? []).filter((row) => row.id !== app.id));
    setNotice(null);

    try {
      const res = await fetch(`/api/mock/decisions/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Partial<DecisionResponse> & {
        error?: string;
      };
      if (!res.ok || data.ok !== true) {
        throw new Error(data.error || "Could not save that decision");
      }
      const verb = body.decision === "accept" ? "accepted" : "declined";
      const status = data.blocklist_status
        ? ` Blocklist status: ${data.blocklist_status}.`
        : "";
      setNotice({
        tone: "ok",
        text: `${app.name} (${app.id}) ${verb}.${status}`,
      });
    } catch (err) {
      setItems((current) => {
        const rows = current ?? [];
        if (rows.some((row) => row.id === app.id)) return rows;
        return sortQueueNewestFirst([app, ...rows]);
      });
      setNotice({
        tone: "err",
        text: err instanceof Error ? err.message : "Could not save that decision",
      });
    } finally {
      pendingIds.current.delete(app.id);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
            >
              Gatekeeper
            </Link>
            <h1 className="text-2xl font-semibold text-slate-950">Review queue</h1>
            <p className="mt-1 text-sm text-slate-600">
              Asks, unconfirmed decisions, and shared blocklist hits.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"
            role="group"
            aria-label="Community"
          >
            {COMMUNITIES.map((item) => {
              const selected = item.slug === community;
              return (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCommunity(item.slug)}
                  className={
                    selected
                      ? "rounded-md bg-slate-900 px-3 py-1.5 text-left text-sm font-medium text-white"
                      : "rounded-md px-3 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-white"
                  }
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        {notice ? (
          <p
            role="status"
            className={
              notice.tone === "ok"
                ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
                : "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950"
            }
          >
            {notice.text}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
            {error}
            {error === "Mocks disabled" ? ". Set USE_MOCKS=true and reload." : ""}
          </p>
        ) : null}

        {items === null && !error ? (
          <p className="text-sm text-slate-600">Loading review queue…</p>
        ) : null}

        {items !== null && !error ? (
          <p className="text-sm text-slate-600">
            {visible.length} waiting in{" "}
            {COMMUNITIES.find((item) => item.slug === community)?.name}
          </p>
        ) : null}

        {items !== null && visible.length === 0 && !error ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
            Nothing waiting in this community.
          </p>
        ) : null}

        {visible.map((app) => (
          <QueueCard key={app.id} app={app} onDecide={onDecide} />
        ))}
      </div>
    </main>
  );
}
