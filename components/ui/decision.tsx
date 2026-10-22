import clsx from "clsx";
import { Ban, Check, HelpCircle, MessageCircle, ShieldAlert, X } from "lucide-react";
import type { Decision, SignalStatus, UiSignal } from "@/components/decision-ui";

export type { Decision, SignalStatus, UiSignal };

export function asDecision(value: string | null | undefined): Decision | null {
  return value === "accept" || value === "ask" || value === "decline" ? value : null;
}

export const DECISION_WORD: Record<Decision, string> = { accept: "Accept", ask: "Ask", decline: "Decline" };
export const DECISION_SOLID: Record<Decision, string> = {
  accept: "bg-green-600 text-white",
  ask: "bg-orange-500 text-white",
  decline: "bg-red-600 text-white",
};
export const DECISION_SOFT: Record<Decision, string> = {
  accept: "bg-green-50/70 border-green-200",
  ask: "bg-orange-50/70 border-orange-200",
  decline: "bg-red-50/70 border-red-200",
};
const DECISION_ICON = { accept: Check, ask: HelpCircle, decline: X } as const;

export function DecisionPill({ decision, size = "sm", className }: { decision: Decision; size?: "sm" | "md" | "xl"; className?: string }) {
  const Icon = DECISION_ICON[decision];
  const sizes = {
    sm: "gap-1 rounded-full px-2.5 py-0.5 text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5",
    md: "gap-2 rounded-full px-4 py-1.5 text-[15px] [&_svg]:h-4 [&_svg]:w-4",
    xl: "gap-2.5 rounded-full px-5 py-2.5 text-2xl [&_svg]:h-6 [&_svg]:w-6",
  };
  return (
    <span className={clsx("inline-flex items-center font-semibold uppercase tracking-wide", DECISION_SOLID[decision], sizes[size], className)}>
      <Icon aria-hidden strokeWidth={3} />
      {DECISION_WORD[decision]}
    </span>
  );
}

export function scoreBand(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Strong", className: "text-green-700" };
  if (score >= 50) return { label: "Mixed", className: "text-orange-700" };
  return { label: "Weak", className: "text-red-700" };
}

const BAND_BAR = { Strong: "bg-green-500", Mixed: "bg-orange-500", Weak: "bg-red-400" } as const;
const BAND_PILL = {
  Strong: "bg-green-50 text-green-800 ring-green-200",
  Mixed: "bg-orange-50 text-orange-800 ring-orange-200",
  Weak: "bg-red-50 text-red-800 ring-red-200",
} as const;

export function ScoreBadge({ score, size = "sm" }: { score: number | null | undefined; size?: "sm" | "xl" }) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return <span className="font-semibold text-muted-foreground">—</span>;
  }
  const band = scoreBand(score);
  if (size === "xl") {
    const label = band.label as keyof typeof BAND_BAR;
    return (
      <div className="w-full min-w-[10rem] max-w-[14rem]" aria-label={`Score ${score} out of 100, ${label.toLowerCase()} fit`}>
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-5xl leading-none tabular-nums text-foreground">{score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <span className={clsx("rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1", BAND_PILL[label])}>{label} fit</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
          <div className={clsx("h-full rounded-full", BAND_BAR[label])} style={{ width: `${Math.max(2, Math.min(100, score))}%` }} />
        </div>
      </div>
    );
  }
  return (
    <span className={clsx("font-semibold tabular-nums", band.className)} aria-label={`Score ${score} out of 100`}>
      {score}
    </span>
  );
}

const CHIP: Record<SignalStatus, { cls: string; Icon: typeof Check; word: string }> = {
  pass: { cls: "bg-green-50/80 text-green-900 border-green-200", Icon: Check, word: "pass" },
  fail: { cls: "bg-red-50/80 text-red-900 border-red-200", Icon: X, word: "fail" },
  unknown: { cls: "bg-muted text-foreground/80 border-border", Icon: HelpCircle, word: "unknown" },
};

export function SignalChip({ signal, size = "sm" }: { signal: UiSignal; size?: "sm" | "lg" }) {
  const { cls, Icon, word } = CHIP[signal.status];
  if (size === "lg") {
    return (
      <div className={clsx("flex gap-3 rounded-2xl border p-4", cls)}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden strokeWidth={3} />
        <div className="min-w-0">
          <div className="font-bold">
            {signal.label}
            <span className="sr-only">: {word}</span>
          </div>
          <div className="mt-0.5 break-words text-[15px] leading-snug">{signal.evidence}</div>
        </div>
      </div>
    );
  }
  return (
    <span title={signal.evidence} className={clsx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium", cls)}>
      <Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
      {signal.label}
      <span className="sr-only">: {word}, {signal.evidence}</span>
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: string | null | undefined }) {
  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[12px] font-medium text-green-900">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        WhatsApp
      </span>
    );
  }
  if (channel === "discord") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[12px] font-medium text-indigo-900">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        Discord
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[12px] font-medium text-foreground/80">Web</span>
  );
}

export function BlocklistBadge({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white", className)}>
      <Ban className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
      Blocklist
    </span>
  );
}

export type BlocklistMatchUi = {
  prior_community_name?: string | null;
  hash_prefix?: string | null;
  matched_on?: string[] | null;
  status?: string | null;
  reported_at?: string | null;
  evidence?: string | null;
};

/** Cross-community blocklist callout. Shows only a hash prefix, never a phone. */
export function BlocklistCallout({ match, className }: { match: BlocklistMatchUi; className?: string }) {
  const where = match.prior_community_name || "a partner community";
  const on = match.matched_on && match.matched_on.length > 0 ? match.matched_on.join(" + ") : "phone";
  return (
    <div role="alert" className={clsx("rounded-2xl border border-red-300 bg-red-50 p-5", className)}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-700" aria-hidden />
        <div className="min-w-0">
          <p className="text-[17px] font-semibold text-red-950">
            Seen in {where}, same {on} hash
          </p>
          <p className="mt-1 text-red-900">
            {match.status === "pending" ? "Reported" : "Confirmed"} on the shared blocklist
            {match.evidence ? <> · {match.evidence}</> : null}
          </p>
          {match.hash_prefix ? (
            <p className="mt-2 font-mono text-[15px] font-semibold text-red-900">{match.hash_prefix}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
