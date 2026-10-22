"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, Input, focusRing } from "@/components/ui";
import { LogoMark } from "@/components/shell/Logo";
import { sendMagicLink, verifyCode } from "@/lib/auth/client";

type Status = { kind: "idle" } | { kind: "verifying" } | { kind: "error"; message: string } | { kind: "success" };

const SUCCESS_DELAY_MS = 600;
const REQUEST_TIMEOUT_MS = 15_000;

function messageFor(status: number, apiError: string | undefined): string {
  if (status === 401) return "That passcode didn't match. Check it with your event lead and try again.";
  if (status === 429) return "Too many tries — wait a minute.";
  if (status === 500 && apiError === "Auth not configured") {
    return "Lead sign-in isn't set up on this server yet. Ask the organiser to configure the passcode.";
  }
  return "Something went wrong on our side. Try again in a moment.";
}

function destinationLabel(next: string): string {
  if (next === "/queue" || next.startsWith("/queue?")) return "the review queue";
  if (next.startsWith("/dashboard")) return "the dashboard";
  if (next.startsWith("/settings")) return "settings";
  return next;
}

type EmailPhase = "enter" | "sent";
type EmailBusy = "sending" | "verifying" | null;

const RESEND_COOLDOWN_S = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

function sendErrorMessage(err: unknown): string {
  if (authStatus(err) === 429) return "Too many tries — wait a minute.";
  return "Could not send the email. Check the address and try again.";
}

function verifyErrorMessage(err: unknown): string {
  if (authStatus(err) === 429) return "Too many tries — wait a minute.";
  return "That code is invalid or has expired. Check the latest email or send a new one.";
}

function StatusNote({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const error = tone === "error";
  return (
    <p
      role={error ? "alert" : undefined}
      className={clsx(
        "flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-left text-[14px] animate-gk-fade-in motion-reduce:animate-none",
        error ? "border-rose-200 bg-rose-50/70 text-rose-900" : "border-emerald-200 bg-emerald-50/70 text-emerald-900",
      )}
    >
      {error ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
      )}
      <span>{children}</span>
    </p>
  );
}

