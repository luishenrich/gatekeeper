"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Eye, FlaskConical, Loader2, MessageSquareText, RotateCcw, Send, ShieldCheck, Sparkles, Skull } from "lucide-react";
import {
  BlocklistCallout,
  Button,
  Card,
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
import { LogoMark } from "@/components/shell/Logo";

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
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-none tracking-tight text-foreground sm:text-5xl">
            Apply to <em className="font-display italic">join</em>
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Checked against the community&apos;s rules in seconds. A human lead makes the final call.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Demo
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={locked || !SCAMMER}
            onClick={() => prefill(SCAMMER, "south-london-hack-nights")}
            icon={<Skull className="h-3.5 w-3.5 text-red-600" aria-hidden />}
          >
            Known scammer
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={locked || !STRONG}
            onClick={() => prefill(STRONG, "london-agent-builders")}
            icon={<Sparkles className="h-3.5 w-3.5 text-green-600" aria-hidden />}
          >
            Strong applicant
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* ---------- Form ---------- */}
        <section aria-labelledby="apply-form-title">
          <h2 id="apply-form-title" className="sr-only">
            Application form
          </h2>

          <Card className="rounded-3xl p-5 sm:p-6">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="space-y-4"
            >
              <fieldset disabled={locked} className="space-y-3.5 disabled:opacity-80">
                <div className="grid gap-3.5 sm:grid-cols-2">
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

                <Input
                  ref={(el) => {
                    fieldRefs.current.github = el;
                  }}
                  label="GitHub"
                  placeholder="username (optional)"
                  autoComplete="off"
                  spellCheck={false}
                  value={form.github}
                  error={errors.github}
                  onChange={(e) => setField("github", e.target.value)}
                />
                </div>

                <Textarea
                  ref={(el) => {
                    fieldRefs.current.text = el;
                  }}
                  label="Why do you want to join?"
                  required
                  rows={4}
                  maxLength={TEXT_MAX}
                  placeholder="Tell the community what you're building…"
                  value={form.text}
                  error={errors.text}
                  trailing={
                    <span
                      className={clsx(
                        "text-[13px] tabular-nums",
                        textLen >= TEXT_MAX
                          ? "font-medium text-rose-700"
                          : textLen > 0 && textLen < TEXT_MIN
                            ? "font-medium text-amber-700"
                            : "text-muted-foreground"
                      )}
                      aria-live="polite"
                    >
                      {textLen}/{TEXT_MAX}
                    </span>
                  }
                  onChange={(e) => setField("text", e.target.value)}
                />
              </fieldset>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" className="w-full sm:w-auto" loading={pending} icon={<Send className="h-4 w-4" aria-hidden />}>
                  {pending ? "Checking…" : "Submit application"}
                </Button>
                {error && !pending ? (
                  <Button variant="ghost" size="lg" onClick={reset} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
                    Apply again
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>
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
              className="rounded-3xl animate-gk-fade-in motion-reduce:animate-none"
            />
          ) : result ? (
            <ResultPanel result={result} headingRef={resultRef} onReset={reset} />
          ) : (
            <IdlePanel />
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Panels ---------- */

function IdlePanel() {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-3xl border border-dashed border-foreground/15 bg-card/50 px-6 py-10 text-center">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-foreground">
        <ShieldCheck className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-display text-2xl text-foreground">The result appears here</p>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        Decision, score and signals for the lead, plus the message the applicant gets.
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
    <Card className="overflow-hidden rounded-3xl">
      <div className="h-1 w-full overflow-hidden bg-muted">
        <div className="gk-shimmer h-full w-full bg-foreground/20" />
      </div>
      <div className="p-5 sm:p-6">
        <div role="status" className="flex items-start gap-3">
          <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />
          <div className="min-w-0">
            <p className="font-display text-2xl leading-snug text-foreground">{FIRST_STAGE}</p>
            <p key={tick} className="mt-1 h-6 text-[15px] text-muted-foreground animate-gk-fade-in motion-reduce:animate-none">
              {sub ?? " "}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <Skeleton className="h-12 w-36 rounded-full" />
          <Skeleton className="h-16 w-32 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-4 w-3/4 rounded-full" />
        <Skeleton className="mt-3 h-4 w-1/2 rounded-full" />
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
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
    <Card className={clsx("rounded-3xl p-5 sm:p-6 animate-gk-fade-in motion-reduce:animate-none", hit && "border-red-300 ring-4 ring-red-100")}>
      <div className="flex items-center justify-between gap-2">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className={clsx(
            "flex items-center gap-2 rounded-md text-[12px] font-medium uppercase tracking-wider text-muted-foreground",
            focusRing
          )}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          What the lead sees
        </h3>
        <Button variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}>
          Apply again
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-border bg-muted/40 px-5 py-4">
        <DecisionPill decision={result.decision} size="md" />
        <ScoreBadge score={result.score} size="xl" />
      </div>

      {hit ? <BlocklistCallout match={result.blocklist_match ?? {}} className="mt-3" /> : null}

      <p className="mt-4 text-[15px] leading-relaxed text-foreground">{result.reason || "No reason returned."}</p>
      {result.reason ? (
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground/80">Rule {ruleN}</span> — {ruleText(ruleN)}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {signals.map((s) => (
          <SignalChip key={s.key} signal={s} />
        ))}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
          <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
          What the applicant sees
        </h3>
        <div className="mt-2.5 flex items-end gap-2.5">
          <LogoMark className="h-7 w-7 shrink-0" />
          <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
            <p className="text-[14px] font-medium text-foreground">{msg.title}</p>
            <p className="text-[14px] leading-snug text-foreground/80">{msg.body}</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">
          {community} · Final call stays with a human lead.
        </p>
      </div>
    </Card>
  );
}
