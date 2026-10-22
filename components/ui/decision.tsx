import clsx from "clsx";
import { Ban, Check, HelpCircle, MessageCircle, ShieldAlert, X } from "lucide-react";
import type { Decision, SignalStatus, UiSignal } from "@/components/decision-ui";

export type { Decision, SignalStatus, UiSignal };

export function asDecision(value: string | null | undefined): Decision | null {
  return value === "accept" || value === "ask" || value === "decline" ? value : null;
}

export const DECISION_WORD: Record<Decision, string> = { accept: "Accept", ask: "Ask", decline: "Decline" };
export const DECISION_SOLID: Record<Decision, string> = {
  accept: "bg-emerald-600 text-white",
  ask: "bg-amber-500 text-slate-950",
  decline: "bg-rose-600 text-white",
};
export const DECISION_SOFT: Record<Decision, string> = {
  accept: "bg-emerald-50 border-emerald-600",
  ask: "bg-amber-50 border-amber-500",
  decline: "bg-rose-50 border-rose-600",
};
const DECISION_ICON = { accept: Check, ask: HelpCircle, decline: X } as const;

export function DecisionPill({ decision, size = "sm", className }: { decision: Decision; size?: "sm" | "md" | "xl"; className?: string }) {
  const Icon = DECISION_ICON[decision];
  const sizes = {
    sm: "gap-1 rounded-md px-2 py-0.5 text-[13px] [&_svg]:h-3.5 [&_svg]:w-3.5",
    md: "gap-1.5 rounded-lg px-3 py-1 text-[15px] [&_svg]:h-4 [&_svg]:w-4",
    xl: "gap-3 rounded-xl px-6 py-3 text-3xl [&_svg]:h-8 [&_svg]:w-8",
  };
  return (
    <span className={clsx("inline-flex items-center font-extrabold uppercase tracking-wide", DECISION_SOLID[decision], sizes[size], className)}>
      <Icon aria-hidden strokeWidth={3} />
      {DECISION_WORD[decision]}
    </span>
  );
}

export function scoreBand(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Strong", className: "text-emerald-700" };
  if (score >= 50) return { label: "Mixed", className: "text-amber-700" };
  return { label: "Weak", className: "text-rose-700" };
}

export function ScoreBadge({ score, size = "sm" }: { score: number | null | undefined; size?: "sm" | "xl" }) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return <span className="font-bold text-slate-600">—</span>;
  }
  const band = scoreBand(score);
  if (size === "xl") {
    return (
      <div className="flex items-baseline gap-1" aria-label={`Score ${score} out of 100`}>
        <span className={clsx("text-6xl font-black tabular-nums tracking-tight", band.className)}>{score}</span>
        <span className="text-xl font-bold text-slate-600">/100</span>
      </div>
    );
  }
  return (
    <span className={clsx("font-bold tabular-nums", band.className)} aria-label={`Score ${score} out of 100`}>
      {score}
    </span>
  );
}

const CHIP: Record<SignalStatus, { cls: string; Icon: typeof Check; word: string }> = {
  pass: { cls: "bg-emerald-50 text-emerald-900 border-emerald-700", Icon: Check, word: "pass" },
  fail: { cls: "bg-rose-50 text-rose-900 border-rose-700", Icon: X, word: "fail" },
  unknown: { cls: "bg-slate-100 text-slate-800 border-slate-500", Icon: HelpCircle, word: "unknown" },
};

export function SignalChip({ signal, size = "sm" }: { signal: UiSignal; size?: "sm" | "lg" }) {
  const { cls, Icon, word } = CHIP[signal.status];
  if (size === "lg") {
    return (
      <div className={clsx("flex gap-3 rounded-xl border-2 p-4", cls)}>
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
    <span title={signal.evidence} className={clsx("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[13px] font-semibold", cls)}>
      <Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
      {signal.label}
      <span className="sr-only">: {word}, {signal.evidence}</span>
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: string | null | undefined }) {
  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-green-700 bg-green-100 px-2 py-0.5 text-[13px] font-semibold text-green-900">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        WhatsApp
      </span>
    );
  }
  if (channel === "discord") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-indigo-700 bg-indigo-100 px-2 py-0.5 text-[13px] font-semibold text-indigo-900">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        Discord
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-slate-400 bg-slate-100 px-2 py-0.5 text-[13px] font-semibold text-slate-800">Web</span>
  );
}

export function BlocklistBadge({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-md bg-rose-700 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-white", className)}>
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
    <div role="alert" className={clsx("rounded-xl border-2 border-rose-600 bg-rose-50 p-5", className)}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-rose-700" aria-hidden />
        <div className="min-w-0">
          <p className="text-lg font-bold text-rose-950">
            Seen in {where}, same {on} hash
          </p>
          <p className="mt-1 text-rose-900">
            {match.status === "pending" ? "Reported" : "Confirmed"} on the shared blocklist
            {match.evidence ? <> · {match.evidence}</> : null}
          </p>
          {match.hash_prefix ? (
            <p className="mt-2 font-mono text-[15px] font-semibold text-rose-900">{match.hash_prefix}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