const linkButton = clsx(
  "rounded-md font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:decoration-foreground disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline",
  focusRing,
);

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [passcode, setPasscode] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "verifying" || status.kind === "success";

  // Email (magic link / one-time code) — the primary path.
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [emailPhase, setEmailPhase] = useState<EmailPhase>("enter");
  const [emailBusy, setEmailBusy] = useState<EmailBusy>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailDone, setEmailDone] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [passcodeOpen, setPasscodeOpen] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (passcodeOpen) inputRef.current?.focus();
  }, [passcodeOpen]);

  async function requestLink(address: string): Promise<boolean> {
    setEmailBusy("sending");
    setEmailError(null);
    try {
      const { error } = await sendMagicLink(address);
      if (error) {
        setEmailError(sendErrorMessage(error));
        return false;
      }
      setSentTo(address);
      setCooldown(RESEND_COOLDOWN_S);
      return true;
    } catch (err) {
      setEmailError(sendErrorMessage(err));
      return false;
    } finally {
      setEmailBusy(null);
    }
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (emailBusy) return;
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setEmailError("Enter the email address you use as a lead.");
      emailRef.current?.focus();
      return;
    }
    const ok = await requestLink(address);
    if (ok) {
      setEmailPhase("sent");
      setShowCode(false);
      setCode("");
    } else {
      requestAnimationFrame(() => emailRef.current?.focus());
    }
  }

  async function onResend() {
    if (emailBusy || cooldown > 0 || !sentTo) return;
    await requestLink(sentTo);
  }

  function onChangeEmail() {
    setEmailPhase("enter");
    setEmailError(null);
    setShowCode(false);
    setCode("");
    setCooldown(0);
    requestAnimationFrame(() => emailRef.current?.select());
  }

  async function onCodeSubmit(e: FormEvent) {
    e.preventDefault();
    if (emailBusy || emailDone) return;
    if (!/^\d{6}$/.test(code)) {
      setEmailError("Enter the 6-digit code from the email.");
      codeRef.current?.focus();
      return;
    }
    setEmailBusy("verifying");
    setEmailError(null);
    try {
      const { error } = await verifyCode(sentTo, code);
      if (error) {
        setEmailError(verifyErrorMessage(error));
        requestAnimationFrame(() => codeRef.current?.select());
        return;
      }
      setEmailDone(true);
      setCode("");
      router.replace(next);
      router.refresh();
    } catch {
      setEmailError("Could not check the code. Check your connection and try again.");
    } finally {
      setEmailBusy(null);
    }
  }

  useEffect(() => {
    if (status.kind !== "success") return;
    const t = window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, SUCCESS_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [status.kind, next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (passcode.trim().length === 0) {
      setStatus({
        kind: "error",
        message: "Enter the lead passcode to continue.",
      });
      inputRef.current?.focus();
      return;
    }

    setStatus({ kind: "verifying" });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch("/api/lead/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passcode }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setStatus({
          kind: "error",
          message: messageFor(res.status, body?.error),
        });
        requestAnimationFrame(() => inputRef.current?.select());
        return;
      }
      setPasscode("");
      setStatus({ kind: "success" });
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "AbortError";
      setStatus({
        kind: "error",
        message: timedOut
          ? "Sign-in is taking too long. Check your connection and try again."
          : "Can't reach Greenlight. Check your connection and try again.",
      });
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      window.clearTimeout(timer);
    }
  }

  const errorMessage = status.kind === "error" ? status.message : null;

  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8">
      {/* softly blurred backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/window.webp" alt="" className="h-full w-full scale-105 object-cover opacity-40 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
      </div>

      <div className="relative w-full max-w-md animate-gk-fade-in motion-reduce:animate-none">
        <Card className="rounded-3xl p-8 shadow-[0_1px_2px_rgba(26,26,26,0.04),0_24px_60px_-24px_rgba(26,26,26,0.25)] sm:p-10">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-12 w-12 rounded-2xl [&_svg]:h-7 [&_svg]:w-7" />
            <p className="mt-5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Greenlight · for leads</p>
            <h1 className="mt-2 font-display text-5xl leading-none tracking-tight text-foreground">
              Lead <em className="font-display italic">sign in</em>
            </h1>
            <p className="mt-3 text-[15px] text-muted-foreground">Community leads only. We&apos;ll email you a sign-in link.</p>
          </div>

          {emailPhase === "enter" ? (
            <form
              method="post"
              action="/login"
              onSubmit={onEmailSubmit}
              noValidate
              className="mt-8 space-y-5"
              aria-describedby="email-status"
            >
              <Input
                ref={emailRef}
                label="Email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
                placeholder="you@community.org"
                value={email}
                disabled={emailBusy === "sending"}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                aria-invalid={emailError ? true : undefined}
                className={clsx("h-12", emailError && "!border-rose-500")}
              />
              <div id="email-status" aria-live="polite" aria-atomic="true">
                {emailError ? (
                  <StatusNote tone="error">{emailError}</StatusNote>
                ) : emailBusy === "sending" ? (
                  <span className="sr-only">Sending sign-in email…</span>
                ) : null}
              </div>
              <Button
                type="submit"
                size="lg"
                loading={emailBusy === "sending"}
                icon={<Mail className="h-4 w-4" aria-hidden />}
                className="w-full"
              >
                {emailBusy === "sending" ? "Sending…" : "Email me a sign-in link"}
              </Button>
            </form>
          ) : (
            <div className="mt-8 space-y-5">
              <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 text-center">
                <Mail className="mx-auto h-5 w-5 text-foreground" aria-hidden />
                <h2 className="mt-2 font-display text-2xl leading-tight text-foreground">Check your email</h2>
                <p className="mt-1 text-[14px] text-muted-foreground">
                  We sent a sign-in link to <span className="break-all font-medium text-foreground">{sentTo}</span>. It works on this
                  device.
                </p>
              </div>

              {showCode ? (
                <form
                  method="post"
                  action="/login"
                  onSubmit={onCodeSubmit}
                  noValidate
                  className="space-y-4"
                  aria-describedby="email-status"
                >
                  <Input
                    ref={codeRef}
                    label="6-digit code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    value={code}
                    disabled={emailBusy === "verifying" || emailDone}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (emailError) setEmailError(null);
                    }}
                    aria-invalid={emailError ? true : undefined}
                    className={clsx("h-12 text-center font-mono text-lg tracking-[0.4em]", emailError && "!border-rose-500")}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    variant={emailDone ? "accept" : "primary"}
                    loading={emailBusy === "verifying"}
                    disabled={emailDone}
                    icon={emailDone ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
                    className="w-full"
                  >
                    {emailBusy === "verifying" ? "Checking code…" : emailDone ? "Signed in" : "Sign in with code"}
                  </Button>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setShowCode(true);
                    setEmailError(null);
                  }}
                  className="w-full"
                >
                  Enter the 6-digit code instead
                </Button>
              )}

              <div id="email-status" aria-live="polite" aria-atomic="true">
                {emailError ? (
                  <StatusNote tone="error">{emailError}</StatusNote>
                ) : emailDone ? (
                  <StatusNote tone="success">Signed in. Opening {destinationLabel(next)}…</StatusNote>
                ) : emailBusy === "sending" ? (
                  <span className="sr-only">Sending a new email…</span>
                ) : emailBusy === "verifying" ? (
                  <span className="sr-only">Checking code…</span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px]">
                <button type="button" onClick={onResend} disabled={cooldown > 0 || emailBusy !== null || emailDone} className={linkButton}>
                  {emailBusy === "sending" ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
                </button>
                <button type="button" onClick={onChangeEmail} disabled={emailBusy !== null || emailDone} className={linkButton}>
                  Change email
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setPasscodeOpen((o) => !o)}
              aria-expanded={passcodeOpen}
              aria-controls="passcode-panel"
              className={clsx(
                "mx-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium text-foreground/80 transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground",
                focusRing,
              )}
            >
              Have the event lead passcode?
              <ChevronDown className={clsx("h-4 w-4 transition-transform duration-150", passcodeOpen && "rotate-180")} aria-hidden />
            </button>

            <div id="passcode-panel" hidden={!passcodeOpen}>
              <form method="post" action="/login" onSubmit={onSubmit} noValidate className="mt-5 space-y-5" aria-describedby="login-status">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    label="Lead passcode"
                    name="passcode"
                    type={reveal ? "text" : "password"}
                    autoComplete="current-password"
                    spellCheck={false}
                    autoCapitalize="none"
                    placeholder="Enter your event passcode"
                    value={passcode}
                    disabled={busy}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (status.kind === "error") setStatus({ kind: "idle" });
                    }}
                    hint="Shared by your event organiser."
                    aria-invalid={errorMessage ? true : undefined}
                    className={clsx("h-12 pr-12 font-mono tracking-wide", errorMessage && "!border-rose-500")}
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    disabled={busy}
                    aria-label={reveal ? "Hide passcode" : "Show passcode"}
                    aria-pressed={reveal}
                    className={clsx(
                      "absolute right-1.5 top-[2.0625rem] grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground disabled:opacity-50",
                      focusRing,
                    )}
                  >
                    {reveal ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>

                <div id="login-status" aria-live="polite" aria-atomic="true" className="min-h-0">
                  {errorMessage ? (
                    <p
                      role="alert"
                      className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-[14px] text-rose-900 animate-gk-fade-in motion-reduce:animate-none"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                      <span>{errorMessage}</span>
                    </p>
                  ) : status.kind === "success" ? (
                    <p className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-[14px] text-emerald-900 animate-gk-fade-in motion-reduce:animate-none">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span>Signed in. Opening {destinationLabel(next)}…</span>
                    </p>
                  ) : status.kind === "verifying" ? (
                    <span className="sr-only">Checking passcode…</span>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  variant={status.kind === "success" ? "accept" : "primary"}
                  loading={status.kind === "verifying"}
                  disabled={status.kind === "success"}
                  icon={
                    status.kind === "success" ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                    ) : (
                      <KeyRound className="h-4 w-4" aria-hidden />
                    )
                  }
                  className="w-full"
                >
                  {status.kind === "verifying" ? "Checking passcode…" : status.kind === "success" ? "Signed in" : "Sign in"}
                </Button>

                <p className="text-center text-[13px] text-muted-foreground">
                  Kept in a secure, httpOnly cookie on this device for 7 days.
                </p>
              </form>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-[15px] text-foreground/80">
          Not a lead?{" "}
          <Link
            href="/apply"
            className={clsx(
              "inline-flex items-center gap-1 rounded-md font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:decoration-foreground",
              focusRing,
            )}
          >
            Apply to a community
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </div>
    </div>
  );
}
