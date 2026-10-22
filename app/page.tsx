import clsx from "clsx";
import { ArrowRight, Fingerprint, Inbox, Keyboard, ScanSearch } from "lucide-react";
import Link from "next/link";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { CopyCode } from "@/components/landing/CopyCode";
import { GitHubMark } from "@/components/landing/GitHubMark";
import { HeroQueueDemo } from "@/components/landing/HeroQueueDemo";
import { BENCHMARK } from "@/lib/ui/benchmark";
import { REPO_URL } from "@/lib/ui/communities";

// Local copy: importing a constant from the "use client" ui barrel into a server component yields a client reference.
const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20";

const btn = {
  primary:
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-5 text-[17px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-slate-800",
  secondary:
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 text-[17px] font-semibold text-slate-900 transition-colors duration-150 ease-out hover:border-slate-400 hover:bg-slate-50",
  ghost:
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-transparent px-4 text-[17px] font-semibold text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-slate-900",
};

const STEPS = [
  {
    Icon: Inbox,
    title: "Apply anywhere",
    body: "Applicants use your web form or message your WhatsApp number. A Discord bot checks new joins against the same blocklist.",
  },
  {
    Icon: ScanSearch,
    title: "Score against your rules",
    body: "An LLM reads your community rules and returns accept, ask or decline with a reason that cites the rule. Spam text, StopForumSpam, GitHub and Devpost add signals.",
  },
  {
    Icon: Fingerprint,
    title: "Check the shared blocklist",
    body: "Phone, handle and email are hashed with HMAC-SHA256 and matched across communities. Other communities see a match, never the raw value or the evidence.",
  },
  {
    Icon: Keyboard,
    title: "A lead decides in one keystroke",
    body: "The queue puts blocklist hits first. Press A, S or D, edit the drafted reply, hit Enter. Declines are never sent automatically.",
  },
] as const;

const SELF_HOST = `git clone ${REPO_URL}
cd gatekeeper && npm install
cp .env.example .env.local
# fill in Supabase keys, BLOCKLIST_HMAC_SECRET,
# OPENROUTER_API_KEY and QUEUE_ADMIN_TOKEN
supabase db push
npm run dev`;

function SectionHeading({ id, eyebrow, title, body }: { id: string; eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[14px] font-bold uppercase tracking-[0.14em] text-indigo-700">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-lg leading-relaxed text-slate-600">{body}</p> : null}
    </div>
  );
}

