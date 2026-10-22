import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Check, Clock, Loader2, RotateCcw, ShieldCheck, ShieldX, X } from "lucide-react";
import { BlocklistBadge, Button, DecisionPill, ScoreBadge, asDecision } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DemoStatus, DemoStep } from "./types";

const STEPS: { n: number; label: string; idle: string }[] = [
  { n: 1, label: "Request sent", idle: "The WhatsApp-shaped payload Greenlight receives." },
  { n: 2, label: "Webhook signature verified", idle: "The request is signed and checked before anything runs." },
  { n: 3, label: "Shared blocklist check", idle: "Only a hash prefix is compared, never the number." },
  { n: 4, label: "Classification", idle: "Decision, score and the rules it cites." },
  { n: 5, label: "Human in the loop", idle: "A lead stays in charge of anything that is not clear." },
];

type StepState = "idle" | "loading" | "done" | "failed";

function Marker({ n, state, tone }: { n: number; state: StepState; tone?: "red" | "green" | "orange" }) {
  return (
    <span
      className={cn(
        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[13px] font-medium tabular-nums transition-colors duration-200",
        state === "idle" && "border-border bg-card text-muted-foreground",
        state === "loading" && "border-foreground/30 bg-card text-foreground",
        state === "failed" && "border-red-600 bg-red-600 text-white",
        state === "done" && !tone && "border-foreground bg-foreground text-background",
        state === "done" && tone === "red" && "border-red-600 bg-red-600 text-white",
        state === "done" && tone === "green" && "border-green-600 bg-green-600 text-white",
        state === "done" && tone === "orange" && "border-orange-500 bg-orange-500 text-white"
      )}
      aria-hidden
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
      ) : state === "failed" ? (
        <X className="h-4 w-4" strokeWidth={3} />
      ) : state === "done" ? (
        <Check className="h-4 w-4" strokeWidth={3} />
      ) : (
        n
      )}
    </span>
  );
}

function Row({
  n,
  label,
  state,
  tone,
  last,
  children,
}: {
  n: number;
  label: string;
  state: StepState;
  tone?: "red" | "green" | "orange";
  last: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last && <span className="absolute left-4 top-8 h-[calc(100%-2rem)] w-px bg-border" aria-hidden />}
      <Marker n={n} state={state} tone={tone} />
      <div className="min-w-0 flex-1 pt-1">
        <h3 className={cn("text-[15px] font-medium", state === "idle" ? "text-muted-foreground" : "text-foreground")}>
          {label}
          <span className="sr-only">
            {state === "done" ? " (done)" : state === "loading" ? " (in progress)" : state === "failed" ? " (failed)" : ""}
          </span>
        </h3>
        <div
          key={state}
          className={cn(
            "mt-1.5 text-[14px] leading-relaxed",
            state === "done" &&
              "duration-200 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
          )}
        >
          {children}
        </div>
      </div>
    </li>
  );
}

function Placeholder({ text }: { text: string }) {
  return <p className="text-muted-foreground/80">{text}</p>;
}

function LoadingLines() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
    </div>
  );
}

function PayloadBody({ step }: { step: DemoStep }) {
  if (!step.payload) return <p className="text-muted-foreground">No payload returned.</p>;
  return (
    <pre className="max-h-36 overflow-auto rounded-xl border border-border bg-muted/50 p-3 font-mono text-[11.5px] leading-snug text-foreground">
      {JSON.stringify(step.payload, null, 2)}
    </pre>
  );
}

function SignatureBody({ step }: { step: DemoStep }) {
  const verified = step.signature_verified === true;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1",
          verified ? "bg-green-50 text-green-800 ring-green-200" : "bg-red-50 text-red-800 ring-red-200"
        )}
      >
        {verified ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> : <ShieldX className="h-3.5 w-3.5" aria-hidden />}
        {verified ? "Signature verified" : "Signature not verified"}
      </span>
      {typeof step.http_status === "number" && (
        <span className="font-mono text-[12px] text-muted-foreground">
          {step.http_status === 0 ? "No HTTP response" : `HTTP ${step.http_status}`}
        </span>
      )}
    </div>
  );
}

function BlocklistBody({ step }: { step: DemoStep }) {
  if (step.matched) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <BlocklistBadge />
          <span className="font-medium text-red-900">
            {step.prior_community_name ? `Seen in ${step.prior_community_name}` : "Matched the shared blocklist"}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] text-red-900/80">
          {step.hash_prefix && (
            <>
              Hash prefix <span className="font-mono">{step.hash_prefix}</span>
            </>
          )}
          {step.matched_on && step.matched_on.length > 0 && <> · matched on {step.matched_on.join(", ")}</>}
        </p>
      </div>
    );
  }
  return (
    <p className="text-muted-foreground">
      No match
      {step.hash_prefix && (
        <>
          {" "}
          for hash prefix <span className="font-mono text-foreground">{step.hash_prefix}</span>
        </>
      )}
      .
    </p>
  );
}

