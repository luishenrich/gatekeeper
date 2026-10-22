"use client";

import { useState } from "react";
import {
  DecisionPill,
  SignalChip,
  decisionSoftClass,
  type Decision,
} from "@/components/decision-ui";
import {
  buildSignalsFromApi,
  isDecision,
  parseRuleNumber,
  ruleText,
} from "@/lib/signals-ui";

const COMMUNITIES = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
] as const;

/** A21 crypto scammer fixture; handle uses the known variant for the demo. */
const SCAMMER_PREFILL = {
  community_slug: "london-agent-builders",
  name: "Max Moonshot",
  handle: "@cryptomax_alpha1",
  phone: "+44 7700 900901",
  email: "max.moonshot@example.com",
  github: "",
  text: "Join my VIP signals group, 10x guaranteed on new AI token presale!! DM me now, limited spots, link in bio.",
};

type FormState = {
  community_slug: string;
  name: string;
  handle: string;
  phone: string;
  email: string;
  github: string;
  text: string;
};

type BlocklistMatch = {
  matched_on?: string[];
  status?: string;
  hash_prefix?: string;
  prior_community_name?: string;
  prior_reason?: string;
};

type ScoreResult = {
  application_id?: string;
  decision: Decision;
  score: number;
  reason: string;
  signals: Record<string, unknown>;
  blocklist_match?: BlocklistMatch | null;
  reply_draft?: unknown;
};

const emptyForm: FormState = {
  community_slug: COMMUNITIES[0].slug,
  name: "",
  handle: "",
  phone: "",
  email: "",
  github: "",
  text: "",
};

export default function ApplyClient({ useMocks }: { useMocks: boolean }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const prefix = useMocks ? "/api/mock" : "/api";
      const res = await fetch(`${prefix}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_slug: form.community_slug,
          application: {
            name: form.name,
            handle: form.handle,
            phone: form.phone,
            email: form.email,
            github: form.github || null,
            text: form.text,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Score failed (${res.status})`);
      }
      const data = await res.json();
      if (!isDecision(data.decision)) {
        throw new Error("Unexpected decision in response");
      }
      setResult({
        application_id: data.application_id,
        decision: data.decision,
        score: Number(data.score ?? 0),
        reason: String(data.reason ?? ""),
        signals: data.signals || {},
        blocklist_match: data.blocklist_match ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not score application");
    } finally {
      setPending(false);
    }
  }

  const signals = result
    ? buildSignalsFromApi(result.signals, form.github || null)
    : [];
  const ruleN = result ? parseRuleNumber(result.reason) : 1;
  const hit =
    result?.signals?.blocklist_hit === true || !!result?.blocklist_match;

  return (
    <main className="min-h-screen bg-white text-[17px] text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-2">
        <section>
          <h1 className="text-3xl font-black tracking-tight">Apply</h1>
          <p className="mt-1 text-base text-slate-600">
            Public application form — scored live, no account required.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="font-bold">Community</span>
              <select
                className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2 font-semibold"
                value={form.community_slug}
                onChange={(e) => setField("community_slug", e.target.value)}
                required
              >
                {COMMUNITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-bold">Name</span>
              <input
                className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="font-bold">Handle</span>
              <input
                className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                value={form.handle}
                onChange={(e) => setField("handle", e.target.value)}
                placeholder="@you"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-bold">Phone</span>
                <input
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="font-bold">Email</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="font-bold">GitHub</span>
              <input
                className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                value={form.github}
                onChange={(e) => setField("github", e.target.value)}
                placeholder="optional"
              />
            </label>

            <label className="block">
              <span className="font-bold">Why do you want to join?</span>
              <textarea
                className="mt-1 w-full min-h-32 rounded-xl border-2 border-slate-300 px-3 py-2"
                value={form.text}
                onChange={(e) => setField("text", e.target.value)}
                required
              />
            </label>

            {error && (
              <p className="rounded-xl border-2 border-rose-600 bg-rose-50 px-4 py-3 font-semibold text-rose-900">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="h-14 rounded-xl bg-slate-900 px-6 text-lg font-bold text-white disabled:opacity-50"
              >
                {pending ? "Scoring…" : "Submit application"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...SCAMMER_PREFILL });
                  setResult(null);
                  setError(null);
                }}
                className="h-14 rounded-xl border-2 border-rose-600 bg-rose-50 px-6 text-lg font-bold text-rose-900"
              >
                Try a known scammer
              </button>
            </div>
          </form>
        </section>

        <section>
          {!result ? (
            <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              Submit an application to see the score card here.
            </div>
          ) : (
            <div
              className={`rounded-2xl border-2 border-slate-300 p-6 ${
                hit ? "ring-4 ring-rose-600" : ""
              }`}
            >
              <div
                className={`rounded-2xl border-2 p-6 ${decisionSoftClass(
                  result.decision
                )}`}
              >
                <div className="flex flex-wrap items-end gap-6">
                  <DecisionPill decision={result.decision} size="xl" />
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-black tabular-nums">
                        {result.score}
                      </span>
                      <span className="text-2xl font-bold text-slate-600">
                        /100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-bold">Reason</h2>
                <p className="mt-2 text-lg leading-relaxed">{result.reason}</p>
                <blockquote className="mt-3 border-l-4 border-slate-900 pl-4 text-lg italic text-slate-800">
                  <span className="font-bold not-italic">Rule {ruleN}</span>
                  {" — "}
                  {ruleText(ruleN)}
                </blockquote>
              </div>

              {hit && (
                <div className="mt-6 rounded-xl border-2 border-rose-600 bg-rose-50 p-5">
                  <p className="text-lg font-bold text-rose-900">
                    🚫 Seen in{" "}
                    {result.blocklist_match?.prior_community_name ||
                      "another community"}
                    , same phone hash
                  </p>
                  {result.blocklist_match?.prior_reason && (
                    <p className="mt-2 text-base text-rose-900">
                      Declined there for: {result.blocklist_match.prior_reason}
                    </p>
                  )}
                  {result.blocklist_match?.hash_prefix && (
                    <p className="mt-2 font-mono text-base font-semibold text-rose-900">
                      {result.blocklist_match.hash_prefix}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h2 className="text-lg font-bold">Signals</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {signals.map((s) => (
                    <SignalChip key={s.key} signal={s} size="lg" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
