"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, Input, focusRing } from "@/components/ui";
import { LogoMark } from "@/components/shell/Logo";

type Status =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "error"; message: string }
  | { kind: "success" };

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

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [passcode, setPasscode] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "verifying" || status.kind === "success";

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
      setStatus({ kind: "error", message: "Enter the lead passcode to continue." });
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
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus({ kind: "error", message: messageFor(res.status, body?.error) });
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
            <p className="mt-3 text-[15px] text-muted-foreground">Review applications for your community.</p>
          </div>

          <form method="post" action="/login" onSubmit={onSubmit} noValidate className="mt-8 space-y-5" aria-describedby="login-status">
            <div className="relative">
              <Input
                ref={inputRef}
                label="Lead passcode"
                name="passcode"
                type={reveal ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
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
                  focusRing
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
              icon={status.kind === "success" ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
              className="w-full"
            >
              {status.kind === "verifying" ? "Checking passcode…" : status.kind === "success" ? "Signed in" : "Sign in"}
            </Button>

            <p className="text-center text-[13px] text-muted-foreground">
              Kept in a secure, httpOnly cookie on this device for 7 days.
            </p>
          </form>
        </Card>

        <p className="mt-6 text-center text-[15px] text-foreground/80">
          Not a lead?{" "}
          <Link
            href="/apply"
            className={clsx(
              "inline-flex items-center gap-1 rounded-md font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:decoration-foreground",
              focusRing
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
