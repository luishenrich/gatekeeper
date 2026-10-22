"use client";

import clsx from "clsx";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  HelpCircle,
  Info,
  Send,
  X,
} from "lucide-react";
import type { Ref } from "react";
import {
  Avatar,
  BlocklistBadge,
  BlocklistCallout,
  Button,
  ChannelBadge,
  DecisionPill,
  Kbd,
  ScoreBadge,
  SignalChip,
  Skeleton,
  focusRing,
  type Decision,
} from "@/components/ui";
import {
  buildSignalsFromApi,
  parseRuleNumber,
  ruleText,
} from "@/lib/signals-ui";
import { REPO_URL } from "@/lib/ui/communities";
import { initials, maskPhone, timeAgo } from "@/lib/ui/format";
import {
  channelLabel,
  channelOf,
  isBlocklistHit,
  priorCommunityName,
  recommended,
  type QueueApp,
} from "./model";

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

const DECISION_BUTTONS: {
  decision: Decision;
  key: string;
  label: string;
  Icon: typeof Check;
  solid: string;
  ring: string;
}[] = [
  {
    decision: "accept",
    key: "A",
    label: "Accept",
    Icon: Check,
    solid: "border-emerald-300 bg-emerald-50 text-emerald-900",
    ring: "ring-emerald-300",
  },
  {
    decision: "ask",
    key: "S",
    label: "Ask",
    Icon: HelpCircle,
    solid: "border-orange-300 bg-orange-50 text-orange-900",
    ring: "ring-orange-300",
  },
  {
    decision: "decline",
    key: "D",
    label: "Decline",
    Icon: X,
    solid: "border-rose-300 bg-rose-50 text-rose-900",
    ring: "ring-rose-300",
  },
];

