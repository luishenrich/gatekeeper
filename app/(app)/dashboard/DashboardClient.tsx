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

const pill = clsx(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 ease-out",
  focusRing
);
const inkPill = clsx(pill, "bg-foreground text-background hover:bg-foreground/85");

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
            variant="ghost"
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
            className={clsx(inkPill, "h-8 px-3.5 text-[14px]")}
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
    <span
      className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card/70 px-3 text-[13px] text-muted-foreground"
      aria-live="polite"
    >
      <span aria-hidden className="relative flex h-2 w-2">
        {updatedAt ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
        ) : null}
        <span
          className={clsx(
            "relative inline-flex h-2 w-2 rounded-full",
            updatedAt ? "bg-emerald-500" : "bg-foreground/20",
            loading && "animate-pulse motion-reduce:animate-none"
          )}
        />
      </span>
      {updatedAt ? (
        <>
          Updated <time className="tabular-nums text-foreground/80">{formatClock(updatedAt)}</time>
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
          icon={<Check className="h-4 w-4 text-emerald-700" aria-hidden />}
        />
        <StatCard
          label="Asked"
          value={stats.asked}
          tone="ask"
          icon={<HelpCircle className="h-4 w-4 text-amber-700" aria-hidden />}
        />
        <StatCard
          label="Declined"
          value={stats.declined}
          tone="decline"
          icon={<X className="h-4 w-4 text-rose-700" aria-hidden />}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Scammers stopped"
          value={stats.blocklist_hits_cross_community}
          hint="Shared blocklist hits across communities"
          tone="blocklist"
          icon={<Ban className="h-4 w-4 text-rose-700" aria-hidden />}
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
              <span className="rounded-full bg-secondary px-2 text-[11px] font-medium uppercase tracking-wider text-foreground/80">
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
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
        <h2 id="recent-heading" className="font-display text-2xl text-foreground">
          Recent decisions
        </h2>
        {recent.length > 0 ? (
          <span className="text-[13px] text-muted-foreground">Latest {recent.length}</span>
        ) : null}
      </div>

      {nothingToday ? (
        <EmptyState
          className={recent.length > 0 ? "border-b border-border py-10" : undefined}
          icon={<Inbox className="h-7 w-7" aria-hidden />}
          title="No applications yet today — share your apply link"
          body="New applications from WhatsApp, Discord and the web form show up here and in the review queue."
          action={
            <Link
              href={`/apply?community=${encodeURIComponent(community)}`}
              className={clsx(inkPill, "h-10 px-5 text-[15px]")}
            >
              Open the apply page
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
      ) : null}

      {recent.length > 0 ? (
        <ul className="divide-y divide-border/70">
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
          "group flex items-center gap-3 px-6 py-3.5 transition-colors duration-150 hover:bg-muted/50 focus-visible:bg-muted/50",
          focusRing,
          "focus-visible:ring-inset"
        )}
      >
        <Avatar label={initials(row.name)} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-foreground">{displayName}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
            <ChannelBadge channel={row.channel} />
            <span className="text-[13px] text-muted-foreground">{timeAgo(row.created_at)}</span>
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">
          <ChannelBadge channel={row.channel} />
        </div>
        <div className="w-10 shrink-0 text-right">
          <ScoreBadge score={row.score} />
        </div>
        <div className="w-[6.5rem] shrink-0">
          {decision ? (
            <DecisionPill decision={decision} />
          ) : (
            <span className="text-[13px] capitalize text-muted-foreground">{row.decision || "—"}</span>
          )}
        </div>
        <span className="hidden w-20 shrink-0 text-right text-[13px] text-muted-foreground sm:block">
          {timeAgo(row.created_at)}
        </span>
        <ArrowRight
          className="hidden h-4 w-4 shrink-0 text-foreground/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground/70 sm:block"
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
        "group block rounded-2xl border border-border bg-secondary/60 p-6 shadow-[0_1px_2px_rgba(26,26,26,0.04),0_8px_24px_-12px_rgba(26,26,26,0.08)] transition-colors duration-150 hover:border-foreground/40",
        focusRing
      )}
    >
      <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-foreground/60">
        <FlaskConical className="h-4 w-4" aria-hidden />
        Benchmark · {BENCHMARK.testSetLabel}
      </div>
      <ul className="mt-5 space-y-3">
        {BENCHMARK.models.map((m) => (
          <li key={m.id} className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] text-foreground/80">{m.name}</span>
            <span className="font-display text-3xl leading-none tabular-nums text-foreground">
              {m.correct}
              <span className="text-lg text-foreground/50">/{BENCHMARK.testSetSize}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-foreground/10 pt-5">
        <div>
          <div className="font-display text-4xl leading-none tabular-nums text-foreground">{BENCHMARK.falseBlocks}</div>
          <div className="mt-1.5 text-[13px] text-foreground/60">false blocks</div>
        </div>
        <div>
          <div className="font-display text-4xl leading-none tabular-nums text-foreground">{BENCHMARK.missedScammers}</div>
          <div className="mt-1.5 text-[13px] text-foreground/60">missed scammers</div>
        </div>
      </div>
      <p className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground">
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
          <div className="border-b border-border px-6 py-5">
            <Skeleton className="h-8 w-48" />
          </div>
          <ul className="divide-y divide-border/70">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-6 py-3.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 flex-1 max-w-[12rem]" />
                <Skeleton className="ml-auto hidden h-6 w-20 rounded-full sm:block" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-6 w-[6.5rem] rounded-full" />
              </li>
            ))}
          </ul>
        </Card>
        <div className="rounded-2xl border border-border bg-secondary/60 p-6">
          <Skeleton className="h-4 w-48 bg-foreground/10" />
          <Skeleton className="mt-5 h-8 w-full bg-foreground/10" />
          <Skeleton className="mt-3 h-8 w-full bg-foreground/10" />
          <Skeleton className="mt-6 h-16 w-full bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton({ withHint = false }: { withHint?: boolean }) {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-12 w-16" />
      {withHint ? <Skeleton className="mt-2 h-4 w-40" /> : null}
    </Card>
  );
}

/** Suspense fallback for the whole page (before the community is known). */
export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-12 w-72 max-w-full" />
          <Skeleton className="mt-3 h-5 w-64 max-w-full" />
        </div>
        <Skeleton className="h-8 w-72 rounded-full" />
      </div>
      <BodySkeleton />
    </div>
  );
}