export default function Home() {
  const [best, ...rest] = BENCHMARK.models;

  return (
    <main className="overflow-x-hidden bg-white text-[17px] text-slate-900">
      {/* ---------- Hero ---------- */}
      <section className="relative isolate">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,black_30%,transparent_100%)]"
        />
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:pb-28 lg:pt-20">
          <div>
            <a
              href={REPO_URL}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white/80 px-3 py-1 text-[14px] font-semibold text-slate-700 backdrop-blur hover:border-slate-300",
                focusRing
              )}
            >
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-white">MIT</span>
              <span>
                Open-source trust &amp; safety<span className="hidden sm:inline"> for communities</span>
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Stop scammers at the door. Let builders straight in.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Gatekeeper scores every application against your community rules, checks a blocklist shared across
              communities by hash, and puts the hard calls in a keyboard-first queue. A lead approves every decline.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/apply" className={clsx(btn.primary, focusRing)}>
                Try it
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link href="/login" className={clsx(btn.secondary, focusRing)}>
                Lead sign in
              </Link>
              <a href={REPO_URL} className={clsx(btn.ghost, focusRing)}>
                <GitHubMark className="h-5 w-5" />
                View on GitHub
              </a>
            </div>
          </div>

          <HeroQueueDemo />
        </div>
      </section>

      {/* ---------- Benchmark strip ---------- */}
      <section aria-labelledby="benchmark-heading" className="border-y-2 border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xs">
              <h2 id="benchmark-heading" className="text-[14px] font-bold uppercase tracking-[0.14em] text-slate-600">
                Benchmark
              </h2>
              <p className="mt-2 text-[15px] text-slate-600">
                Test set of {BENCHMARK.testSetLabel}.{" "}
                <Link href="/eval" className={clsx("rounded font-semibold text-slate-900 underline underline-offset-4", focusRing)}>
                  See the eval
                </Link>
              </p>
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:max-w-3xl">
              {[best, ...rest].map((m) => (
                <div key={m.id}>
                  <dt className="text-[15px] font-semibold text-slate-600">{m.name}</dt>
                  <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-4xl">
                    {m.correct}
                    <span className="text-xl text-slate-500">/{BENCHMARK.testSetSize}</span>
                  </dd>
                </div>
              ))}
              <div>
                <dt className="text-[15px] font-semibold text-slate-600">False blocks</dt>
                <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-4xl">{BENCHMARK.falseBlocks}</dd>
              </div>
              <div>
                <dt className="text-[15px] font-semibold text-slate-600">Missed scammers</dt>
                <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-4xl">{BENCHMARK.missedScammers}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section aria-labelledby="how-heading" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div>
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="Four steps from application to decision"
            body="Gatekeeper does the reading and the cross-checking. Your leads keep the final say."
          />
        </div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative rounded-2xl border-2 border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-[15px] font-semibold text-slate-500">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Comparison ---------- */}
      <section aria-labelledby="compare-heading" className="border-t-2 border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div>
            <SectionHeading
              id="compare-heading"
              eyebrow="Compared"
              title="Built for the moment someone applies"
              body="Ban-list bots act after someone has joined. Gatekeeper decides before, explains why, and shares only hashes."
            />
          </div>
          <div className="mt-12">
            <ComparisonTable />
          </div>
          <p className="mt-4 text-[14px] text-slate-600">
            Based on public docs, Oct 2026. Partial means the capability exists with limits or depends on configuration.
          </p>
        </div>
      </section>

      {/* ---------- Self-host ---------- */}
      <section aria-labelledby="selfhost-heading" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="selfhost-heading"
              eyebrow="Self-host · MIT"
              title="Run it for your own community"
              body="Next.js and Supabase, deployable to Vercel. Your rules live in your database, the HMAC secret stays on your server, and no raw phone number ever enters the blocklist."
            />
            <ul className="mt-6 space-y-2 text-slate-700">
              <li className="flex gap-2"><span aria-hidden className="text-slate-400">—</span>Bring your own LLM key via OpenRouter</li>
              <li className="flex gap-2"><span aria-hidden className="text-slate-400">—</span>Mock mode for demos with fixture data</li>
              <li className="flex gap-2"><span aria-hidden className="text-slate-400">—</span>Every report and check written to an audit log</li>
            </ul>
            <a href={REPO_URL} className={clsx(btn.secondary, "mt-8", focusRing)}>
              <GitHubMark className="h-5 w-5" />
              luishenrich/gatekeeper
            </a>
          </div>
          <CopyCode label="Terminal" code={SELF_HOST} />
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section aria-labelledby="cta-heading" className="px-4 pb-24 sm:px-6">
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(99,102,241,0.35),transparent_70%)]"
          />
          <h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Watch the shared blocklist catch a scammer.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Submit an application as a builder, then as a known scammer. The second one is stopped before they ever join.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/apply"
              className={clsx(
                "inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-slate-950 transition-colors duration-150 hover:bg-slate-200",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              )}
            >
              Try it
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/login"
              className={clsx(
                "inline-flex h-12 items-center rounded-xl border-2 border-slate-600 px-5 font-semibold text-white transition-colors duration-150 hover:border-slate-400",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              )}
            >
              Lead sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t-2 border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[15px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Built at the Grok Bot Community Engineering London Hackathon, 22 Oct 2026 · MIT · All applicant data shown is
            fictional
          </p>
          <a href={REPO_URL} className={clsx("inline-flex items-center gap-2 rounded font-semibold text-slate-700 hover:text-slate-950", focusRing)}>
            <GitHubMark className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
