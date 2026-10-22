"use client";

import { useState, type FormEvent } from "react";
import { Timeline } from "@/components/demo/Timeline";
import type { DemoResponse, DemoStep } from "@/components/demo/types";

const COMMUNITIES = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
] as const;

const NORMAL_TEXT =
  "Hi, I build evaluation harnesses for tool-using agents and I maintain a small TypeScript library for them. I live in Hackney and I can make the Tuesday in-person nights. Happy to help with the next hack night.";

const SCAMMER_TEXT =
  "Hello builders! Exclusive AI token presale, 10x guaranteed, message me for whitelist spot before it closes.";

type Preset = "normal" | "scammer";

export default function DemoPage() {
  const [phone, setPhone] = useState("");
  const [community, setCommunity] = useState<string>(COMMUNITIES[0].slug);
  const [text, setText] = useState("");
  const [preset, setPreset] = useState<Preset | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [steps, setSteps] = useState<DemoStep[] | null>(null);

  function applyNormal() {
    setPreset("normal");
    setPhone("+44 7700 900100");
    setCommunity("london-agent-builders");
    setText(NORMAL_TEXT);
    setError(null);
    setRateLimited(false);
  }

  function applyScammer() {
    setPreset("scammer");
    setPhone("+44 7700 900901");
    setCommunity("south-london-hack-nights");
    setText(SCAMMER_TEXT);
    setError(null);
    setRateLimited(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setRateLimited(false);
    setSteps(null);
    try {
      const res = await fetch("/api/demo/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          community_slug: community,
          text,
          ...(preset ? { preset } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as DemoResponse;
      if (Array.isArray(data.steps)) setSteps(data.steps);
      if (res.status === 429) {
        setRateLimited(true);
        setError(data.error || "Too many requests");
        return;
      }
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
      }
    } catch {
      setError("Could not reach Greenlight. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-lg text-slate-900">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-600">Live demo</p>
      <h1 className="mt-2 text-5xl font-black tracking-tight">Greenlight</h1>
      <p className="mt-3 text-xl text-slate-700">
        Send a WhatsApp application through the same pipeline a real message uses.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-base font-bold">Phone</span>
          <input
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setPreset(null);
            }}
            inputMode="tel"
            autoComplete="off"
            placeholder="+44 7700 900100"
            className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-xl outline-none focus:border-slate-900"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-base font-bold">Community</span>
          <select
            value={community}
            onChange={(event) => {
              setCommunity(event.target.value);
              setPreset(null);
            }}
            className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-xl outline-none focus:border-slate-900"
          >
            {COMMUNITIES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-base font-bold">Message</span>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setPreset(null);
            }}
            rows={5}
            required
            className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-xl outline-none focus:border-slate-900"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={applyNormal}
            className={`rounded-xl border-2 px-4 py-3 text-lg font-bold ${
              preset === "normal"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-900"
            }`}
          >
            Normal applicant
          </button>
          <button
            type="button"
            onClick={applyScammer}
            className={`rounded-xl border-2 px-4 py-3 text-lg font-bold ${
              preset === "scammer"
                ? "border-rose-700 bg-rose-700 text-white"
                : "border-rose-600 bg-rose-50 text-rose-900"
            }`}
          >
            Known scammer
          </button>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-green-700 px-6 py-4 text-xl font-bold text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send as WhatsApp applicant"}
        </button>

        <p className="text-base text-slate-600">
          A real WhatsApp reply is delivered only if your number is a registered Meta test
          recipient and the community&apos;s Auto mode is on.
        </p>
      </form>

      {rateLimited && (
        <div role="alert" className="mt-6 rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 text-xl font-semibold">
          Too many requests. Greenlight allows 10 demo sends a minute from your network. Wait a
          minute, then try again.
        </div>
      )}
      {error && !rateLimited && (
        <div role="alert" className="mt-6 rounded-2xl border-2 border-rose-600 bg-rose-50 p-5 text-xl font-semibold">
          {error}
        </div>
      )}
      {pending && (
        <p className="mt-6 text-xl font-semibold text-slate-700">Sending through the WhatsApp pipeline…</p>
      )}

      <div className="mt-10">
        <Timeline steps={steps} />
      </div>
    </main>
  );
}
