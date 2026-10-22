import type { ReactNode } from "react";
import { DecisionPill, SignalChip, decisionSoftClass } from "@/components/decision-ui";
import { buildSignalsFromApi, isDecision } from "@/lib/signals-ui";
import type { DemoStep } from "./types";

const EMPTY: { n: number; label: string }[] = [
  { n: 1, label: "Payload sent" },
  { n: 2, label: "Signature check" },
  { n: 3, label: "Blocklist check" },
  { n: 4, label: "Scorer" },
  { n: 5, label: "Human in the loop" },
];

function StepShell({
  n,
  label,
  done,
  children,
}: {
  n: number;
  label: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span
        className={`mt-5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg font-black ${
          done ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
        }`}
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border-2 border-slate-200 bg-white p-6">
        <h3 className="text-2xl font-bold text-slate-900">{label}</h3>
        <div className="mt-4 text-lg leading-relaxed text-slate-800">{children}</div>
      </div>
    </li>
  );
}

function PayloadStep({ step }: { step?: DemoStep }) {
  if (!step?.payload) return <p className="text-slate-600">Waiting for a send.</p>;
  return (
    <pre className="max-h-80 overflow-auto rounded-xl bg-slate-900 p-4 text-base leading-relaxed text-white">
      {JSON.stringify(step.payload, null, 2)}
    </pre>
  );
}

function SignatureStep({ step }: { step?: DemoStep }) {
  if (!step || step.http_status === undefined) return <p className="text-slate-600">Waiting for a send.</p>;
  const verified = step.signature_verified === true;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-lg border-2 border-slate-300 px-3 py-1 font-bold tabular-nums">
        HTTP {step.http_status}
      </span>
      <span
        className={`rounded-lg px-3 py-1 font-bold ${
          verified ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        }`}
      >
        Signature {verified ? "verified" : "not verified"}
      </span>
    </div>
  );
}

function BlocklistStep({ step }: { step?: DemoStep }) {
  if (!step || step.matched === undefined) return <p className="text-slate-600">Waiting for a send.</p>;
  return (
    <div
      className={
        step.matched
          ? "rounded-xl border-2 border-rose-600 bg-rose-50 p-5"
          : "rounded-xl border-2 border-slate-300 bg-slate-50 p-5"
      }
    >
      <p className="text-xl font-bold">
        {step.matched ? "Matched the shared blocklist" : "No blocklist match"}
      </p>
      {step.hash_prefix && (
        <p className="mt-2 font-mono text-lg">Hash prefix {step.hash_prefix}</p>
      )}
      {step.matched_on && step.matched_on.length > 0 && (
        <p className="mt-2">Matched on {step.matched_on.join(", ")}</p>
      )}
      {step.prior_community_name && (
        <p className="mt-2 font-semibold">Seen in {step.prior_community_name}</p>
      )}
    </div>
  );
}

function ScorerStep({ step }: { step?: DemoStep }) {
  if (!step?.decision) return <p className="text-slate-600">Waiting for a send.</p>;
  const decision = isDecision(step.decision) ? step.decision : null;
  const signals = buildSignalsFromApi(step.signals);
  return (
    <div
      className={`rounded-2xl border-2 p-6 ${
        decision ? decisionSoftClass(decision) : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-end gap-6">
        {decision ? <DecisionPill decision={decision} size="xl" /> : <span className="text-3xl font-extrabold uppercase">{step.decision}</span>}
        <p className="text-6xl font-black tabular-nums">
          {step.score ?? "–"}
          <span className="text-2xl font-bold text-slate-600">/100</span>
        </p>
      </div>
      {step.reason && <p className="mt-5 text-xl">{step.reason}</p>}
      {step.rule_refs && step.rule_refs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {step.rule_refs.map((ref) => (
            <li key={ref} className="border-l-4 border-slate-900 pl-4 italic">
              {ref}
            </li>
          ))}
        </ul>
      )}
      {signals.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {signals.map((signal) => (
            <SignalChip key={signal.key} signal={signal} size="lg" />
          ))}
        </div>
      )}
    </div>
  );
}

function HumanStep({ step }: { step?: DemoStep }) {
  if (!step || step.auto_mode === undefined) return <p className="text-slate-600">Waiting for a send.</p>;
  const waiting = step.outcome === "held for lead" || step.decision === "decline";
  return (
    <div className="space-y-3">
      <p className="text-xl font-semibold">
        Auto mode is {step.auto_mode ? "on" : "off"} for this community.
      </p>
      {step.auto_sent ? (
        <p className="text-xl font-bold text-emerald-800">Reply auto-sent.</p>
      ) : (
        waiting && <p className="text-2xl font-black text-slate-900">Waiting for lead</p>
      )}
      {waiting && (
        <a
          href={step.queue_path || "/queue"}
          className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-lg font-bold text-white"
        >
          Open the queue
        </a>
      )}
    </div>
  );
}

export function Timeline({ steps }: { steps: DemoStep[] | null }) {
  const byN = new Map((steps || []).map((step) => [step.n, step]));
  return (
    <ol className="space-y-6" aria-live="polite">
      {EMPTY.map((item) => {
        const step = byN.get(item.n);
        const done = Boolean(step);
        return (
          <StepShell key={item.n} n={item.n} label={step?.label || item.label} done={done}>
            {item.n === 1 && <PayloadStep step={step} />}
            {item.n === 2 && <SignatureStep step={step} />}
            {item.n === 3 && <BlocklistStep step={step} />}
            {item.n === 4 && <ScorerStep step={step} />}
            {item.n === 5 && <HumanStep step={step} />}
          </StepShell>
        );
      })}
    </ol>
  );
}
