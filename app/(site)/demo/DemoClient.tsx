"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { Timeline } from "@/components/demo/Timeline";
import type { DemoResponse, DemoStep, DemoStatus } from "@/components/demo/types";
import { maskDemoPhone } from "@/lib/demo/mask";
import { cn } from "@/lib/utils";

const COMMUNITIES = [
  { slug: "london-agent-builders", name: "London Agent Builders" },
  { slug: "south-london-hack-nights", name: "South London Hack Nights" },
] as const;

const NORMAL_TEXT =
  "Hi, I build evaluation harnesses for tool-using agents and I maintain a small TypeScript library for them. I live in Hackney and I can make the Tuesday in-person nights. Happy to help with the next hack night.";

const SCAMMER_TEXT =
  "Hello builders! Exclusive AI token presale, 10x guaranteed, message me for whitelist spot before it closes.";

const REVEAL_MS = 350;

type Preset = "normal" | "scammer";

export function DemoClient() {
  const [phone, setPhone] = useState("");
  const [community, setCommunity] = useState<string>(COMMUNITIES[0].slug);
  const [text, setText] = useState("");
  const [preset, setPreset] = useState<Preset | null>(null);
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [steps, setSteps] = useState<DemoStep[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [sentCommunity, setSentCommunity] = useState<string>(COMMUNITIES[0].slug);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Presentation only: reveal the steps the API returned one after another.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (steps.length === 0) return;
    timer.current = setInterval(() => {
      setRevealed((count) => {
        if (count >= steps.length) {
          if (timer.current) clearInterval(timer.current);
          return count;
        }
        return count + 1;
      });
    }, REVEAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [steps]);

  function resetResult() {
    setError(null);
    setRateLimited(false);
  }

  function applyNormal() {
    setPreset("normal");
    setPhone("+44 7700 900100");
    setCommunity("london-agent-builders");
    setText(NORMAL_TEXT);
    resetResult();
  }

  function applyScammer() {
    setPreset("scammer");
    setPhone("+44 7700 900901");
    setCommunity("south-london-hack-nights");
    setText(SCAMMER_TEXT);
    resetResult();
  }

  async function send() {
    setStatus("loading");
    setError(null);
    setRateLimited(false);
    setSteps([]);
    setRevealed(0);
    setSentCommunity(community);
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
        setError("Too many demo runs, wait a minute.");
        setStatus("error");
        return;
      }
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Could not reach Greenlight. Check your connection and try again.");
      setStatus("error");
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  const digits = phone.replace(/\D/g, "");
  const masked = digits.length >= 4 ? maskDemoPhone(phone) : null;
  const pending = status === "loading";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Live demo</p>
      <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
        Watch Greenlight <em className="font-display italic">screen</em> a WhatsApp applicant
      </h1>
      <p className="mt-3 text-[16px] text-muted-foreground">
        Send a message through the same signed webhook a real WhatsApp application uses, and watch each step.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm" aria-labelledby="demo-form-title">
          <h2 id="demo-form-title" className="font-display text-2xl text-foreground">
            Send as a WhatsApp applicant
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyNormal}
              aria-pressed={preset === "normal"}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                preset === "normal"
                  ? "border-green-600 bg-green-50 text-green-900"
                  : "border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              Normal applicant
            </button>
            <button
              type="button"
              onClick={applyScammer}
              aria-pressed={preset === "scammer"}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                preset === "scammer"
                  ? "border-red-600 bg-red-50 text-red-900"
                  : "border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              Known scammer (@cryptomax_alpha1)
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
            <Select
              label="Community"
              value={community}
              onChange={(event) => {
                setCommunity(event.target.value);
                setPreset(null);
              }}
            >
              {COMMUNITIES.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Input
              label="Phone"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setPreset(null);
              }}
              inputMode="tel"
              autoComplete="off"
              placeholder="+44 7700 900100"
              required
              hint={
                masked ? (
                  <>
                    Shown on screen as <span className="font-mono text-foreground">{masked}</span>
                  </>
                ) : (
                  "International format, e.g. +44 7700 900100"
                )
              }
            />

            <Textarea
              label="Message"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setPreset(null);
              }}
              rows={3}
              required
              className="min-h-[5.5rem]"
            />

            <Button type="submit" size="lg" loading={pending} icon={<Send className="h-4 w-4" aria-hidden />} className="w-full">
              {pending ? "Sending…" : "Send via WhatsApp"}
            </Button>

            <p className="text-[13px] text-muted-foreground">
              Real WhatsApp reply only reaches registered test numbers.
            </p>
          </form>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm" aria-labelledby="demo-steps-title">
          <h2 id="demo-steps-title" className="font-display text-2xl text-foreground">
            What Greenlight does
          </h2>
          <div className="mt-5">
            <Timeline
              steps={steps}
              revealed={revealed}
              status={status}
              error={error}
              rateLimited={rateLimited}
              communitySlug={sentCommunity}
              onRetry={() => void send()}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
