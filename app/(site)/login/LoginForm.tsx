"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, Input, focusRing } from "@/components/ui";

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
          : "Can't reach Gatekeeper. Check your connection and try again.",
      });
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      window.clearTimeout(timer);
    }
  }

  const errorMessage = status.kind === "error" ? status.message : null;

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 sm:px-6">
      {/* subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(226_232_240/0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgb(226_232_240/0.7)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <div className="relative w-full max-w-md animate-gk-fade-in motion-reduce:animate-none">
        <Card className="p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-12px_rgb(15_23_42/0.18)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <ShieldCheck className="h-8 w-8" aria-hidden />
            </span>
            <p className="mt-4 text-[15px] font-semibold uppercase tracking-wider text-slate-600">Gatekeeper</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Lead sign in</h1>
            <p className="mt-2 text-slate-600">Review applications for your community.</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5" aria-describedby="login-status">
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
                className={clsx("pr-12 font-mono tracking-wide", errorMessage && "!border-rose-600")}
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                disabled={busy}
                aria-label={reveal ? "Hide passcode" : "Show passcode"}
                aria-pressed={reveal}
                className={clsx(
                  "absolute right-2 top-[2.375rem] grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50",
                  focusRing
                )}
              >
                {reveal ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>

            <div id="login-status" aria-live="polite" aria-atomic="true" className="min-h-0">
              {errorMessage ? (
                <p
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-medium text-rose-800 animate-gk-fade-in motion-reduce:animate-none"
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
                  <span>{errorMessage}</span>
                </p>
              ) : status.kind === "success" ? (
                <p className="flex items-start gap-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] font-medium text-emerald-900 animate-gk-fade-in motion-reduce:animate-none">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
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
              icon={status.kind === "success" ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <KeyRound className="h-5 w-5" aria-hidden />}
              className="w-full"
            >
              {status.kind === "verifying" ? "Checking passcode…" : status.kind === "success" ? "Signed in" : "Sign in"}
            </Button>

            <p className="text-center text-[15px] text-slate-600">
              Kept in a secure, httpOnly cookie on this device for 7 days.
            </p>
          </form>
        </Card>

        <p className="mt-6 text-center text-slate-600">
          Not a lead?{" "}
          <Link
            href="/apply"
            className={clsx(
              "inline-flex items-center gap-1 rounded-md font-semibold text-slate-900 underline decoration-slate-300 decoration-2 underline-offset-4 transition-colors duration-150 hover:decoration-slate-900",
              focusRing
            )}
          >
            Apply to a community
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </div>
    </main>
  );
}
