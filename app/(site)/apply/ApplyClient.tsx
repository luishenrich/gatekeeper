"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Eye, FlaskConical, Loader2, MessageSquareText, RotateCcw, Send, ShieldCheck, Sparkles, Skull } from "lucide-react";
import {
  BlocklistCallout,
  Button,
  Card,
  DECISION_SOFT,
  DecisionPill,
  ErrorState,
  Input,
  ScoreBadge,
  Select,
  SignalChip,
  Skeleton,
  Textarea,
  asDecision,
  focusRing,
  type BlocklistMatchUi,
  type Decision,
} from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/ui/useApi";
import { COMMUNITIES, DEFAULT_COMMUNITY, communityName } from "@/lib/ui/communities";
import { buildSignalsFromApi, parseRuleNumber, ruleText } from "@/lib/signals-ui";
import applicantFixtures from "@/fixtures/applicants.json";

/* ---------- Types ---------- */

type FormState = {
  community_slug: string;
  name: string;
  handle: string;
  phone: string;
  email: string;
  github: string;
  text: string;
};

type FieldKey = keyof FormState;
type FieldErrors = Partial<Record<FieldKey, string>>;

type ScoreResponse = {
  application_id?: string;
  decision?: string;
  score?: number;
  reason?: string;
  signals?: Record<string, unknown> | null;
  blocklist_match?: BlocklistMatchUi | null;
};

type ScoreResult = {
  application_id: string | null;
  decision: Decision;
  score: number;
  reason: string;
  signals: Record<string, unknown>;
  blocklist_match: BlocklistMatchUi | null;
  github: string | null;
  community_slug: string;
};

type Fixture = {
  id: string;
  name: string;
  handle: string;
  phone: string;
  email: string;
  github?: string;
  text: string;
};

/* ---------- Constants ---------- */

const TEXT_MIN = 30;
const TEXT_MAX = 1000;
const MIN_LOADING_MS = 2200;
const STAGE_MS = 1500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIRST_STAGE = "Checking your application against the community rules…";
const CYCLE_STAGES = ["Checking spam signals…", "Looking up GitHub…", "Checking shared blocklist…"];

const fixtures = applicantFixtures as Fixture[];
const fixtureById = (id: string) => fixtures.find((f) => f.id === id) ?? null;

/** A22: the A21 crypto scammer re-applying to a second community as @cryptomax_alpha1. */
const SCAMMER = fixtureById("A22");
/** A01: strong builder applicant. */
const STRONG = fixtureById("A01");

const emptyForm: FormState = {
  community_slug: DEFAULT_COMMUNITY,
  name: "",
  handle: "",
  phone: "",
  email: "",
  github: "",
  text: "",
};

function formFromFixture(f: Fixture, community_slug: string): FormState {
  return {
    community_slug,
    name: f.name,
    handle: f.handle,
    phone: f.phone,
    email: f.email,
    github: f.github ?? "",
    text: f.text,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (form.name.trim().length < 2) errors.name = "Tell us your name.";
  const text = form.text.trim();
  if (!text) errors.text = "Tell the community why you want to join.";
  else if (text.length < TEXT_MIN) errors.text = `A little more, please — at least ${TEXT_MIN} characters.`;
  else if (form.text.length > TEXT_MAX) errors.text = `Keep it under ${TEXT_MAX} characters.`;
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errors.email = "That email doesn't look right.";
  if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 7) errors.phone = "That phone number looks too short.";
  if (form.github.trim() && /\s/.test(form.github.trim())) errors.github = "GitHub usernames have no spaces.";
  return errors;
}

/** Applicant-facing copy. Never includes the internal reason. */
function applicantMessage(decision: Decision, community: string): { title: string; body: string } {
  if (decision === "accept") {
    return {
      title: "Thanks — your application is in.",
      body: `It looks like a great fit for ${community}. You'll hear from the organisers shortly.`,
    };
  }
  return {
    title: "Thanks — a moderator will review your application.",
    body: `${community} is run by volunteers. You'll hear back once someone has had a look.`,
  };
}

/* ---------- Component ---------- */

