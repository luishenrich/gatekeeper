"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, HelpCircle } from "lucide-react";
import type { Decision, QueueApp, UndoSnapshot } from "./types";
import {
  buildSignals,
  canSendChannel,
  COMMUNITIES,
  confidenceLabel,
  draftFor,
  isAutoSent,
  isBlocklistHit,
  normalizeApp,
  parseRuleNumber,
  relativeTime,
  RULE_TEXTS,
  sendLabel,
  sortQueue,
} from "./helpers";
import { useQueueKeyboard } from "./useQueueKeyboard";
import {
  AutoSentBadge,
  Avatar,
  BlocklistBadge,
  ChannelBadge,
  DecisionPill,
  decisionSoftClass,
  Kbd,
  SignalChip,
} from "./ui";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_GATEKEEPER_API_URL || "";
}

function PasscodeForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/lead/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        setError("Passcode not accepted");
        return;
      }
      setPasscode("");
      router.refresh();
    } catch {
      setError("Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-[17px] text-slate-900">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border-2 border-slate-200 bg-white p-6"
      >
        <h1 className="text-xl font-bold">Lead sign-in</h1>
        <p className="text-base text-slate-600">
          Enter the queue passcode. It stays in an httpOnly cookie.
        </p>
        <input
          type="password"
          name="passcode"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-300 px-3 py-2 text-lg"
          required
        />
        {error && <p className="text-base font-semibold text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={pending || passcode.length === 0}
          className="h-12 w-full rounded-xl bg-slate-900 text-lg font-bold text-white disabled:opacity-50"
        >
          {pending ? "Checking…" : "Continue"}
        </button>
      </form>
    </main>
  );
}

type DecisionFilter = "all" | Decision;
type ChannelFilter = "all" | "whatsapp" | "discord";

export default function ReviewQueue({
  useMocks,
  authed,
}: {
  useMocks: boolean;
  authed: boolean;
}) {
  const [community, setCommunity] = useState<string>(COMMUNITIES[0].slug);
  const [apps, setApps] = useState<QueueApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<Decision>("ask");
  const [replyText, setReplyText] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [blocklistOnly, setBlocklistOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [handledToday, setHandledToday] = useState(0);
  const [blockedScammers, setBlockedScammers] = useState(0);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCommit = useRef<{
    app: QueueApp;
    decision: Decision;
    text: string;
  } | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  function decisionsPath(id: string): string {
    const prefix = useMocks ? "/api/mock" : "/api";
    return `${apiBase()}${prefix}/decisions/${id}`;
  }

  function channelSendPath(): string {
    const prefix = useMocks ? "/api/mock" : "/api";
    return `${apiBase()}${prefix}/channel/send`;
  }

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError(null);
    try {
      const prefix = useMocks ? "/api/mock" : "/api";
      const res = await fetch(
        `${apiBase()}${prefix}/queue?community=${encodeURIComponent(community)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(`Queue failed (${res.status})`);
      const data = await res.json();
      const list = sortQueue(
        ((data.applications ?? []) as QueueApp[]).map(normalizeApp)
      );
      setApps(list);
      setSelectedId(list[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [community, authed, useMocks]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (decisionFilter !== "all" && a.decision !== decisionFilter) return false;
      if (channelFilter !== "all" && a.channel !== channelFilter) return false;
      if (blocklistOnly && !isBlocklistHit(a)) return false;
      return true;
    });
  }, [apps, decisionFilter, channelFilter, blocklistOnly]);

  const selected = useMemo(
    () => filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setSelectedId(null);
      return;
    }
    if (selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setPendingDecision(selected.decision);
    setReplyText(draftFor(selected.decision, selected));
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const all = apps.length;
    let decline = 0;
    let ask = 0;
    let accept = 0;
    for (const a of apps) {
      if (a.decision === "decline") decline += 1;
      else if (a.decision === "ask") ask += 1;
      else accept += 1;
    }
    return { all, decline, ask, accept };
  }, [apps]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
  }, []);

  const commitPending = useCallback(async () => {
    const job = pendingCommit.current;
    pendingCommit.current = null;
    setUndo(null);
    if (!job) return;

    const { app, decision, text } = job;
    try {
      if (decision === "accept" || decision === "decline") {
        const report = decision === "decline" && isBlocklistHit(app);
        const res = await fetch(decisionsPath(app.id), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            report_to_blocklist: report,
            evidence: report ? app.reason : undefined,
          }),
        });
        if (!res.ok) throw new Error(`Decision failed (${res.status})`);
      }

      if (canSendChannel(app.channel) && text.trim()) {
        const res = await fetch(channelSendPath(), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ application_id: app.id, text: text.trim() }),
        });
        if (!res.ok) throw new Error(`Send failed (${res.status})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  }, [useMocks]); // eslint-disable-line react-hooks/exhaustive-deps

  const performUndo = useCallback(() => {
    if (!undo) return;
    clearUndoTimer();
    pendingCommit.current = null;
    const snap = undo;
    setApps((list) => {
      const next = [...list];
      next.splice(Math.min(snap.index, next.length), 0, snap.item);
      return sortQueue(next);
    });
    setSelectedId(snap.item.id);
    setPendingDecision(snap.pendingDecision);
    setReplyText(snap.replyText);
    setHandledToday((n) => Math.max(0, n - 1));
    if (snap.pendingDecision === "decline" && isBlocklistHit(snap.item)) {
      setBlockedScammers((n) => Math.max(0, n - 1));
    }
    setUndo(null);
  }, [undo, clearUndoTimer]);

  const decideLocal = useCallback(
    (d: Decision) => {
      if (!selected) return;
      setPendingDecision(d);
      setReplyText(draftFor(d, selected));
    },
    [selected]
  );

  const sendAndAdvance = useCallback(() => {
    if (!selected) return;
    const app = selected;
    const decision = pendingDecision;
    const text = replyText;
    const index = apps.findIndex((a) => a.id === app.id);
    const remaining = filtered.filter((a) => a.id !== app.id);
    const nextId = remaining[0]?.id ?? null;

    clearUndoTimer();
    pendingCommit.current = { app, decision, text };

    setApps((list) => list.filter((a) => a.id !== app.id));
    setSelectedId(nextId);
    setHandledToday((n) => n + 1);
    if (decision === "decline" && isBlocklistHit(app)) {
      setBlockedScammers((n) => n + 1);
    }

    const channelWord = canSendChannel(app.channel)
      ? ` · reply sent via ${app.channel === "whatsapp" ? "WhatsApp" : "Discord"}`
      : "";
    const label = `${decision === "accept" ? "Accepted" : decision === "ask" ? "Asked" : "Declined"} ${app.handle}${channelWord}`;

    setUndo({
      item: app,
      index: index < 0 ? 0 : index,
      pendingDecision: decision,
      replyText: text,
      toastLabel: label,
    });

    undoTimer.current = setTimeout(() => {
      void commitPending();
    }, 6000);
  }, [
    selected,
    pendingDecision,
    replyText,
    apps,
    filtered,
    clearUndoTimer,
    commitPending,
  ]);

  const move = useCallback(
    (delta: number) => {
      if (filtered.length === 0) return;
      const idx = filtered.findIndex((a) => a.id === selected?.id);
      const base = idx < 0 ? 0 : idx;
      const next = Math.max(0, Math.min(filtered.length - 1, base + delta));
      setSelectedId(filtered[next].id);
    },
    [filtered, selected]
  );

  const focusReply = useCallback(() => {
    replyRef.current?.focus();
  }, []);

  const keyboardHandlers = useMemo(
    () => ({
      onMove: move,
      onDecide: decideLocal,
      onFocusReply: focusReply,
      onSend: sendAndAdvance,
      onUndo: performUndo,
      onHelp: () => setHelpOpen((v) => !v),
      onReload: () => void load(),
      enabled: authed && !loading,
    }),
    [move, decideLocal, focusReply, sendAndAdvance, performUndo, load, authed, loading]
  );

  useQueueKeyboard(keyboardHandlers);

  useEffect(() => {
    return () => clearUndoTimer();
  }, [clearUndoTimer]);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-app-id="${selectedId}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (!authed) return <PasscodeForm />;

  const communityName =
    COMMUNITIES.find((c) => c.slug === community)?.name ?? community;
  const minutesSaved = handledToday * 5;
  const hours = Math.floor(minutesSaved / 60);
  const mins = minutesSaved % 60;
  const savedLabel =
    hours > 0 ? `≈ ${hours}h ${mins}m saved` : `≈ ${mins}m saved`;

  return (
    <div className="flex h-screen flex-col bg-white text-[17px] text-slate-900">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b-2 border-slate-200 px-6">
        <Link href="/" className="font-bold text-slate-900 hover:underline">
          Gatekeeper
        </Link>
        <span className="text-slate-600">·</span>
        <select
          className="rounded-lg border-2 border-slate-300 bg-white px-2 py-1.5 font-semibold"
          value={community}
          onChange={(e) => setCommunity(e.target.value)}
          aria-label="Community"
        >
          {COMMUNITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {(
            [
              ["all", "All", counts.all],
              ["decline", "Decline", counts.decline],
              ["ask", "Ask", counts.ask],
              ["accept", "Accept", counts.accept],
            ] as const
          ).map(([key, label, n]) => {
            const active = decisionFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDecisionFilter(key)}
                className={`h-10 rounded-lg border-2 px-3 font-bold ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {label} {n}
              </button>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-slate-300 px-3 font-bold hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" aria-hidden />
              Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border-2 border-slate-300 bg-white p-4 shadow-xl">
                <label className="block font-bold">Channel</label>
                <select
                  className="mt-1 w-full rounded-lg border-2 border-slate-300 px-2 py-2 font-semibold"
                  value={channelFilter}
                  onChange={(e) =>
                    setChannelFilter(e.target.value as ChannelFilter)
                  }
                >
                  <option value="all">All channels</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="discord">Discord</option>
                </select>
                <label className="mt-3 block font-bold">Community</label>
                <select
                  className="mt-1 w-full rounded-lg border-2 border-slate-300 px-2 py-2 font-semibold"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                >
                  {COMMUNITIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label className="mt-3 flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={blocklistOnly}
                    onChange={(e) => setBlocklistOnly(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Blocklist hits only
                </label>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-300 hover:bg-slate-50"
            aria-label="Keyboard help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      {error && (
        <div className="border-b-2 border-rose-600 bg-rose-50 px-6 py-3 font-semibold text-rose-900">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-slate-600">
          Loading queue…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          handledToday={handledToday}
          savedLabel={savedLabel}
          blockedScammers={blockedScammers}
          onReload={() => void load()}
        />
      ) : (
        <div className="flex min-h-0 flex-1">
          <ul
            ref={listRef}
            className="w-2/5 overflow-y-auto border-r-2 border-slate-200"
          >
            {filtered.map((app) => {
              const hit = isBlocklistHit(app);
              const active = app.id === selected?.id;
              const signals = buildSignals(app).slice(0, 3);
              return (
                <li
                  key={app.id}
                  data-app-id={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={`flex cursor-pointer gap-3 border-b border-slate-200 px-5 py-4 hover:bg-slate-50 ${
                    active ? "bg-slate-100 ring-2 ring-inset ring-slate-900" : ""
                  } ${hit ? "border-l-8 border-l-rose-600" : ""}`}
                >
                  <Avatar name={app.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{app.name}</span>
                      <span className="truncate text-slate-600">{app.handle}</span>
                      <ChannelBadge channel={app.channel} />
                      {hit && <BlocklistBadge />}
                      {isAutoSent(app) && <AutoSentBadge />}
                      <span className="ml-auto shrink-0 tabular-nums text-slate-600">
                        {relativeTime(app.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <DecisionPill decision={app.decision} size="sm" />
                      <span className="font-bold tabular-nums">{app.score}</span>
                      <span className="truncate text-slate-700">{app.reason}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {signals.map((s) => (
                        <SignalChip key={s.key} signal={s} size="sm" />
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex w-3/5 flex-col overflow-y-auto p-8">
            {selected && (
              <DecisionDetail
                app={selected}
                pendingDecision={pendingDecision}
                replyText={replyText}
                onReplyChange={setReplyText}
                onDecide={decideLocal}
                onSend={sendAndAdvance}
                replyRef={replyRef}
              />
            )}
          </div>
        </div>
      )}

      <footer className="flex h-12 shrink-0 items-center gap-3 border-t-2 border-slate-200 px-6 text-base text-slate-600">
        <Kbd>J</Kbd>
        <Kbd>K</Kbd>
        <span>move</span>
        <span>·</span>
        <Kbd>A</Kbd>
        <Kbd>S</Kbd>
        <Kbd>D</Kbd>
        <span>decide</span>
        <span>·</span>
        <Kbd>E</Kbd>
        <span>edit</span>
        <span>·</span>
        <Kbd>⏎</Kbd>
        <span>send</span>
        <span>·</span>
        <Kbd>?</Kbd>
        <span>help</span>
        <span className="ml-auto font-semibold text-slate-700">
          {communityName}
        </span>
      </footer>

      {undo && (
        <div className="fixed bottom-6 left-6 z-30 flex items-center gap-4 rounded-xl bg-slate-900 px-5 py-4 text-lg text-white shadow-xl">
          <span>{undo.toastLabel}</span>
          <button
            type="button"
            onClick={performUndo}
            className="rounded-lg bg-white px-3 py-1.5 font-bold text-slate-900"
          >
            UNDO (Z)
          </button>
        </div>
      )}

      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function EmptyState({
  handledToday,
  savedLabel,
  blockedScammers,
  onReload,
}: {
  handledToday: number;
  savedLabel: string;
  blockedScammers: number;
  onReload: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-black text-emerald-700">Queue clear ✓</p>
      <p className="text-xl font-semibold text-slate-800">
        <span className="font-bold">{handledToday} handled today</span>
        {" · "}
        <span
          className="font-bold"
          title="Assumption: each manual review takes ~5 minutes"
        >
          {savedLabel}
        </span>
      </p>
      {blockedScammers > 0 && (
        <p className="text-lg text-slate-600">
          Blocked {blockedScammers} repeat scammer
          {blockedScammers === 1 ? "" : "s"} across partner communities
        </p>
      )}
      <button
        type="button"
        onClick={onReload}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-4 py-2 font-bold hover:bg-slate-50"
      >
        Press <Kbd>R</Kbd> to reload
      </button>
    </div>
  );
}

function DecisionDetail({
  app,
  pendingDecision,
  replyText,
  onReplyChange,
  onDecide,
  onSend,
  replyRef,
}: {
  app: QueueApp;
  pendingDecision: Decision;
  replyText: string;
  onReplyChange: (v: string) => void;
  onDecide: (d: Decision) => void;
  onSend: () => void;
  replyRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const hit = isBlocklistHit(app);
  const ruleN = parseRuleNumber(app.reason);
  const ruleText = RULE_TEXTS[ruleN] || RULE_TEXTS[1];
  const signals = buildSignals(app);
  const soft = decisionSoftClass(pendingDecision);

  return (
    <div
      className={`flex min-h-full flex-col rounded-2xl ${
        hit ? "ring-4 ring-rose-600" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <Avatar name={app.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-3xl font-bold">{app.name}</h2>
            <span className="text-lg text-slate-600">{app.handle}</span>
            <ChannelBadge channel={app.channel} />
            {hit && <BlocklistBadge size="md" />}
            {isAutoSent(app) && <AutoSentBadge />}
          </div>
          <p className="mt-1 text-base text-slate-600">
            Applied to {app.community_name} · {relativeTime(app.created_at)} ago
          </p>
        </div>
      </div>

      <div className={`mt-6 rounded-2xl border-2 p-6 ${soft}`}>
        <div className="flex flex-wrap items-end gap-6">
          <DecisionPill decision={pendingDecision} size="xl" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black tabular-nums">
                {app.score}
              </span>
              <span className="text-2xl font-bold text-slate-600">/100</span>
            </div>
            <p className="mt-1 text-base font-semibold text-slate-700">
              {confidenceLabel(app.score)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold">Reason</h3>
        <p className="mt-2 text-lg leading-relaxed">{app.reason}</p>
        <blockquote className="mt-3 border-l-4 border-slate-900 pl-4 text-lg italic text-slate-800">
          <span className="font-bold not-italic">Rule {ruleN}</span>
          {" — "}
          {ruleText}
        </blockquote>
      </div>

      {hit && (
        <div className="mt-6 rounded-xl border-2 border-rose-600 bg-rose-50 p-5">
          <p className="text-lg font-bold text-rose-900">
            🚫 Seen in{" "}
            {app.blocklist_match?.prior_community_name || "a partner community"}
            , same phone hash
          </p>
          {app.blocklist_match?.prior_reason && (
            <p className="mt-2 text-base text-rose-900">
              Declined there for: {app.blocklist_match.prior_reason}
              {app.blocklist_match.matched_handle
                ? ` · handle variant ${app.handle} ↔ ${app.blocklist_match.matched_handle}`
                : ""}
            </p>
          )}
          {app.blocklist_match?.hash_prefix && (
            <p className="mt-2 font-mono text-base font-semibold text-rose-900">
              {app.blocklist_match.hash_prefix}
            </p>
          )}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-bold">Signals</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {signals.map((s) => (
            <SignalChip key={s.key} signal={s} size="lg" />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold">Application</h3>
        <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-lg leading-relaxed">
          {app.text}
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto border-t-2 border-slate-200 bg-white pt-4">
        <label className="text-lg font-bold" htmlFor="reply-draft">
          Reply draft
        </label>
        <textarea
          id="reply-draft"
          ref={replyRef}
          value={replyText}
          onChange={(e) => onReplyChange(e.target.value)}
          className="mt-2 w-full min-h-28 rounded-xl border-2 border-slate-300 p-4 text-lg focus:border-slate-900 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!replyText.trim()}
            onClick={onSend}
            className="inline-flex h-14 items-center gap-2 rounded-xl bg-slate-900 px-6 text-lg font-bold text-white disabled:opacity-50"
          >
            {sendLabel(app.channel)}
            <Kbd>⏎</Kbd>
          </button>
          <button
            type="button"
            onClick={() => onDecide("accept")}
            className="inline-flex h-14 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-lg font-bold text-white"
          >
            Accept <Kbd>A</Kbd>
          </button>
          <button
            type="button"
            onClick={() => onDecide("ask")}
            className="inline-flex h-14 items-center gap-2 rounded-xl bg-amber-500 px-6 text-lg font-bold text-slate-950"
          >
            Ask <Kbd>S</Kbd>
          </button>
          <button
            type="button"
            onClick={() => onDecide("decline")}
            className="inline-flex h-14 items-center gap-2 rounded-xl bg-rose-600 px-6 text-lg font-bold text-white"
          >
            Decline <Kbd>D</Kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["J / K", "Next / previous row"],
    ["A", "Set Accept (loads accept draft)"],
    ["S", "Set Ask / needs info"],
    ["D", "Set Decline"],
    ["E", "Focus reply textarea (Esc leaves)"],
    ["Enter", "Send reply + confirm decision"],
    ["⌘/Ctrl+Enter", "Send while editing reply"],
    ["Z", "Undo last action"],
    ["R", "Reload queue"],
    ["?", "Toggle this help"],
  ];
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-2 border-slate-300 px-3 py-1 font-bold"
          >
            Esc
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {rows.map(([k, v]) => (
            <li key={k} className="flex items-center gap-3 text-base">
              <span className="w-36 shrink-0 font-mono font-bold">{k}</span>
              <span className="text-slate-700">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
