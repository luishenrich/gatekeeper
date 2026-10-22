"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Clock,
  FlaskConical,
  HelpCircle,
  Inbox,
  RotateCw,
  Send,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  ChannelBadge,
  DecisionPill,
  EmptyState,
  ErrorState,
  PageHeader,
  ScoreBadge,
  Skeleton,
  StatCard,
  asDecision,
  focusRing,
} from "@/components/ui";
import { BENCHMARK } from "@/lib/ui/benchmark";
import { communityName } from "@/lib/ui/communities";
import { initials, timeAgo } from "@/lib/ui/format";
import { useApi } from "@/lib/ui/useApi";
import { useCommunity } from "@/lib/ui/useCommunity";
import type { StatsRecent, StatsResponse } from "@/lib/stats";

const POLL_MS = 15_000;

const linkButton = clsx(
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-4 font-semibold transition-colors duration-150 ease-out",
  focusRing
);

function londonToday(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function DashboardClient({ useMocks }: { useMocks: boolean }) {
  const [community] = useCommunity();
  const prefix = useMocks ? "/api/mock" : "/api";
  const { data, error, status, refetch } = useApi<StatsResponse>(
    `${prefix}/stats?community=${encodeURIComponent(community)}`,
    { pollMs: POLL_MS }
  );
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    setUpdatedAt(data ? new Date() : null);
  }, [data]);

  const name = communityName(community);
  const header = (
    <PageHeader
      eyebrow="Dashboard"
      title={name}
      description={<>Today (London time) · {londonToday()}</>}
      actions={
        <>
          <UpdatedIndicator updatedAt={updatedAt} loading={status === "loading"} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            loading={status === "loading"}
            icon={<RotateCw className="h-4 w-4" aria-hidden />}
            aria-label="Refresh stats"
          >
            Refresh
          </Button>
          <Link
            href={`/queue?community=${encodeURIComponent(community)}`}
            className={clsx(linkButton, "h-9 rounded-lg px-3 text-[15px] border-slate-900 bg-slate-900 text-white hover:bg-slate-800")}
          >
            Open queue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </>
      }
    />
  );

  if (status === "error" && error) {
    return (
      <div>
        {header}
        <ErrorState
          title="Couldn't load today's stats"
          message={error.message}
          details={error.details}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {header}
        <BodySkeleton />
      </div>
    );
  }

  return (
    <div>
      {header}
      <StatsGrid stats={data} />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="recent-heading" className="lg:col-span-2">
          <RecentDecisions stats={data} community={community} />
        </section>
        <aside>
          <BenchmarkCard />
        </aside>
      </div>
    </div>
  );
}

function UpdatedIndicator({ updatedAt, loading }: { updatedAt: Date | null; loading: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-600" aria-live="polite">
      <span
        aria-hidden
        className={clsx(
          "h-2.5 w-2.5 rounded-full",
          updatedAt ? "bg-emerald-600" : "bg-slate-300",
          loading && "animate-pulse motion-reduce:animate-none"
        )}
      />
      {updatedAt ? (
        <>
          Updated <time className="font-mono tabular-nums text-slate-700">{formatClock(updatedAt)}</time>
        </>
      ) : (
        "Loading…"
      )}
    </span>
  );
}

