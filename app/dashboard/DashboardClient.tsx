"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DecisionPill,
  StatCard,
  type Decision,
} from "@/components/decision-ui";
import type { StatsResponse } from "@/lib/stats";

const COMMUNITIES = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
] as const;

function asDecision(v: string): Decision {
  if (v === "accept" || v === "ask" || v === "decline") return v;
  return "ask";
}

function formatSaved(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardClient({ useMocks }: { useMocks: boolean }) {
  const [community, setCommunity] = useState<string>(COMMUNITIES[0].slug);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prefix = useMocks ? "/api/mock" : "/api";
      const res = await fetch(
        `${prefix}/stats?community=${encodeURIComponent(community)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(`Stats failed (${res.status})`);
      const data = (await res.json()) as StatsResponse;
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [community, useMocks]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-white text-[17px] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
            <p className="mt-1 text-base text-slate-600">
              Lead overview for today&apos;s applications
            </p>
          </div>
          <label className="flex items-center gap-2 font-semibold">
            <span className="text-slate-600">Community</span>
            <select
              className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2 font-bold"
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

        {error && (
          <div className="mt-6 rounded-xl border-2 border-rose-600 bg-rose-50 px-4 py-3 font-semibold text-rose-900">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-slate-600">Loading stats…</p>
        ) : stats ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Applications handled today"
                value={stats.handled_today}
              />
              <StatCard
                label="Accepted"
                value={stats.accepted}
                tone="accept"
              />
              <StatCard label="Asked" value={stats.asked} tone="ask" />
              <StatCard
                label="Declined"
                value={stats.declined}
                tone="decline"
              />
              <StatCard
                label="Scammers stopped"
                value={stats.blocklist_hits_cross_community}
                hint="Blocklist hits across communities"
                tone="blocklist"
              />
              <StatCard
                label="Auto-sent questions"
                value={stats.auto_sent}
              />
              <StatCard
                label="Time saved"
                value={formatSaved(stats.time_saved_minutes_estimate)}
                hint="estimate · handled × 5 min"
              />
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <section className="lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold">Recent decisions</h2>
                  <Link
                    href="/queue"
                    className="font-bold text-slate-700 underline underline-offset-2"
                  >
                    Open queue
                  </Link>
                </div>
                <ul className="mt-4 divide-y-2 divide-slate-200 rounded-2xl border-2 border-slate-300">
                  {(stats.recent || []).map((row) => (
                    <li key={row.application_id}>
                      <Link
                        href="/queue"
                        className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50"
                      >
                        <DecisionPill decision={asDecision(row.decision)} />
                        <span className="font-bold">{row.name || "—"}</span>
                        <span className="font-bold tabular-nums">{row.score}</span>
                        <span className="text-slate-600 capitalize">
                          {row.channel}
                        </span>
                        <span className="ml-auto shrink-0 text-slate-600">
                          {relativeTime(row.created_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {(stats.recent || []).length === 0 && (
                    <li className="px-5 py-8 text-center text-slate-600">
                      No decisions yet today.
                    </li>
                  )}
                </ul>
              </section>

              <aside>
                <Link
                  href="/eval"
                  className="block rounded-2xl border-2 border-slate-300 bg-slate-50 p-6 hover:border-slate-900"
                >
                  <h2 className="text-xl font-bold">Eval results</h2>
                  <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-800">
                    GPT-6 Luna 29/30, Jev 28/30, 0 false blocks
                  </p>
                  <p className="mt-3 font-bold text-slate-700 underline underline-offset-2">
                    View /eval →
                  </p>
                </Link>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
