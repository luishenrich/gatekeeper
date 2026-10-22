import type { ReactNode } from "react";

export type Decision = "accept" | "ask" | "decline";
export type SignalStatus = "pass" | "fail" | "unknown";

export type UiSignal = {
  key: string;
  label: string;
  status: SignalStatus;
  evidence: string;
};

const pillClass: Record<Decision, string> = {
  accept: "bg-emerald-600 text-white",
  ask: "bg-amber-500 text-slate-950",
  decline: "bg-rose-600 text-white",
};

const softClass: Record<Decision, string> = {
  accept: "bg-emerald-50 border-emerald-600",
  ask: "bg-amber-50 border-amber-500",
  decline: "bg-rose-50 border-rose-600",
};

const chipClass: Record<SignalStatus, string> = {
  pass: "bg-emerald-50 text-emerald-900 border-emerald-700",
  fail: "bg-rose-50 text-rose-900 border-rose-700",
  unknown: "bg-slate-100 text-slate-800 border-slate-500",
};

const statusMark: Record<SignalStatus, string> = {
  pass: "✓",
  fail: "✕",
  unknown: "?",
};

const decisionWord: Record<Decision, string> = {
  accept: "Accept",
  ask: "Ask",
  decline: "Decline",
};

export function decisionSoftClass(d: Decision): string {
  return softClass[d];
}

export function DecisionPill({
  decision,
  size = "sm",
}: {
  decision: Decision;
  size?: "sm" | "xl";
}) {
  const mark =
    decision === "accept" ? "✓" : decision === "ask" ? "?" : "✕";
  if (size === "xl") {
    return (
      <span
        className={`inline-flex items-center gap-3 rounded-xl px-6 py-3 text-3xl font-extrabold uppercase ${pillClass[decision]}`}
      >
        <span aria-hidden>{mark}</span>
        {decisionWord[decision]}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-bold uppercase ${pillClass[decision]}`}
    >
      <span aria-hidden>{mark}</span>
      {decisionWord[decision]}
    </span>
  );
}

export function SignalChip({
  signal,
  size = "sm",
}: {
  signal: UiSignal;
  size?: "sm" | "lg";
}) {
  if (size === "lg") {
    return (
      <div
        className={`flex gap-3 rounded-xl border-2 p-4 ${chipClass[signal.status]}`}
      >
        <span className="text-lg font-bold" aria-hidden>
          {statusMark[signal.status]}
        </span>
        <div className="min-w-0">
          <div className="font-bold">{signal.label}</div>
          <div className="mt-0.5 text-base leading-snug">{signal.evidence}</div>
        </div>
      </div>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm font-semibold ${chipClass[signal.status]}`}
    >
      <span aria-hidden>{statusMark[signal.status]}</span>
      {signal.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "accept" | "ask" | "decline" | "blocklist";
}) {
  const tones: Record<string, string> = {
    neutral: "border-slate-300 bg-white",
    accept: "border-emerald-600 bg-emerald-50",
    ask: "border-amber-500 bg-amber-50",
    decline: "border-rose-600 bg-rose-50",
    blocklist: "border-rose-700 bg-rose-50",
  };
  return (
    <div className={`rounded-2xl border-2 p-5 ${tones[tone]}`}>
      <div className="text-base font-semibold text-slate-600">{label}</div>
      <div className="mt-2 text-4xl font-black tabular-nums text-slate-900">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-base font-semibold text-slate-600">{hint}</div>
      )}
    </div>
  );
}
