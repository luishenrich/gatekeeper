"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMagicLink } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { error: authError } = await sendMagicLink(email.trim());
      if (authError) {
        setError("Could not send the email");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send the email");
    } finally {
      setPending(false);
    }
  }

  async function onPasscode(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/lead/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        setError("Passcode not accepted");
        return;
      }
      setPasscode("");
      router.push("/queue");
      router.refresh();
    } catch {
      setError("Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-[17px] text-slate-900">
      <div className="w-full max-w-md space-y-4 rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Sign in to Gatekeeper</h1>
        <p className="text-slate-600">Community leads only. We&apos;ll email you a magic link.</p>

        {sent ? (
          <p className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 text-slate-900">
            Check <span className="font-bold">{email}</span> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={onMagicLink} className="space-y-4">
            <label className="block font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg focus:border-slate-900"
            />
            <button
              type="submit"
              disabled={pending || email.trim().length === 0}
              className="h-14 w-full rounded-xl bg-slate-900 px-7 text-lg font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pending && !showPasscode ? "Sending…" : "Email me a link"}
            </button>
          </form>
        )}

        {error && (
          <p className="rounded-xl border-2 border-rose-600 bg-rose-50 p-4 text-rose-900" role="status">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowPasscode((open) => !open)}
          className="text-base font-semibold text-slate-700 underline"
        >
          Use demo passcode
        </button>

        {showPasscode && (
          <form onSubmit={onPasscode} className="space-y-3 border-t-2 border-slate-200 pt-4">
            <label className="block font-semibold" htmlFor="passcode">
              Demo passcode
            </label>
            <input
              id="passcode"
              type="password"
              name="passcode"
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg focus:border-slate-900"
              required
            />
            <button
              type="submit"
              disabled={pending || passcode.length === 0}
              className="h-14 w-full rounded-xl border-2 border-slate-900 px-7 text-lg font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
              {pending && showPasscode ? "Checking…" : "Continue"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
