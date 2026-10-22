"use client";

import clsx from "clsx";
import { RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BlocklistBadge,
  BlocklistCallout,
  ChannelBadge,
  DecisionPill,
  Kbd,
  SignalChip,
  focusRing,
  type Decision,
  type UiSignal,
} from "@/components/ui";

/*
 * Marketing visual for the landing page. Everything in here is fictional demo
 * data (labelled "Demo data" in the UI). It never calls the API.
 *
 * Steps: 0 waiting → 1 application arrives → 2 signals → 3 blocklist hit +
 * decline → 4 cross-community callout → 5 waiting for the lead.
 */
const FINAL_STEP = 5;
const TIMELINE_MS = [700, 1500, 2500, 3300, 4300];

const SIGNALS: UiSignal[] = [
  {
    key: "spam",
    label: "Spam text",
    status: "fail",
    evidence: "Matched: presale, 10x guaranteed, whitelist spot",
  },
  {
    key: "rules",
    label: "Rules fit",
    status: "fail",
    evidence: "No building or demo mentioned (rule 1)",
  },
  {
    key: "github",
    label: "GitHub",
    status: "unknown",
    evidence: "No GitHub account given",
  },
  {
    key: "blocklist",
    label: "Shared blocklist",
    status: "fail",
    evidence: "Phone hash matches a confirmed entry",
  },
];

const EARLIER: {
  name: string;
  handle: string;
  channel: "discord" | "whatsapp";
  decision: Decision;
  score: number;
}[] = [
  {
    name: "Jonah Stubbs",
    handle: "@jonah_s",
    channel: "discord",
    decision: "accept",
    score: 88,
  },
  {
    name: "Sami Lowinfo",
    handle: "@sami_lo",
    channel: "whatsapp",
    decision: "ask",
    score: 61,
  },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Fades + lifts in once `on` is true. Always rendered so the card never changes height. */
function Reveal({
  on,
  children,
  className,
}: {
  on: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "transition duration-200 ease-out motion-reduce:transition-none",
        on ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function HeroQueueDemo() {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    clear();
    if (reduced) {
      setStep(FINAL_STEP);
      return;
    }
    setStep(0);
    timers.current = TIMELINE_MS.map((ms, i) =>
      window.setTimeout(() => setStep(i + 1), ms),
    );
    return clear;
  }, [reduced, run]);

  const replay = useCallback(() => setRun((r) => r + 1), []);

  const arrived = step >= 1;
  const decided = step >= 3;

  return (
    <div className="relative">
      <figure className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] backdrop-blur">
        <figcaption className="sr-only">
          Demo data, fictional applicant. In the review queue for South London
          Hack Nights, a WhatsApp application from @cryptomax_alpha1 arrives,
          matches the shared blocklist and is suggested for decline. The callout
          reads: Seen in London Agent Builders, same phone hash, hmac:3f9a…. The
          decline is not sent until a lead presses D.
        </figcaption>

        <div aria-hidden>
          {/* Window bar */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-background/70 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
              </span>
              <span className="ml-2 truncate text-[14px] text-foreground/80">
                Review queue · South London Hack Nights
              </span>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Demo data
            </span>
          </div>

          {/* Queue list */}
          <ul className="divide-y divide-border/70">
            <li
              className={clsx(
                "relative border-l-4 transition-colors duration-200 ease-out motion-reduce:transition-none",
                decided
                  ? "border-l-rose-400 bg-rose-50/60"
                  : arrived
                    ? "border-l-border bg-muted/60"
                    : "border-l-transparent",
              )}
            >
              {/* Placeholder while waiting (unmounted once it has faded out) */}
              {step < 2 ? (
                <div
                  className={clsx(
                    "absolute inset-0 flex items-center gap-2 px-4 text-[15px] text-muted-foreground transition-opacity duration-200 motion-reduce:transition-none",
                    arrived ? "opacity-0" : "opacity-100",
                  )}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  </span>
                  Listening for new applications…
                </div>
              ) : null}

              <Reveal
                on={arrived}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[15px] text-foreground">
                      @cryptomax_alpha1
                    </span>
                    <span
                      className={clsx(
                        "transition-opacity duration-200 motion-reduce:transition-none",
                        decided ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <BlocklistBadge />
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-2 text-[14px] text-muted-foreground">
                    <ChannelBadge channel="whatsapp" />
                    <span className="truncate">Max Moonshot · just now</span>
                  </div>
                </div>
                <div className="relative grid h-8 w-[7.5rem] shrink-0 place-items-end">
                  <span
                    className={clsx(
                      "absolute right-0 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground transition-opacity duration-200 motion-reduce:transition-none",
                      decided ? "opacity-0" : "opacity-100",
                    )}
                  >
                    Scoring…
                  </span>
                  <span
                    className={clsx(
                      "absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2 transition duration-200 ease-out motion-reduce:transition-none",
                      decided ? "scale-100 opacity-100" : "scale-95 opacity-0",
                    )}
                  >
                    <span className="font-display text-xl tabular-nums text-rose-700">
                      4
                    </span>
                    <DecisionPill decision="decline" />
                  </span>
                </div>
              </Reveal>
            </li>

            {EARLIER.map((a) => (
              <li
                key={a.handle}
                className="flex items-center justify-between gap-3 border-l-4 border-l-transparent px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[15px] text-foreground/85">
                    {a.handle}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[14px] text-muted-foreground">
                    <ChannelBadge channel={a.channel} />
                    <span className="truncate">{a.name}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={clsx(
                      "font-display text-xl tabular-nums",
                      a.decision === "accept"
                        ? "text-emerald-700"
                        : "text-orange-700",
                    )}
                  >
                    {a.score}
                  </span>
                  <DecisionPill decision={a.decision} />
                </div>
              </li>
            ))}
          </ul>

          {/* Detail for the new arrival */}
          <div className="space-y-4 border-t border-border bg-background/60 p-4">
            <Reveal on={step >= 2}>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Signals
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SIGNALS.map((s) => (
                  <SignalChip key={s.key} signal={s} />
                ))}
              </div>
            </Reveal>

            <Reveal on={step >= 4}>
              <BlocklistCallout
                className="!p-4"
                match={{
                  prior_community_name: "London Agent Builders",
                  matched_on: ["phone"],
                  hash_prefix: "hmac:3f9a…",
                  status: "confirmed",
                }}
              />
            </Reveal>

            <Reveal
              on={step >= 5}
              className="flex flex-wrap items-center justify-between gap-2 text-[15px] text-foreground/80"
            >
              <span className="font-medium text-foreground">Waiting for a lead</span>
              <span className="flex items-center gap-1.5">
                Press <Kbd>D</Kbd> to send the decline
              </span>
            </Reveal>
          </div>
        </div>
      </figure>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-full bg-card/85 px-4 py-1.5 text-[13px] text-muted-foreground backdrop-blur">
        <span>
          Fictional applicant. No real phone number is shown or stored.
        </span>
        <button
          type="button"
          onClick={replay}
          disabled={reduced}
          className={clsx(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground disabled:hidden",
            focusRing,
          )}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Replay
        </button>
      </div>
    </div>
  );
}
