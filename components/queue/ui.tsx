"use client";

import {
  Check,
  CheckCircle2,
  HelpCircle,
  MessageCircleQuestion,
  X,
  XCircle,
} from "lucide-react";
import type { Decision, SignalStatus, UiSignal } from "./types";

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border-2 border-slate-400 bg-white px-2 font-mono text-sm font-bold text-slate-900">
      {children}
    </kbd>
  );
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length === 0
      ? "?"
      : parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  const box = size === "lg" ? "h-16 w-16 text-xl" : "h-11 w-11 text-base";
  return (
    <div
      className={`${box} grid shrink-0 place-items-center rounded-full bg-slate-800 font-bold text-white`}
    >
      {initials}
    </div>
  );
}

export function ChannelBadge({ channel }: { channel?: string | null }) {
  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center rounded-md border border-green-700 bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-900">
        WhatsApp
      </span>
    );
  }
  if (channel === "discord") {
    return (
      <span className="inline-flex items-center rounded-md border border-indigo-700 bg-indigo-100 px-2 py-0.5 text-sm font-semibold text-indigo-900">
        Discord
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border-2 border-slate-500 bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-800">
      Web
    </span>
  );
}

export function BlocklistBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`${pad} rounded-md bg-rose-700 font-bold uppercase tracking-wide text-white`}
    >
      Blocklist
    </span>
  );
}

export function AutoSentBadge() {
  return (
    <span className="inline-flex items-center rounded-md border-2 border-slate-600 bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-800">
      auto-sent
    </span>
  );
}

const decisionMeta: Record<
  Decision,
  { label: string; icon: typeof CheckCircle2; pill: string; soft: string }
> = {
  accept: {
    label: "Accept",
    icon: CheckCircle2,
    pill: "bg-emerald-600 text-white",
    soft: "bg-emerald-50 border-emerald-600",
  },
  ask: {
    label: "Ask",
    icon: MessageCircleQuestion,
    pill: "bg-amber-500 text-slate-950",
    soft: "bg-amber-50 border-amber-500",
  },
  decline: {
    label: "Decline",
    icon: XCircle,
    pill: "bg-rose-600 text-white",
    soft: "bg-rose-50 border-rose-600",
  },
};

export function DecisionPill({
  decision,
  size = "sm",
}: {
  decision: Decision;
  size?: "sm" | "xl";
}) {
  const meta = decisionMeta[decision];
  const Icon = meta.icon;
  if (size === "xl") {
    return (
      <span
        className={`inline-flex items-center gap-3 rounded-xl px-6 py-3 text-3xl font-extrabold uppercase ${meta.pill}`}
      >
        <Icon className="h-8 w-8" aria-hidden />
        {meta.label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-bold uppercase ${meta.pill}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}

export function decisionSoftClass(decision: Decision): string {
  return decisionMeta[decision].soft;
}

export function SignalChip({
  signal,
  size = "sm",
}: {
  signal: UiSignal;
  size?: "sm" | "lg";
}) {
  const styles: Record<SignalStatus, string> = {
    pass: "bg-emerald-50 text-emerald-900 border-emerald-700",
    fail: "bg-rose-50 text-rose-900 border-rose-700",
    unknown: "bg-slate-100 text-slate-800 border-slate-500",
  };
  const Icon =
    signal.status === "pass" ? Check : signal.status === "fail" ? X : HelpCircle;
  if (size === "lg") {
    return (
      <div
        className={`flex gap-3 rounded-xl border-2 p-4 ${styles[signal.status]}`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <div className="font-bold">{signal.label}</div>
          <div className="mt-0.5 text-base leading-snug">{signal.evidence}</div>
        </div>
      </div>
    );
  }
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-md border px-2 py-0.5 text-sm font-semibold ${styles[signal.status]}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {signal.label}
    </span>
  );
}
