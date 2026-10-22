"use client";

import clsx from "clsx";
import { Ban, CheckCircle2, Filter, Keyboard, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Dialog, ErrorState, Kbd, SegmentedControl, focusRing, toast, type Decision } from "@/components/ui";
import type { StatsResponse } from "@/lib/stats";
import { communityName } from "@/lib/ui/communities";
import { apiFetch, ApiError, useApi } from "@/lib/ui/useApi";
import { useCommunity } from "@/lib/ui/useCommunity";
import { QueueDetail, QueueDetailSkeleton, type ComposerState } from "./QueueDetail";
import { QueueList, QueueListSkeleton } from "./QueueList";
import {
  channelLabel,
  channelOf,
  displayHandle,
  draftTemplate,
  isBlocklistHit,
  recommended,
  sortQueue,
  type ChannelFilter,
  type DecisionFilter,
  type QueueApp,
  type QueueResponse,
} from "./model";

const POLL_MS = 10_000;
const UNDO_MS = 6_000;
const FILTER_KEY = "gk.queue.filters";
const HANDLED_KEY = "gk.queue.handled";

type Pending = { timer: ReturnType<typeof setTimeout>; toastId: string | number; app: QueueApp; composer: ComposerState };

const DECISION_FILTERS: DecisionFilter[] = ["all", "decline", "ask", "accept"];
const CHANNEL_FILTERS: ChannelFilter[] = ["all", "whatsapp", "discord", "web"];