function StatsGrid({ stats }: { stats: StatsResponse }) {
  return (
    <div className="space-y-4 animate-gk-fade-in motion-reduce:animate-none">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Handled today"
          value={stats.handled_today}
          icon={<Users className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          tone="accept"
          icon={<Check className="h-4 w-4 text-emerald-700" aria-hidden strokeWidth={3} />}
        />
        <StatCard
          label="Asked"
          value={stats.asked}
          tone="ask"
          icon={<HelpCircle className="h-4 w-4 text-amber-700" aria-hidden strokeWidth={3} />}
        />
        <StatCard
          label="Declined"
          value={stats.declined}
          tone="decline"
          icon={<X className="h-4 w-4 text-rose-700" aria-hidden strokeWidth={3} />}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Scammers stopped"
          value={stats.blocklist_hits_cross_community}
          hint="Shared blocklist hits across communities"
          tone="blocklist"
          icon={<Ban className="h-4 w-4 text-rose-700" aria-hidden strokeWidth={3} />}
        />
        <StatCard
          label="Auto-sent questions"
          value={stats.auto_sent}
          hint="Sent by auto mode today"
          icon={<Send className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Time saved"
          value={formatMinutes(stats.time_saved_minutes_estimate)}
          hint={
            <span className="inline-flex items-center gap-2">
              <span className="rounded-md bg-slate-100 px-1.5 text-[13px] font-bold uppercase tracking-wide text-slate-700">
                Estimate
              </span>
              5 min per application
            </span>
          }
          icon={<Clock className="h-4 w-4" aria-hidden />}
        />
      </div>
    </div>
  );
}

function RecentDecisions({ stats, community }: { stats: StatsResponse; community: string }) {
  const recent = stats.recent ?? [];
  const nothingToday = stats.handled_today === 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b-2 border-slate-200 px-5 py-4">
        <h2 id="recent-heading" className="text-xl font-bold">
          Recent decisions
        </h2>
        {recent.length > 0 ? (
          <span className="text-[15px] font-medium text-slate-600">Latest {recent.length}</span>
        ) : null}
      </div>

      {nothingToday ? (
        <EmptyState
          className={recent.length > 0 ? "border-b-2 border-slate-200 py-10" : undefined}
          icon={<Inbox className="h-7 w-7" aria-hidden />}
          title="No applications yet today — share your apply link"
          body="New applications from WhatsApp, Discord and the web form show up here and in the review queue."
          action={
            <Link
              href={`/apply?community=${encodeURIComponent(community)}`}
              className={clsx(linkButton, "border-slate-900 bg-slate-900 text-white hover:bg-slate-800")}
            >
              Open the apply page
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
      ) : null}

      {recent.length > 0 ? (
        <ul className="divide-y-2 divide-slate-100">
          {recent.map((row) => (
            <RecentRow key={row.application_id} row={row} community={community} />
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function RecentRow({ row, community }: { row: StatsRecent; community: string }) {
  const decision = asDecision(row.decision);
  const displayName = row.name?.trim() || "Unnamed applicant";
  const href = `/queue?community=${encodeURIComponent(community)}&id=${encodeURIComponent(row.application_id)}`;
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          "group flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50 focus-visible:bg-slate-50",
          focusRing,
          "focus-visible:ring-inset"
        )}
      >
        <Avatar label={initials(row.name)} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-slate-900">{displayName}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
            <ChannelBadge channel={row.channel} />
            <span className="text-[15px] text-slate-600">{timeAgo(row.created_at)}</span>
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">
          <ChannelBadge channel={row.channel} />
        </div>
        <div className="w-10 shrink-0 text-right text-lg">
          <ScoreBadge score={row.score} />
        </div>
        <div className="w-[6.5rem] shrink-0">
          {decision ? (
            <DecisionPill decision={decision} />
          ) : (
            <span className="text-[15px] font-semibold capitalize text-slate-600">{row.decision || "—"}</span>
          )}
        </div>
        <span className="hidden w-20 shrink-0 text-right text-[15px] text-slate-600 sm:block">
          {timeAgo(row.created_at)}
        </span>
        <ArrowRight
          className="hidden h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-700 sm:block"
          aria-hidden
        />
      </Link>
    </li>
  );
}

function BenchmarkCard() {
  return (
    <Link
      href="/eval"
      className={clsx(
        "group block rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 transition-colors duration-150 hover:border-slate-900",
        focusRing
      )}
    >
      <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-600">
        <FlaskConical className="h-4 w-4" aria-hidden />
        Benchmark · {BENCHMARK.testSetLabel}
      </div>
      <ul className="mt-4 space-y-3">
        {BENCHMARK.models.map((m) => (
          <li key={m.id} className="flex items-baseline justify-between gap-3">
            <span className="font-semibold text-slate-800">{m.name}</span>
            <span className="text-2xl font-black tabular-nums tracking-tight">
              {m.correct}
              <span className="text-base font-bold text-slate-600">/{BENCHMARK.testSetSize}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t-2 border-slate-200 pt-4">
        <div>
          <div className="text-2xl font-black tabular-nums text-emerald-700">{BENCHMARK.falseBlocks}</div>
          <div className="text-[15px] font-medium text-slate-600">false blocks</div>
        </div>
        <div>
          <div className="text-2xl font-black tabular-nums text-emerald-700">{BENCHMARK.missedScammers}</div>
          <div className="text-[15px] font-medium text-slate-600">missed scammers</div>
        </div>
      </div>
      <p className="mt-5 inline-flex items-center gap-1.5 font-bold text-slate-900">
        See the full eval
        <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </p>
    </Link>
  );
}

/* ---------- Skeletons ---------- */

function BodySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today's stats">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <StatCardSkeleton key={i} withHint />
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b-2 border-slate-200 px-5 py-4">
            <Skeleton className="h-7 w-44" />
          </div>
          <ul className="divide-y-2 divide-slate-100">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 flex-1 max-w-[12rem]" />
                <Skeleton className="ml-auto hidden h-6 w-20 sm:block" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-6 w-[6.5rem]" />
              </li>
            ))}
          </ul>
        </Card>
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-5 h-7 w-full" />
          <Skeleton className="mt-3 h-7 w-full" />
          <Skeleton className="mt-6 h-14 w-full" />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton({ withHint = false }: { withHint?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 p-5">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="mt-3 h-10 w-16" />
      {withHint ? <Skeleton className="mt-2 h-4 w-40" /> : null}
    </div>
  );
}

/** Suspense fallback for the whole page (before the community is known). */
export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-3 h-10 w-72 max-w-full" />
          <Skeleton className="mt-3 h-6 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-64" />
      </div>
      <BodySkeleton />
    </div>
  );
}
