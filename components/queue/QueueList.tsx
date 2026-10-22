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
    <li className={clsx("border-b border-border/70", isNew && "animate-gk-highlight motion-reduce:animate-none")}>
      <button
        ref={ref}
        type="button"
        data-queue-row
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={clsx(
          "relative flex w-full gap-3.5 px-4 py-4 text-left transition-colors duration-150 ease-out sm:px-5",
          focusRing,
          "focus-visible:ring-inset focus-visible:ring-offset-0",
          hit && "border-l-4 border-l-rose-500",
          selected ? "bg-muted" : "hover:bg-foreground/[0.03]"
        )}
      >
        {selected && !hit ? <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-foreground" /> : null}
        <Avatar label={initials(app.name, app.handle)} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-foreground">{app.name || app.handle || "Unnamed applicant"}</span>
            {app.handle && app.name ? <span className="hidden truncate text-[14px] text-muted-foreground lg:inline">{app.handle}</span> : null}
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {isNew ? (
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-background">New</span>
              ) : null}
              {app.created_at ? (
                <span className="text-[13px] tabular-nums text-muted-foreground">{timeAgo(app.created_at).replace(" ago", "")}</span>
              ) : null}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <DecisionPill decision={recommended(app)} />
            <ScoreBadge score={app.score} />
            <span className="truncate text-[14px] text-muted-foreground">{app.reason || "No reason given"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <ChannelBadge channel={app.channel} />
            {hit ? <BlocklistBadge /> : null}
            {app.auto_sent ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[12px] font-medium text-sky-900">Auto-sent</span>
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
        <li key={i} className="flex gap-3.5 border-b border-border/70 px-5 py-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