function sendLabel(decision: Decision, channel: string): string {
  if (channel === "web")
    return decision === "ask" ? "No channel to ask" : `Save ${decision}`;
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
    s.key === "blocklist_hit" && hit
      ? { ...s, evidence: `hit in ${priorCommunityName(app)}` }
      : s,
  );
  const isWeb = channel === "web";
  const askBlocked = isWeb && composer.decision === "ask";
  const evidenceMissing =
    composer.decision === "decline" &&
    composer.report &&
    !composer.evidence.trim();
  const textMissing = !isWeb && !composer.text.trim();
  const canSend = !askBlocked && !evidenceMissing && !textMissing;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        <article
          key={app.id}
          aria-label={`Application from ${app.name || app.handle || "applicant"}`}
          className="mx-auto max-w-3xl space-y-8"
        >
          {/* Header */}
          <header className="flex items-start gap-4">
            <Avatar label={initials(app.name, app.handle)} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-4xl leading-tight tracking-tight text-foreground">
                {app.name || app.handle || "Unnamed applicant"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
                {app.handle ? (
                  <span className="text-[15px] font-medium text-foreground/80">
                    {app.handle}
                  </span>
                ) : null}
                <ChannelBadge channel={app.channel} />
                {hit ? <BlocklistBadge /> : null}
                {app.auto_sent ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[12px] font-medium text-sky-900">
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Auto-sent
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-[15px] text-muted-foreground">
                Applied to {app.community_name || "this community"}
                {app.created_at ? <> · {timeAgo(app.created_at)}</> : null}
                {app.phone && !hit ? <> · {maskPhone(app.phone)}</> : null}
              </p>
            </div>
          </header>

          {/* Recommendation */}
          <section
            aria-label="Greenlight recommendation"
            className="rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Greenlight recommends
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
              <DecisionPill decision={rec} size="md" />
              <ScoreBadge score={app.score} size="xl" />
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-foreground">
              {app.reason || "No reason recorded."}
            </p>
            <blockquote className="mt-4 rounded-2xl bg-muted/60 p-4 text-[14px] leading-relaxed text-muted-foreground">
              <a
                href={RULES_URL}
                target="_blank"
                rel="noreferrer"
                className={clsx(
                  "mr-2 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent",
                  focusRing,
                )}
              >
                Rule {ruleNo}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
              {ruleText(ruleNo)}
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
            <h3
              id="signals-h"
              className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            >
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
            <h3
              id="text-h"
              className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Application
            </h3>
            <p className="whitespace-pre-wrap rounded-2xl border border-border bg-card p-6 text-[16px] leading-relaxed text-foreground shadow-sm">
              {app.text || "No application text."}
            </p>
          </section>
        </article>
      </div>

      {/* Composer — pinned at the bottom of the detail pane */}
      <section
        aria-label="Reply and decision"
        className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Your decision"
          >
            {DECISION_BUTTONS.map(
              ({ decision, key, label, Icon, solid, ring }) => {
                const active = composer.decision === decision;
                return (
                  <button
                    key={decision}
                    type="button"
                    aria-pressed={active}
                    aria-keyshortcuts={key}
                    onClick={() => onChoose(decision)}
                    className={clsx(
                      "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors duration-150 ease-out",
                      focusRing,
                      active
                        ? clsx(solid, "ring-1", ring)
                        : "border-border bg-card text-foreground/80 hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden strokeWidth={2.5} />
                    {label}
                    <Kbd className="hidden 2xl:inline-flex">{key}</Kbd>
                  </button>
                );
              },
            )}
          </div>
          {askBlocked ? null : (
            <Button
              className="h-10 w-full rounded-full sm:ml-auto sm:w-auto"
              variant="primary"
              onClick={onSend}
              disabled={!canSend}
              icon={<Send className="h-4 w-4" aria-hidden />}
            >
              {sendLabel(composer.decision, channel)}
              <Kbd className="ml-1 hidden border-background/20 bg-background/10 text-background/80 shadow-none lg:inline-flex">
                ⏎
              </Kbd>
            </Button>
          )}
        </div>

        {isWeb ? (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-[14px] text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {askBlocked
              ? "Web applications have no outbound channel, so a question can't be sent from here. Accept or decline instead."
              : "Web application: no outbound channel. Greenlight saves your decision but can't message the applicant."}
          </p>
        ) : (
          <div className="mt-3">
            <label
              htmlFor="gk-reply"
              className="flex items-baseline justify-between gap-3 text-[14px] font-medium text-foreground"
            >
              <span>
                Reply to {app.handle || "applicant"} via {channelLabel(channel)}
              </span>
              <span className="hidden items-center gap-1 text-[12px] font-normal text-muted-foreground lg:inline-flex">
                <Kbd>E</Kbd> edit · <Kbd>⌘</Kbd>
                <Kbd>⏎</Kbd> send
              </span>
            </label>
            <textarea
              id="gk-reply"
              ref={textareaRef}
              value={composer.text}
              onChange={(e) =>
                onComposerChange({ text: e.target.value, error: null })
              }
              placeholder="Write a reply…"
              rows={2}
              className={clsx(
                "mt-2 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-foreground/40",
                focusRing,
              )}
            />
          </div>
        )}

        {composer.decision === "decline" && !hit && !composer.recorded ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="inline-flex items-center gap-2 text-[14px] font-medium text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-rose-600"
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
                  "h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-[14px] placeholder:text-muted-foreground focus-visible:border-foreground/40",
                  evidenceMissing ? "border-rose-400" : "border-border",
                  focusRing,
                )}
              />
            ) : null}
          </div>
        ) : null}

        {composer.recorded ? (
          <p className="mt-2 text-[14px] text-muted-foreground">
            Decision already saved ({composer.recorded}). Sending again only
            resends the reply.
          </p>
        ) : null}

        {composer.error ? (
          <p
            role="alert"
            className="mt-2 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-[14px] font-medium text-rose-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Not sent: {composer.error} Your draft is kept, try again.
            </span>
          </p>
        ) : null}
      </section>
    </div>
  );
}

export function QueueDetailSkeleton() {
  return (
    <div aria-hidden className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="shrink-0 space-y-3 border-t border-border bg-card p-4 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-2/3 rounded-full" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