function ClassificationBody({ step }: { step: DemoStep }) {
  const decision = asDecision(step.decision);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {decision ? (
          <DecisionPill decision={decision} size="md" />
        ) : (
          <span className="text-[15px] font-medium uppercase">{step.decision}</span>
        )}
        <ScoreBadge score={step.score} size="xl" />
      </div>
      {step.reason && <p className="text-foreground">{step.reason}</p>}
      {step.rule_refs && step.rule_refs.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Cited rules">
          {step.rule_refs.map((ref) => (
            <li
              key={ref}
              className="max-w-full truncate rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] text-foreground/80"
              title={ref}
            >
              {ref}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function humanTone(step: DemoStep, blocklisted: boolean): "green" | "orange" {
  const decision = asDecision(step.decision);
  if (decision === "decline" || blocklisted || !step.auto_sent) return "orange";
  return "green";
}

function HumanBody({ step, decision, blocklisted, communitySlug }: { step: DemoStep; decision: string | undefined; blocklisted: boolean; communitySlug: string }) {
  const queueHref = `/queue?community=${encodeURIComponent(communitySlug)}`;
  const waiting = decision === "decline" || blocklisted;
  return (
    <div className="space-y-2">
      {waiting ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] font-medium text-orange-800 ring-1 ring-orange-200">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Waiting for a lead
          </span>
          <Link
            href={queueHref}
            className="inline-flex h-8 items-center rounded-full bg-foreground px-3.5 text-[14px] font-medium text-background transition-colors hover:bg-foreground/85"
          >
            Open in queue
          </Link>
        </div>
      ) : step.auto_sent ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[12px] font-medium text-green-800 ring-1 ring-green-200">
          <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
          Auto-sent
        </span>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] font-medium text-orange-800 ring-1 ring-orange-200">
            Draft ready
          </span>
          <Link href={queueHref} className="text-[14px] font-medium text-foreground underline underline-offset-4">
            Open in queue
          </Link>
        </div>
      )}
      {typeof step.auto_mode === "boolean" && (
        <p className="text-[13px] text-muted-foreground">Auto mode is {step.auto_mode ? "on" : "off"} for this community.</p>
      )}
    </div>
  );
}

export function Timeline({
  steps,
  revealed,
  status,
  error,
  rateLimited,
  communitySlug,
  onRetry,
}: {
  steps: DemoStep[];
  revealed: number;
  status: DemoStatus;
  error: string | null;
  rateLimited: boolean;
  communitySlug: string;
  onRetry: () => void;
}) {
  const visible = steps.slice(0, revealed);
  const byN = new Map(visible.map((step) => [step.n, step]));
  const stillRevealing = revealed < steps.length;
  // The step the pipeline is on right now: during the request it is step 1; while
  // revealing it is the next returned step.
  const currentN =
    status === "loading" ? 1 : stillRevealing ? steps[revealed]?.n ?? null : null;
  const failedN =
    status === "error" && !stillRevealing && steps.length < STEPS.length ? (steps[steps.length - 1]?.n ?? 0) + 1 : null;

  const blocklisted = byN.get(3)?.matched === true;
  const decision = byN.get(4)?.decision;

  return (
    <div>
      <ol aria-live="polite">
        {STEPS.map((item, index) => {
          const step = byN.get(item.n);
          const state: StepState = step
            ? "done"
            : item.n === currentN
              ? "loading"
              : item.n === failedN
                ? "failed"
                : "idle";
          let tone: "red" | "green" | "orange" | undefined;
          if (step && item.n === 3) tone = step.matched ? "red" : undefined;
          if (step && item.n === 2 && step.signature_verified === false) tone = "red";
          if (step && item.n === 5) tone = humanTone({ ...step, decision }, blocklisted);
          return (
            <Row key={item.n} n={item.n} label={item.label} state={state} tone={tone} last={index === STEPS.length - 1}>
              {step ? (
                <>
                  {item.n === 1 && <PayloadBody step={step} />}
                  {item.n === 2 && <SignatureBody step={step} />}
                  {item.n === 3 && <BlocklistBody step={step} />}
                  {item.n === 4 && <ClassificationBody step={step} />}
                  {item.n === 5 && (
                    <HumanBody step={step} decision={decision} blocklisted={blocklisted} communitySlug={communitySlug} />
                  )}
                </>
              ) : state === "loading" ? (
                <LoadingLines />
              ) : state === "failed" ? (
                <p className="text-red-800">Stopped here.</p>
              ) : (
                <Placeholder text={item.idle} />
              )}
            </Row>
          );
        })}
      </ol>

      {status === "error" && !stillRevealing && error && (
        <div
          role="alert"
          className={cn(
            "mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 duration-200 animate-in fade-in motion-reduce:animate-none",
            rateLimited ? "border-orange-200 bg-orange-50/70 text-orange-900" : "border-red-200 bg-red-50/70 text-red-900"
          )}
        >
          <p className="flex items-center gap-2 text-[14px] font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {rateLimited ? "Too many demo runs, wait a minute." : error}
          </p>
          <Button variant="secondary" size="sm" onClick={onRetry} icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
