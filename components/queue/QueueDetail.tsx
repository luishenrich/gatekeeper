"use client";

import clsx from "clsx";
import { AlertTriangle, Check, ExternalLink, HelpCircle, Info, Send, X } from "lucide-react";
import type { Ref } from "react";
import {
  Avatar,
  BlocklistCallout,
  Button,
  ChannelBadge,
  DECISION_SOFT,
  DecisionPill,
  Kbd,
  ScoreBadge,
  SignalChip,
  Skeleton,
  focusRing,
  scoreBand,
  type Decision,
} from "@/components/ui";
import { buildSignalsFromApi, parseRuleNumber, ruleText } from "@/lib/signals-ui";
import { REPO_URL } from "@/lib/ui/communities";
import { initials, maskPhone, timeAgo } from "@/lib/ui/format";
import { channelLabel, channelOf, isBlocklistHit, priorCommunityName, recommended, type QueueApp } from "./model";

const RULES_URL = `${REPO_URL}/blob/main/data/rules.md`;

export type ComposerState = {
  decision: Decision;
  text: string;
  report: boolean;
  evidence: string;
  error: string | null;
  /** Decision already stored server-side (send failed afterwards). */
  recorded: Decision | null;
};

const DECISION_BUTTONS: { decision: Decision; key: string; label: string; Icon: typeof Check; solid: string; ring: string }[] = [
  { decision: "accept", key: "A", label: "Accept", Icon: Check, solid: "border-emerald-600 bg-emerald-600 text-white", ring: "ring-emerald-600" },
  { decision: "ask", key: "S", label: "Ask", Icon: HelpCircle, solid: "border-amber-500 bg-amber-500 text-slate-950", ring: "ring-amber-500" },
  { decision: "decline", key: "D", label: "Decline", Icon: X, solid: "border-rose-600 bg-rose-600 text-white", ring: "ring-rose-600" },
];

function sendLabel(decision: Decision, channel: string): string {
  if (channel === "web") return decision === "ask" ? "No channel to ask" : `Save ${decision}`;
  return `Send via ${channelLabel(channel)}`;
}

