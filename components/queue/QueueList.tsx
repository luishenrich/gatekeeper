"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import { Avatar, BlocklistBadge, ChannelBadge, DecisionPill, ScoreBadge, SignalChip, Skeleton, focusRing } from "@/components/ui";
import { buildSignalsFromApi } from "@/lib/signals-ui";
import { initials, timeAgo } from "@/lib/ui/format";
import { isBlocklistHit, recommended, type QueueApp } from "./model";

function rowChips(app: QueueApp) {
  // Failing chips first; the blocklist hit gets its own BLOCKLIST badge on the row.
  const signals = buildSignalsFromApi(app.signals, app.github).filter((s) => s.key !== "blocklist_hit");
  const failing = signals.filter((s) => s.status === "fail");
  const rest = signals.filter((s) => s.status === "pass");
  return [...failing, ...rest].slice(0, 3);
}

function QueueRow({
  app,
  selected,
  isNew,
  onSelect,
}: {
  app: QueueApp;
  selected: boolean;
  isNew: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const hit = isBlocklistHit(app);
  const chips = rowChips(app);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <li className={clsx(isNew && "animate-gk-highlight motion-reduce:animate-none")}>
      <button
        ref={ref}
        type="button"
        data-queue-row
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={clsx(
          "flex w-full gap-3 border-b-2 border-slate-200 px-4 py-4 text-left transition-colors duration-150 ease-out sm:px-5",
          focusRing,
          "focus-visible:ring-inset",
          hit && "border-l-8 border-l-rose-600",
          selected ? "bg-slate-100 ring-2 ring-inset ring-slate-900" : "hover:bg-slate-50"
        )}
      >
        <Avatar label={initials(app.name, app.handle)} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-slate-900">{app.name || app.handle || "Unnamed applicant"}</span>
            {app.handle && app.name ? <span className="hidden truncate text-slate-600 lg:inline">{app.handle}</span> : null}
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {isNew ? (
                <span className="rounded-md bg-amber-100 px-1.5 text-[13px] font-bold uppercase tracking-wide text-amber-900">New</span>
              ) : null}
              {app.created_at ? (
                <span className="text-[15px] tabular-nums text-slate-600">{timeAgo(app.created_at).replace(" ago", "")}</span>
              ) : null}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <DecisionPill decision={recommended(app)} />
            <ScoreBadge score={app.score} />
            <span className="truncate text-[15px] text-slate-700">{app.reason || "No reason given"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ChannelBadge channel={app.channel} />
            {hit ? <BlocklistBadge /> : null}
            {app.auto_sent ? (
              <span className="rounded-md border border-sky-700 bg-sky-50 px-2 py-0.5 text-[13px] font-semibold text-sky-900">Auto-sent</span>
            ) : null}
            {chips.map((s) => (
              <SignalChip key={s.key} signal={s} />
            ))}
          </div>
        </div>
      </button>
    </li>
  );
}

export function QueueList({
  apps,
  selectedId,
  newIds,
  onSelect,
}: {
  apps: QueueApp[];
  selectedId: string | null;
  newIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <ul aria-label="Applications">
      {apps.map((app) => (
        <QueueRow key={app.id} app={app} selected={app.id === selectedId} isNew={newIds.has(app.id)} onSelect={() => onSelect(app.id)} />
      ))}
    </ul>
  );
}

export function QueueListSkeleton() {
  return (
    <ul aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex gap-3 border-b-2 border-slate-200 px-5 py-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