function readHandled(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(HANDLED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function persistHandled(id: string) {
  try {
    const set = readHandled();
    set.add(id);
    window.sessionStorage.setItem(HANDLED_KEY, JSON.stringify([...set]));
  } catch {}
}

function defaultComposer(app: QueueApp): ComposerState {
  const decision = recommended(app);
  return { decision, text: draftTemplate(app, decision), report: false, evidence: "", error: null, recorded: null };
}

function blocker(app: QueueApp, c: ComposerState): string | null {
  const web = channelOf(app) === "web";
  if (web && c.decision === "ask") return "no channel";
  if (c.decision === "decline" && c.report && !c.evidence.trim()) return "evidence";
  if (!web && !c.text.trim()) return "text";
  return null;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message.endsWith(".") ? err.message : `${err.message}.`;
  return "Something went wrong.";
}

export default function QueueClient({ useMocks }: { useMocks: boolean }) {
  const [community] = useCommunity();
  const params = useSearchParams();
  const prefix = useMocks ? "/api/mock" : "/api";
  const queueUrl = `${prefix}/queue?community=${encodeURIComponent(community)}`;
  const { data, error, status, refetch } = useApi<QueueResponse>(queueUrl, { pollMs: POLL_MS });

  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [blocklistOnly, setBlocklistOnly] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("id"));
  const [handled, setHandled] = useState<Set<string>>(() => new Set());
  const [retained, setRetained] = useState<Record<string, QueueApp>>({});
  const [composers, setComposers] = useState<Record<string, ComposerState>>({});
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const [helpOpen, setHelpOpen] = useState(false);
  const pending = useRef(new Map<string, Pending>());
  const knownIds = useRef<Set<string> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  /* ---------- Restore filters (URL wins, then localStorage) + handled ids ---------- */
  useEffect(() => {
    let stored: { decision?: string; channel?: string; blocklist?: boolean } = {};
    try {
      stored = JSON.parse(window.localStorage.getItem(FILTER_KEY) || "{}");
    } catch {}
    const urlFilter = params.get("filter");
    const urlChannel = params.get("channel");
    const d = urlFilter ?? stored.decision;
    const c = urlChannel ?? stored.channel;
    if (DECISION_FILTERS.includes(d as DecisionFilter)) setDecisionFilter(d as DecisionFilter);
    if (CHANNEL_FILTERS.includes(c as ChannelFilter)) setChannelFilter(c as ChannelFilter);
    setBlocklistOnly(params.has("blocklist") ? params.get("blocklist") === "1" : stored.blocklist === true);
    setHandled(readHandled());
    setFiltersReady(true);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    try {
      window.localStorage.setItem(FILTER_KEY, JSON.stringify({ decision: decisionFilter, channel: channelFilter, blocklist: blocklistOnly }));
    } catch {}
  }, [decisionFilter, channelFilter, blocklistOnly, filtersReady]);

  /* ---------- Derived lists ---------- */
  const serverApps = useMemo(() => data?.applications ?? [], [data]);
  const allApps = useMemo(() => {
    const byId = new Map(serverApps.map((a) => [a.id, a]));
    for (const [id, app] of Object.entries(retained)) if (!byId.has(id)) byId.set(id, app);
    return sortQueue([...byId.values()].filter((a) => !handled.has(a.id)));
  }, [serverApps, retained, handled]);

  const baseFiltered = useMemo(
    () =>
      allApps.filter(
        (a) => (channelFilter === "all" || channelOf(a) === channelFilter) && (!blocklistOnly || isBlocklistHit(a))
      ),
    [allApps, channelFilter, blocklistOnly]
  );
  const counts = useMemo(() => {
    const c = { all: baseFiltered.length, decline: 0, ask: 0, accept: 0 };
    for (const a of baseFiltered) c[recommended(a)] += 1;
    return c;
  }, [baseFiltered]);
  const visible = useMemo(
    () => (decisionFilter === "all" ? baseFiltered : baseFiltered.filter((a) => recommended(a) === decisionFilter)),
    [baseFiltered, decisionFilter]
  );
  const selected = visible.find((a) => a.id === selectedId) ?? visible[0] ?? null;
  const composer = selected ? composers[selected.id] ?? defaultComposer(selected) : null;

  // Pin the effective selection so polling can't move it.
  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  /* ---------- URL: ?id= and ?filter= (+ channel / blocklist) ---------- */
  useEffect(() => {
    if (!filtersReady) return;
    const next = new URLSearchParams(window.location.search);
    const set = (k: string, v: string | null) => (v ? next.set(k, v) : next.delete(k));
    set("id", selected?.id ?? null);
    set("filter", decisionFilter === "all" ? null : decisionFilter);
    set("channel", channelFilter === "all" ? null : channelFilter);
    set("blocklist", blocklistOnly ? "1" : null);
    const qs = next.toString();
    if (qs !== window.location.search.replace(/^\?/, "")) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  }, [selected?.id, decisionFilter, channelFilter, blocklistOnly, filtersReady]);

  /* ---------- "New" markers for applications that arrive while polling ---------- */
  useEffect(() => {
    knownIds.current = null;
    setNewIds(new Set());
  }, [queueUrl]);

  useEffect(() => {
    if (!data) return;
    const ids = data.applications.map((a) => a.id);
    if (!knownIds.current) {
      knownIds.current = new Set(ids);
      return;
    }
    const fresh = ids.filter((id) => !knownIds.current!.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => knownIds.current!.add(id));
    setNewIds((prev) => new Set([...prev, ...fresh]));
    toast(fresh.length === 1 ? "New application in the queue" : `${fresh.length} new applications in the queue`);
  }, [data]);

  useEffect(() => {
    if (!selected || !newIds.has(selected.id)) return;
    const id = selected.id;
    const t = setTimeout(() => setNewIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    }), 2500);
    return () => clearTimeout(t);
  }, [selected, newIds]);

  /* ---------- Warn before leaving with an unsent reply ---------- */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* ---------- Actions ---------- */
  const select = useCallback((id: string, fromPointer = false) => {
    setSelectedId(id);
    if (fromPointer && window.innerWidth < 768) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, []);

  const move = useCallback(
    (delta: number) => {
      if (visible.length === 0) return;
      const idx = selected ? visible.findIndex((a) => a.id === selected.id) : -1;
      const next = visible[Math.min(visible.length - 1, Math.max(0, idx + delta))];
      if (next) setSelectedId(next.id);
    },
    [visible, selected]
  );

  const patchComposer = useCallback((app: QueueApp, patch: Partial<ComposerState>) => {
    setComposers((prev) => ({ ...prev, [app.id]: { ...(prev[app.id] ?? defaultComposer(app)), ...patch } }));
  }, []);

  const choose = useCallback(
    (decision: Decision) => {
      if (!selected) return;
      const current = composers[selected.id] ?? defaultComposer(selected);
      if (current.decision === decision) return;
      patchComposer(selected, { decision, text: draftTemplate(selected, decision), error: null });
    },
    [selected, composers, patchComposer]
  );

  const execute = useCallback(
    async (id: string) => {
      const entry = pending.current.get(id);
      if (!entry) return;
      pending.current.delete(id);
      const { app, composer: c } = entry;
      const channel = channelOf(app);
      const who = displayHandle(app);
      let recorded = c.recorded;
      // Replace the undo toast with a fresh one so its Undo action can't linger.
      toast.dismiss(entry.toastId);
      const toastId = toast.loading(channel === "web" ? `Saving decision for ${who}…` : `Sending to ${who} via ${channelLabel(channel)}…`, {
        duration: Infinity,
      });
      try {
        if (c.decision !== "ask" && !recorded) {
          await apiFetch(`${prefix}/decisions/${encodeURIComponent(app.id)}`, {
            method: "POST",
            body: JSON.stringify({
              decision: c.decision,
              report_to_blocklist: c.decision === "decline" && c.report,
              evidence: c.decision === "decline" && c.report ? c.evidence.trim() : undefined,
            }),
          });
          recorded = c.decision;
        }
        if (channel !== "web") {
          await apiFetch(`${prefix}/channel/send`, {
            method: "POST",
            body: JSON.stringify({ application_id: app.id, text: c.text.trim() }),
          });
        }
        persistHandled(app.id);
        toast.success(channel === "web" ? `Decision saved for ${who}` : `Reply sent to ${who} via ${channelLabel(channel)}`, {
          id: toastId,
          duration: 4000,
          description: c.decision === "decline" && c.report ? "Reported to the shared blocklist." : undefined,
        });
      } catch (err) {
        const message = errorMessage(err);
        setRetained((prev) => ({ ...prev, [app.id]: app }));
        setComposers((prev) => ({ ...prev, [app.id]: { ...c, recorded, error: message } }));
        setHandled((prev) => {
          const next = new Set(prev);
          next.delete(app.id);
          return next;
        });
        toast.error(`Not sent to ${who}`, {
          id: toastId,
          duration: 8000,
          description: recorded ? `Decision saved, but the reply failed: ${message} Draft kept.` : `${message} Draft kept.`,
          action: { label: "Open", onClick: () => setSelectedId(app.id) },
        });
      }
    },
    [prefix]
  );

  const undo = useCallback((id?: string) => {
    const key = id ?? [...pending.current.keys()].pop();
    const entry = key ? pending.current.get(key) : undefined;
    if (!key || !entry) {
      toast("Nothing to undo. Replies that already went out can't be unsent.");
      return;
    }
    clearTimeout(entry.timer);
    pending.current.delete(key);
    setHandled((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setRetained((prev) => ({ ...prev, [key]: entry.app }));
    setComposers((prev) => ({ ...prev, [key]: entry.composer }));
    setSelectedId(key);
    toast.dismiss(entry.toastId);
    toast(`Restored ${displayHandle(entry.app)} — nothing was sent`, { duration: 2500 });
  }, []);

  const send = useCallback(() => {
    if (!selected) return;
    const c = composers[selected.id] ?? defaultComposer(selected);
    if (blocker(selected, c)) return;
    const idx = visible.findIndex((a) => a.id === selected.id);
    const next = visible[idx + 1] ?? visible[idx - 1] ?? null;
    const app = selected;
    const channel = channelOf(app);
    const who = displayHandle(app);
    const verb = c.decision === "accept" ? "Accepted" : c.decision === "decline" ? "Declined" : "Asking";
    const committed: ComposerState = { ...c, error: null };

    setHandled((prev) => new Set(prev).add(app.id));
    setSelectedId(next?.id ?? null);
    textareaRef.current?.blur();

    const toastId = `gk-commit-${app.id}-${Date.now()}`;
    toast(`${verb} ${who}`, {
      id: toastId,
      duration: UNDO_MS,
      description: channel === "web" ? "Saving in 6s — undo with Z." : `Reply goes out via ${channelLabel(channel)} in 6s — undo with Z.`,
      action: { label: "Undo (Z)", onClick: () => undo(app.id) },
    });
    const timer = setTimeout(() => void execute(app.id), UNDO_MS);
    pending.current.set(app.id, { timer, toastId, app, composer: committed });
  }, [selected, composers, visible, execute, undo]);

  /* ---------- Keyboard ---------- */
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    if (helpOpen) return;
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (typing) {
      if (e.key === "Escape") {
        t?.blur();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && t === textareaRef.current) {
        e.preventDefault();
        send();
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Let Enter/Space activate focused buttons and links, except list rows.
    const onControl = !!t?.closest("button, a, [role=radio], [role=switch]") && !t?.closest("[data-queue-row]");
    const key = e.code === "Slash" && e.shiftKey ? "?" : e.key;
    switch (key) {
      case "j":
      case "J":
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "k":
      case "K":
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "a":
      case "A":
        choose("accept");
        break;
      case "s":
      case "S":
        choose("ask");
        break;
      case "d":
      case "D":
        choose("decline");
        break;
      case "e":
      case "E":
        e.preventDefault();
        if (textareaRef.current) {
          const el = textareaRef.current;
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
        break;
      case "Enter":
        if (onControl) return;
        e.preventDefault();
        send();
        break;
      case "z":
      case "Z":
        undo();
        break;
      case "r":
      case "R":
        void refetch();
        break;
      case "?":
        e.preventDefault();
        setHelpOpen(true);
        break;
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- Empty-state stats (only fetched when the queue is clear) ---------- */
  const queueClear = status !== "error" && !!data && allApps.length === 0;
  const stats = useApi<StatsResponse>(queueClear ? `${prefix}/stats?community=${encodeURIComponent(community)}` : null);

  /* ---------- Render ---------- */
  const loading = !data && (status === "loading" || status === "idle");
  const failed = !data && status === "error";

  return (
    <div className="flex flex-col bg-white text-[17px] text-slate-900 md:h-[calc(100dvh-66px)] md:overflow-hidden">
      {/* Top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b-2 border-slate-200 px-4 py-3 sm:px-6">
        <div className="mr-auto min-w-0 lg:mr-0">
          <h1 className="text-xl font-bold tracking-tight">Review queue</h1>
          <p className="truncate text-[15px] text-slate-600">{communityName(community)}</p>
        </div>
        <div className="-mx-1 max-w-full overflow-x-auto px-1 lg:mr-auto">
          <SegmentedControl<DecisionFilter>
            label="Filter by recommended decision"
            value={decisionFilter}
            onChange={setDecisionFilter}
            segments={[
              { value: "all", label: "All", count: counts.all },
              { value: "decline", label: "Decline", count: counts.decline, className: "bg-rose-600 text-white" },
              { value: "ask", label: "Ask", count: counts.ask, className: "bg-amber-500 text-slate-950" },
              { value: "accept", label: "Accept", count: counts.accept, className: "bg-emerald-600 text-white" },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex items-center">
            <span className="sr-only">Channel</span>
            <Filter className="pointer-events-none absolute left-3 h-4 w-4 text-slate-600" aria-hidden />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as ChannelFilter)}
              className={clsx(
                "h-11 appearance-none rounded-xl border-2 border-slate-200 bg-white pl-9 pr-4 text-[15px] font-semibold text-slate-900 hover:border-slate-300",
                focusRing
              )}
            >
              <option value="all">All channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="discord">Discord</option>
              <option value="web">Web</option>
            </select>
          </label>
          <button
            type="button"
            aria-pressed={blocklistOnly}
            onClick={() => setBlocklistOnly((v) => !v)}
            className={clsx(
              "inline-flex h-11 items-center gap-2 rounded-xl border-2 px-3 text-[15px] font-semibold transition-colors duration-150",
              focusRing,
              blocklistOnly ? "border-rose-700 bg-rose-700 text-white" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
            )}
          >
            <Ban className="h-4 w-4" aria-hidden strokeWidth={2.5} />
            Blocklist only
          </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Keyboard shortcuts"
            className={clsx("hidden h-11 items-center gap-2 rounded-xl border-2 border-slate-200 px-3 sm:inline-flex text-[15px] font-semibold text-slate-900 hover:border-slate-300", focusRing)}
          >
            <Keyboard className="h-4 w-4" aria-hidden />
            <Kbd>?</Kbd>
          </button>
        </div>
      </div>

      {failed ? (
        <div className="p-4 sm:p-6">
          <ErrorState
            title="Couldn't load the queue"
            message={error?.message ?? "Something went wrong."}
            details={error?.details}
            onRetry={() => void refetch()}
          />
        </div>
      ) : queueClear ? (
        <QueueClear stats={stats.data} onReload={() => void refetch()} />
      ) : (
        <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
          {/* List */}
          <div className="flex flex-col border-b-2 border-slate-200 md:min-h-0 md:w-2/5 md:border-b-0 md:border-r-2">
            <div className="relative max-h-[42dvh] overflow-y-auto md:max-h-none md:flex-1" aria-busy={loading || undefined}>
              {loading ? (
                <QueueListSkeleton />
              ) : visible.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-lg font-bold text-slate-900">Nothing matches these filters</p>
                  <p className="mt-1 text-slate-600">{allApps.length} waiting in total.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setDecisionFilter("all");
                      setChannelFilter("all");
                      setBlocklistOnly(false);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <QueueList apps={visible} selectedId={selected?.id ?? null} newIds={newIds} onSelect={(id) => select(id, true)} />
              )}
            </div>
            <div className="hidden shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-t-2 border-slate-200 bg-slate-50 px-5 py-2.5 text-[15px] text-slate-700 md:flex">
              <span><Kbd>J</Kbd> <Kbd>K</Kbd> move</span>
              <span><Kbd>A</Kbd> <Kbd>S</Kbd> <Kbd>D</Kbd> decide</span>
              <span><Kbd>E</Kbd> edit</span>
              <span><Kbd>⏎</Kbd> send</span>
              <span><Kbd>Z</Kbd> undo</span>
            </div>
          </div>

          {/* Detail */}
          <div ref={detailRef} className="flex scroll-mt-16 flex-col md:min-h-0 md:w-3/5">
            {loading ? (
              <QueueDetailSkeleton />
            ) : selected && composer ? (
              <QueueDetail
                app={selected}
                composer={composer}
                onChoose={choose}
                onComposerChange={(patch) => patchComposer(selected, patch)}
                onSend={send}
                textareaRef={textareaRef}
              />
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center text-slate-600">Select an application to review it.</div>
            )}
          </div>
        </div>
      )}

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts">
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5">
          {(
            [
              [["J", "K"], "Next / previous application"],
              [["A"], "Choose Accept (loads the accept reply)"],
              [["S"], "Choose Ask (loads a clarifying question)"],
              [["D"], "Choose Decline (loads the decline reply)"],
              [["E"], "Edit the reply · Esc to leave the box"],
              [["⏎"], "Send the reply and move on · ⌘/Ctrl ⏎ inside the box"],
              [["Z"], "Undo within 6 seconds — before anything is sent"],
              [["R"], "Reload the queue"],
              [["?"], "Show this help"],
            ] as const
          ).map(([keys, label]) => (
            <div key={label} className="contents">
              <dt className="flex gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </dt>
              <dd className="text-slate-800">{label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[15px] text-slate-600">Single-key shortcuts are ignored while you type.</p>
      </Dialog>
    </div>
  );
}

function QueueClear({ stats, onReload }: { stats: StatsResponse | null; onReload: () => void }) {
  const saved = stats?.time_saved_minutes_estimate ?? 0;
  const savedLabel = saved >= 60 ? `${Math.floor(saved / 60)}h ${saved % 60}m` : `${saved}m`;
  return (
    <div className="grid flex-1 place-items-center px-6 py-16 text-center">
      <div className="animate-gk-fade-in motion-reduce:animate-none">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" aria-hidden />
        <h2 className="mt-4 text-5xl font-black tracking-tight text-emerald-700">Queue clear ✓</h2>
        {stats && stats.handled_today > 0 ? (
          <p className="mt-4 text-lg text-slate-700">
            <strong className="text-slate-900">{stats.handled_today} handled today</strong>
            {saved > 0 ? (
              <>
                {" "}
                · <strong className="text-slate-900" title="Estimate: 5 minutes per manual review">≈ {savedLabel} saved</strong>{" "}
                <span className="text-slate-600">(estimate)</span>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-4 text-lg text-slate-700">Nothing is waiting for a lead right now.</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3 text-slate-600">
          <Button variant="secondary" onClick={onReload} icon={<RotateCw className="h-4 w-4" aria-hidden />}>
            Reload
          </Button>
          <span className="inline-flex items-center gap-1 text-[15px]">
            or press <Kbd>R</Kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