export function QueueDetail({
  app,
  composer,
  onChoose,
  onComposerChange,
  onSend,
  textareaRef,
}: {
  app: QueueApp;
  composer: ComposerState;
  onChoose: (d: Decision) => void;
  onComposerChange: (patch: Partial<ComposerState>) => void;
  onSend: () => void;
  textareaRef: Ref<HTMLTextAreaElement>;
}) {
  const rec = recommended(app);
  const hit = isBlocklistHit(app);
  const channel = channelOf(app);
  const ruleNo = parseRuleNumber(app.reason || "");
  const signals = buildSignalsFromApi(app.signals, app.github).map((s) =>
    s.key === "blocklist_hit" && hit ? { ...s, evidence: `hit in ${priorCommunityName(app)}` } : s
  );
  const band = typeof app.score === "number" ? scoreBand(app.score) : null;
  const isWeb = channel === "web";
  const askBlocked = isWeb && composer.decision === "ask";
  const evidenceMissing = composer.decision === "decline" && composer.report && !composer.evidence.trim();
  const textMissing = !isWeb && !composer.text.trim();
  const canSend = !askBlocked && !evidenceMissing && !textMissing;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <article
          key={app.id}
          aria-label={`Application from ${app.name || app.handle || "applicant"}`}
          className={clsx(
            "space-y-6 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6",
            hit && "ring-4 ring-rose-600"
          )}
        >
          {/* Header */}
          <header className="flex items-start gap-4">
            <Avatar label={initials(app.name, app.handle)} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{app.name || app.handle || "Unnamed applicant"}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
                {app.handle ? <span className="font-medium">{app.handle}</span> : null}
                <ChannelBadge channel={app.channel} />
                {app.auto_sent ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-700 bg-sky-50 px-2 py-0.5 text-[13px] font-semibold text-sky-900">
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Auto-sent
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[16px] text-slate-600">
                Applied to {app.community_name || "this community"}
                {app.created_at ? <> · {timeAgo(app.created_at)}</> : null}
                {app.phone && !hit ? <> · {maskPhone(app.phone)}</> : null}
              </p>
            </div>
          </header>

          {/* Recommendation */}
          <section aria-label="Gatekeeper recommendation" className={clsx("rounded-2xl border-2 p-5 sm:p-6", DECISION_SOFT[rec])}>
            <p className="text-[15px] font-semibold uppercase tracking-wide text-slate-700">Gatekeeper recommends</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
              <DecisionPill decision={rec} size="xl" />
              <ScoreBadge score={app.score} size="xl" />
              {band ? <span className={clsx("text-lg font-bold", band.className)}>{band.label} fit</span> : null}
            </div>
            <p className="mt-4 text-lg leading-relaxed text-slate-900">{app.reason || "No reason recorded."}</p>
            <blockquote className="mt-3 border-l-4 border-slate-900 pl-4 italic text-slate-800">
              <a
                href={RULES_URL}
                target="_blank"
                rel="noreferrer"
                className={clsx("inline-flex items-center gap-1 font-bold not-italic text-slate-900 underline underline-offset-2", focusRing)}
              >
                Rule {ruleNo}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>{" "}
              — {ruleText(ruleNo)}
            </blockquote>
          </section>

          {hit ? (
            <BlocklistCallout
              match={{
                prior_community_name: priorCommunityName(app),
                hash_prefix: app.blocklist_match?.hash_prefix ?? null,
                matched_on: app.blocklist_match?.matched_on ?? null,
                status: app.blocklist_match?.status ?? null,
                reported_at: app.blocklist_match?.reported_at ?? null,
              }}
            />
          ) : null}

          {/* Signals */}
          <section aria-labelledby="signals-h">
            <h3 id="signals-h" className="mb-3 text-lg font-bold text-slate-900">
              Signals
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {signals.map((s) => (
                <SignalChip key={s.key} signal={s} size="lg" />
              ))}
            </div>
          </section>

          {/* Application text */}
          <section aria-labelledby="text-h">
            <h3 id="text-h" className="mb-3 text-lg font-bold text-slate-900">
              Application
            </h3>
            <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-lg leading-relaxed text-slate-900">
              {app.text || "No application text."}
            </p>
          </section>
        </article>
      </div>

      {/* Composer — pinned at the bottom of the detail pane */}
      <section
        aria-label="Reply and decision"
        className="shrink-0 border-t-2 border-slate-200 bg-white px-4 py-3 sm:px-6 md:shadow-[0_-8px_16px_-12px_rgba(15,23,42,0.25)] lg:px-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Your decision">
            {DECISION_BUTTONS.map(({ decision, key, label, Icon, solid, ring }) => {
              const active = composer.decision === decision;
              return (
                <button
                  key={decision}
                  type="button"
                  aria-pressed={active}
                  aria-keyshortcuts={key}
                  onClick={() => onChoose(decision)}
                  className={clsx(
                    "inline-flex h-12 items-center gap-2 rounded-xl border-2 px-3 text-[17px] font-bold transition-colors duration-150 ease-out sm:px-4",
                    focusRing,
                    active ? clsx(solid, "ring-2 ring-offset-2", ring) : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden strokeWidth={3} />
                  {label}
                  <Kbd className="hidden 2xl:inline-flex">{key}</Kbd>
                </button>
              );
            })}
          </div>
          <Button
            size="lg"
            className="h-12 w-full sm:ml-auto sm:w-auto"
            variant={composer.decision === "decline" ? "danger" : composer.decision === "accept" ? "accept" : "ask"}
            onClick={onSend}
            disabled={!canSend}
            icon={<Send className="h-5 w-5" aria-hidden />}
          >
            {sendLabel(composer.decision, channel)}
            <Kbd className="ml-1 hidden lg:inline-flex">⏎</Kbd>
          </Button>
        </div>

        {isWeb ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[16px] text-slate-700">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {askBlocked
              ? "Web applications have no outbound channel, so a question can't be sent from here. Accept or decline instead."
              : "Web application: no outbound channel. Gatekeeper saves your decision but can't message the applicant."}
          </p>
        ) : (
          <div className="mt-3">
            <label htmlFor="gk-reply" className="flex items-baseline justify-between gap-3 text-[16px] font-semibold text-slate-900">
              <span>
                Reply to {app.handle || "applicant"} via {channelLabel(channel)}
              </span>
              <span className="hidden items-center gap-1 font-medium text-slate-600 lg:inline-flex">
                <Kbd>E</Kbd> edit · <Kbd>⌘</Kbd>
                <Kbd>⏎</Kbd> send
              </span>
            </label>
            <textarea
              id="gk-reply"
              ref={textareaRef}
              value={composer.text}
              onChange={(e) => onComposerChange({ text: e.target.value, error: null })}
              placeholder="Write a reply…"
              rows={2}
              className={clsx(
                "mt-1.5 w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-[17px] leading-relaxed text-slate-900 placeholder:text-slate-600 focus-visible:border-slate-900",
                focusRing
              )}
            />
          </div>
        )}

        {composer.decision === "decline" && !hit && !composer.recorded ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="inline-flex items-center gap-2 text-[16px] font-medium text-slate-900">
              <input
                type="checkbox"
                className="h-5 w-5 accent-rose-600"
                checked={composer.report}
                onChange={(e) => onComposerChange({ report: e.target.checked })}
              />
              Also report to the shared blocklist
            </label>
            {composer.report ? (
              <input
                type="text"
                aria-label="Evidence for the blocklist report (required)"
                value={composer.evidence}
                onChange={(e) => onComposerChange({ evidence: e.target.value })}
                placeholder="Evidence (required), e.g. fake recruiter asking for bank details"
                className={clsx(
                  "h-11 min-w-0 flex-1 rounded-xl border-2 px-3 text-[16px] placeholder:text-slate-600 focus-visible:border-slate-900",
                  evidenceMissing ? "border-rose-600" : "border-slate-300",
                  focusRing
                )}
              />
            ) : null}
          </div>
        ) : null}

        {composer.recorded ? (
          <p className="mt-2 text-[15px] font-medium text-slate-700">
            Decision already saved ({composer.recorded}). Sending again only resends the reply.
          </p>
        ) : null}

        {composer.error ? (
          <p role="alert" className="mt-2 flex items-start gap-2 rounded-xl border-2 border-rose-600 bg-rose-50 px-3 py-2 font-medium text-rose-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>Not sent: {composer.error} Your draft is kept, try again.</span>
          </p>
        ) : null}
      </section>
    </div>
  );
}

export function QueueDetailSkeleton() {
  return (
    <div aria-hidden className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="shrink-0 space-y-3 border-t-2 border-slate-200 p-4 sm:p-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