export default function ApplyClient({ useMocks }: { useMocks: boolean }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const inFlight = useRef(false);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function setField<K extends FieldKey>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function prefill(f: Fixture | null, community_slug: string) {
    if (!f || pending) return;
    setForm(formFromFixture(f, community_slug));
    setErrors({});
    setResult(null);
    setError(null);
  }

  function reset() {
    setForm(emptyForm);
    setErrors({});
    setResult(null);
    setError(null);
    requestAnimationFrame(() => fieldRefs.current.name?.focus());
  }

  async function submit() {
    if (inFlight.current) return;
    const found = validate(form);
    setErrors(found);
    const firstBad = (Object.keys(found) as FieldKey[]).find((k) => found[k]);
    if (firstBad) {
      fieldRefs.current[firstBad]?.focus();
      return;
    }

    inFlight.current = true;
    setPending(true);
    setError(null);
    setResult(null);
    const submitted = { ...form };
    const started = Date.now();
    try {
      const prefix = useMocks ? "/api/mock" : "/api";
      const data = await apiFetch<ScoreResponse>(`${prefix}/score`, {
        method: "POST",
        redirectOn401: false,
        timeoutMs: 30_000,
        body: JSON.stringify({
          community_slug: submitted.community_slug,
          application: {
            name: submitted.name.trim(),
            handle: submitted.handle.trim(),
            phone: submitted.phone.trim(),
            email: submitted.email.trim(),
            github: submitted.github.trim() || null,
            text: submitted.text.trim(),
          },
        }),
      });
      const decision = asDecision(data?.decision);
      if (!data || !decision) {
        throw new ApiError("http", "The scorer returned an unexpected answer.", 500, JSON.stringify(data).slice(0, 500));
      }
      const wait = MIN_LOADING_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setResult({
        application_id: data.application_id ?? null,
        decision,
        score: Number(data.score ?? 0),
        reason: String(data.reason ?? ""),
        signals: data.signals ?? {},
        blocklist_match: data.blocklist_match ?? null,
        github: submitted.github.trim() || null,
        community_slug: submitted.community_slug,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("network", "Couldn't reach the server. Check your connection."));
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  const textLen = form.text.length;
  const locked = pending;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="pb-8">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-slate-600">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Public application · no account needed
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Apply to join</h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-600">
          Tell the community who you are and what you&apos;re building. Every application is checked against the
          community&apos;s rules before a human lead decides.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        {/* ---------- Form ---------- */}
        <section aria-labelledby="apply-form-title">
          <h2 id="apply-form-title" className="sr-only">
            Application form
          </h2>

          <div className="mb-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-700">
              <FlaskConical className="h-4 w-4" aria-hidden />
              Demo helper
            </div>
            <p className="mt-1 text-[15px] text-slate-600">Prefill the form with a fictional test applicant.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={locked || !SCAMMER}
                onClick={() => prefill(SCAMMER, "south-london-hack-nights")}
                icon={<Skull className="h-4 w-4 text-rose-700" aria-hidden />}
                className="border-rose-300 hover:border-rose-500 hover:bg-rose-50"
              >
                Try a known scammer
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={locked || !STRONG}
                onClick={() => prefill(STRONG, "london-agent-builders")}
                icon={<Sparkles className="h-4 w-4 text-emerald-700" aria-hidden />}
                className="border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50"
              >
                Try a strong applicant
              </Button>
            </div>
          </div>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="space-y-5"
          >
            <fieldset disabled={locked} className="space-y-5 disabled:opacity-80">
              <Select
                label="Community"
                required
                value={form.community_slug}
                onChange={(e) => setField("community_slug", e.target.value)}
              >
                {COMMUNITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  ref={(el) => {
                    fieldRefs.current.name = el;
                  }}
                  label="Name"
                  required
                  autoComplete="name"
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
                <Input
                  ref={(el) => {
                    fieldRefs.current.handle = el;
                  }}
                  label="Handle"
                  placeholder="@yourhandle"
                  autoComplete="nickname"
                  value={form.handle}
                  error={errors.handle}
                  onChange={(e) => setField("handle", e.target.value)}
                />
                <Input
                  ref={(el) => {
                    fieldRefs.current.phone = el;
                  }}
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+44 7700 900000"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
                <Input
                  ref={(el) => {
                    fieldRefs.current.email = el;
                  }}
                  label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  error={errors.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>

              <Input
                ref={(el) => {
                  fieldRefs.current.github = el;
                }}
                label="GitHub"
                placeholder="username"
                autoComplete="off"
                spellCheck={false}
                hint="Optional — helps show what you've built."
                value={form.github}
                error={errors.github}
                onChange={(e) => setField("github", e.target.value)}
              />

              <Textarea
                ref={(el) => {
                  fieldRefs.current.text = el;
                }}
                label="Why do you want to join?"
                required
                rows={5}
                maxLength={TEXT_MAX}
                placeholder="Tell the community what you're building…"
                value={form.text}
                error={errors.text}
                hint={`At least ${TEXT_MIN} characters. Specifics beat buzzwords.`}
                trailing={
                  <span
                    className={clsx(
                      "text-[15px] font-medium tabular-nums",
                      textLen >= TEXT_MAX ? "text-rose-700" : textLen > 0 && textLen < TEXT_MIN ? "text-amber-700" : "text-slate-600"
                    )}
                    aria-live="polite"
                  >
                    {textLen}/{TEXT_MAX}
                  </span>
                }
                onChange={(e) => setField("text", e.target.value)}
              />
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" size="lg" loading={pending} icon={<Send className="h-5 w-5" aria-hidden />}>
                {pending ? "Checking…" : "Submit application"}
              </Button>
              {error && !pending ? (
                <Button variant="ghost" size="lg" onClick={reset} icon={<RotateCcw className="h-5 w-5" aria-hidden />}>
                  Apply again
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        {/* ---------- Result panel ---------- */}
        <section aria-labelledby="apply-result-title" aria-live="polite" className="min-w-0">
          <h2 id="apply-result-title" className="sr-only">
            Result
          </h2>
          {pending ? (
            <LoadingPanel />
          ) : error ? (
            <ErrorState
              title={error.kind === "rate_limited" ? "Too many tries — wait a minute" : error.kind === "timeout" ? "That took too long" : "We couldn't check your application"}
              message={
                error.kind === "rate_limited"
                  ? "You've submitted a lot in a short time. Wait a minute, then try again."
                  : error.kind === "timeout"
                    ? "The checks didn't finish within 30 seconds. Your answers are still here — try again."
                    : error.kind === "network"
                      ? "Couldn't reach the server. Check your connection and try again."
                      : error.message
              }
              details={error.details}
              onRetry={() => void submit()}
              className="animate-gk-fade-in motion-reduce:animate-none"
            />
          ) : result ? (
            <ResultPanel result={result} headingRef={resultRef} onReset={reset} />
          ) : (
            <IdlePanel />
          )}
        </section>
      </div>
    </main>
  );
}

/* ---------- Panels ---------- */

function IdlePanel() {
  return (
    <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-700 ring-2 ring-slate-200">
        <ShieldCheck className="h-7 w-7" aria-hidden />
      </div>
      <p className="text-xl font-bold text-slate-900">The result appears here</p>
      <p className="mt-2 max-w-sm text-slate-600">
        Submit the form to see the decision, score and signals the community lead gets — and the message the applicant
        gets.
      </p>
    </div>
  );
}

function LoadingPanel() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), STAGE_MS);
    return () => clearInterval(id);
  }, []);
  const sub = tick === 0 ? null : CYCLE_STAGES[(tick - 1) % CYCLE_STAGES.length];

  return (
    <Card className="overflow-hidden" as="div">
      <div className="h-1.5 w-full overflow-hidden bg-slate-100">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-900 motion-reduce:animate-none" />
      </div>
      <div className="p-6">
        <div role="status" className="flex items-start gap-3">
          <Loader2 className="mt-1 h-6 w-6 shrink-0 animate-spin text-slate-900 motion-reduce:animate-none" aria-hidden />
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">{FIRST_STAGE}</p>
            <p key={tick} className="mt-1 h-6 text-slate-600 animate-gk-fade-in motion-reduce:animate-none">
              {sub ?? " "}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <Skeleton className="h-16 w-48 rounded-xl" />
          <Skeleton className="h-14 w-32" />
        </div>
        <Skeleton className="mt-6 h-5 w-3/4" />
        <Skeleton className="mt-2 h-5 w-1/2" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ResultPanel({
  result,
  headingRef,
  onReset,
}: {
  result: ScoreResult;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onReset: () => void;
}) {
  const signals = buildSignalsFromApi(result.signals, result.github);
  const hit = result.signals?.blocklist_hit === true || !!result.blocklist_match;
  const ruleN = parseRuleNumber(result.reason);
  const community = communityName(result.community_slug);
  const msg = applicantMessage(result.decision, community);

  return (
    <div className="space-y-6 animate-gk-fade-in motion-reduce:animate-none">
      {/* Internal view */}
      <Card className={clsx("p-5 sm:p-6", hit && "ring-4 ring-rose-600")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className={clsx("flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide text-slate-700 rounded-md", focusRing)}
          >
            <Eye className="h-4 w-4" aria-hidden />
            What the lead sees
          </h3>
          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[13px] font-semibold text-white">
            Internal · not shown to applicant
          </span>
        </div>

        <div className={clsx("mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border-2 p-5", DECISION_SOFT[result.decision])}>
          <DecisionPill decision={result.decision} size="xl" />
          <ScoreBadge score={result.score} size="xl" />
        </div>

        {hit ? <BlocklistCallout match={result.blocklist_match ?? {}} className="mt-5" /> : null}

        <div className="mt-5">
          <h4 className="font-bold text-slate-900">Reason</h4>
          <p className="mt-1 text-lg leading-relaxed text-slate-900">{result.reason || "No reason returned."}</p>
          {result.reason ? (
            <blockquote className="mt-3 border-l-4 border-slate-900 pl-4 text-slate-700">
              <span className="font-bold text-slate-900">Rule {ruleN}</span> — {ruleText(ruleN)}
            </blockquote>
          ) : null}
        </div>

        <div className="mt-5">
          <h4 className="font-bold text-slate-900">Signals</h4>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {signals.map((s) => (
              <SignalChip key={s.key} signal={s} size="lg" />
            ))}
          </div>
        </div>

        <p className="mt-5 text-[15px] text-slate-600">
          {community}
          {result.application_id ? (
            <>
              {" · "}
              <span className="font-mono">{result.application_id}</span>
            </>
          ) : null}
          {" · "}Final call stays with a human lead.
        </p>
      </Card>

      {/* Applicant view */}
      <Card className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide text-slate-700">
          <MessageSquareText className="h-4 w-4" aria-hidden />
          What the applicant sees
        </h3>
        <div className="mt-4 rounded-xl bg-slate-50 p-5">
          <p className="text-lg font-bold text-slate-900">{msg.title}</p>
          <p className="mt-1 text-slate-700">{msg.body}</p>
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={onReset} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
            Apply again
          </Button>
        </div>
      </Card>
    </div>
  );
}
