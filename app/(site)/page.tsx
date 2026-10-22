import { ArrowRight, Fingerprint, Inbox, Keyboard, ScanSearch } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { CopyCode } from "@/components/landing/CopyCode";
import { GitHubMark } from "@/components/landing/GitHubMark";
import { BlocklistIllustration, IntakeIllustration, QueueIllustration } from "@/components/landing/FeatureIllustrations";
import { HeroQueueDemo } from "@/components/landing/HeroQueueDemo";
import { BENCHMARK } from "@/lib/ui/benchmark";
import { REPO_URL } from "@/lib/ui/communities";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/utils";

const pill = {
  base: "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-medium transition-colors duration-150 ease-out motion-reduce:transition-none",
  ink: "bg-foreground text-background hover:bg-foreground/85",
  outline: "border border-foreground bg-background text-foreground hover:bg-muted",
  ghostDark: "border border-white/70 bg-transparent text-white hover:bg-white/10",
  paper: "border border-border bg-card text-foreground hover:bg-muted",
  white: "bg-white text-foreground hover:bg-white/90",
};

const darkRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60";

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
    body: "Phone, handle and email are hashed with HMAC-SHA256 and matched across communities. Others see a match, never the raw value.",
  },
  {
    Icon: Keyboard,
    title: "A lead decides in one keystroke",
    body: "Blocklist hits come first. Press A, S or D, edit the drafted reply, hit Enter. Declines are never sent automatically.",
  },
] as const;

const SELF_HOST = `git clone ${REPO_URL}
cd gatekeeper && npm install
cp .env.example .env.local
# fill in Supabase keys, BLOCKLIST_HMAC_SECRET,
# OPENROUTER_API_KEY and QUEUE_ADMIN_TOKEN
supabase db push
npm run dev`;

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[13px] font-medium uppercase tracking-[0.16em] text-muted-foreground", className)}>{children}</p>
  );
}

function FeatureRow({
  id,
  eyebrow,
  title,
  body,
  points,
  visual,
  reverse,
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  points: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <article aria-labelledby={id} className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn(reverse && "lg:order-2")}>{visual}</div>
      <div className={cn("max-w-xl", reverse && "lg:order-1")}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 id={id} className="mt-4 font-display text-4xl leading-[1.05] text-foreground sm:text-5xl">
          {title}
        </h3>
        <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">{body}</p>
        <ul className="mt-6 space-y-2.5 text-[16px] text-foreground/85">
          {points.map((p) => (
            <li key={p} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-clip text-[16px] text-foreground">
      {/* ---------- Hero ---------- */}
      <section aria-labelledby="hero-heading" className="px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <a
            href={REPO_URL}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[14px] text-muted-foreground shadow-sm transition-colors hover:text-foreground motion-reduce:transition-none",
              focusRing
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
            Open source · MIT
          </a>
          <h1
            id="hero-heading"
            className="mt-7 font-display text-[3.25rem] leading-[0.95] text-foreground sm:text-7xl md:text-8xl"
          >
            Let builders in. Keep scammers <em className="font-display italic">out</em>.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-muted-foreground sm:text-lg">
            Greenlight scores every application against your community rules, checks a blocklist shared across
            communities by hash, and puts the hard calls in a calm, keyboard-first queue. A lead approves every decline.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/apply" className={cn(pill.base, pill.ink, "w-full sm:w-auto", focusRing)}>
              Try it
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className={cn(pill.base, pill.outline, "w-full sm:w-auto", focusRing)}>
              Lead sign in
            </Link>
          </div>
          <a
            href={REPO_URL}
            className={cn(
              "mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[15px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
              focusRing
            )}
          >
            <GitHubMark className="h-4 w-4" />
            View on GitHub
          </a>
        </div>

        <div className="relative isolate mx-auto mt-14 max-w-6xl overflow-hidden rounded-[2rem] bg-muted shadow-[0_40px_120px_-50px_rgba(0,0,0,0.55)] sm:mt-16">
          <Image
            src="/landing/window.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="-z-10 scale-105 object-cover blur-[2px]"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 via-transparent to-[#111111]/35"
          />
          <div className="px-3 py-8 sm:px-10 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-xl">
              <HeroQueueDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Benchmark strip ---------- */}
      <section aria-labelledby="benchmark-heading" className="border-y border-border bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xs">
            <Eyebrow>
              <span id="benchmark-heading">Benchmark</span>
            </Eyebrow>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Test set of {BENCHMARK.testSetLabel}.{" "}
              <Link
                href="/eval"
                className={cn("rounded text-foreground underline underline-offset-4 hover:text-foreground/70", focusRing)}
              >
                See the eval
              </Link>
            </p>
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4 lg:max-w-3xl">
            {BENCHMARK.models.map((m) => (
              <div key={m.id} className="border-l border-border pl-5">
                <dt className="text-[14px] text-muted-foreground">{m.name}</dt>
                <dd className="mt-1 font-display text-5xl tabular-nums leading-none text-foreground sm:text-6xl">
                  {m.correct}
                  <span className="text-2xl text-muted-foreground sm:text-3xl">/{BENCHMARK.testSetSize}</span>
                </dd>
              </div>
            ))}
            <div className="border-l border-border pl-5">
              <dt className="text-[14px] text-muted-foreground">False blocks</dt>
              <dd className="mt-1 font-display text-5xl tabular-nums leading-none text-foreground sm:text-6xl">
                {BENCHMARK.falseBlocks}
              </dd>
            </div>
            <div className="border-l border-border pl-5">
              <dt className="text-[14px] text-muted-foreground">Missed scammers</dt>
              <dd className="mt-1 font-display text-5xl tabular-nums leading-none text-foreground sm:text-6xl">
                {BENCHMARK.missedScammers}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#111111]">
          <div className="px-5 py-14 sm:px-10 sm:py-20 lg:px-14">
            <div className="max-w-2xl">
              <Eyebrow className="text-white/80">How it works</Eyebrow>
              <h2 id="how-heading" className="mt-4 font-display text-4xl leading-[1.02] text-white sm:text-6xl">
                From application to decision, <em className="font-display italic">in four steps</em>.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-white/80">
                Greenlight does the reading and the cross-checking. Your leads keep the final say.
              </p>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ Icon, title, body }, i) => (
                <li
                  key={title}
                  className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-700">
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="font-display text-2xl italic text-white/80">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl leading-tight text-white">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/80">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Feature rows ---------- */}
      <section aria-labelledby="features-heading" className="px-4 pb-24 sm:px-6 lg:pb-32">
        <div className="mx-auto max-w-6xl">
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <div className="space-y-24 lg:space-y-32">
            <FeatureRow
              id="feat-whatsapp"
              eyebrow="Intake"
              title={
                <>
                  Apply from <em className="font-display italic">WhatsApp</em>.
                </>
              }
              body="People already live in their chats. Applicants message your number, answer a few questions and land in the same queue as web applications. Discord joins are checked against the blocklist too."
              points={[
                "Web form, WhatsApp and Discord in one queue",
                "Questions come from your community's own rules",
                "Replies are drafted for you, never sent without a lead",
              ]}
              visual={<IntakeIllustration />}
            />
            <FeatureRow
              id="feat-blocklist"
              eyebrow="Built for communities"
              title={
                <>
                  One blocklist, <em className="font-display italic">shared</em> by hash.
                </>
              }
              body="When a scammer is confirmed in one community, every community running Greenlight sees the match the next time they apply. What travels is a keyed HMAC-SHA256 hash, never the phone number, handle or evidence."
              points={[
                "Matches show the community and a hash prefix only",
                "The HMAC secret stays on your server",
                "Every report and check is written to an audit log",
              ]}
              visual={<BlocklistIllustration />}
              reverse
            />
            <FeatureRow
              id="feat-queue"
              eyebrow="Human in the loop"
              title={
                <>
                  A queue you can clear <em className="font-display italic">with three keys</em>.
                </>
              }
              body="Blocklist hits rise to the top, each with the signals and the rule behind the suggestion. Accept, ask a follow-up or decline without touching the mouse. Nothing is declined until a lead says so."
              points={[
                "A to accept, S to ask, D to decline, Enter to send",
                "Reasons cite the community rule they came from",
                "Edit any drafted reply before it goes out",
              ]}
              visual={<QueueIllustration />}
            />
          </div>
        </div>
      </section>

      {/* ---------- Comparison ---------- */}
      <section aria-labelledby="compare-heading" className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>Compared</Eyebrow>
            <h2 id="compare-heading" className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
              Built for the moment someone <em className="font-display italic">applies</em>.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
              Ban-list bots act after someone has joined. Greenlight decides before, explains why, and shares only
              hashes.
            </p>
          </div>
          <div className="mt-12">
            <ComparisonTable />
          </div>
          <p className="mt-4 text-[14px] text-muted-foreground">
            Based on public docs, Oct 2026. Partial means the capability exists with limits or depends on configuration.
          </p>
        </div>
      </section>

      {/* ---------- Self-host ---------- */}
      <section aria-labelledby="selfhost-heading" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Self-host · MIT</Eyebrow>
            <h2 id="selfhost-heading" className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
              Run it for <em className="font-display italic">your own</em> community.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
              Next.js and Supabase, deployable to Vercel. Your rules live in your database, the HMAC secret stays on
              your server, and no raw phone number ever enters the blocklist.
            </p>
            <ul className="mt-6 space-y-2.5 text-foreground/85">
              {[
                "Bring your own LLM key via OpenRouter",
                "Mock mode for demos with fixture data",
                "Every report and check written to an audit log",
              ].map((p) => (
                <li key={p} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  {p}
                </li>
              ))}
            </ul>
            <a href={REPO_URL} className={cn(pill.base, pill.paper, "mt-8", focusRing)}>
              <GitHubMark className="h-4 w-4" />
              luishenrich/gatekeeper
            </a>
          </div>
          <CopyCode label="Terminal" code={SELF_HOST} />
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section aria-labelledby="cta-heading" className="px-4 pb-24 sm:px-6">
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#111111] px-6 py-20 text-center sm:px-12 sm:py-28">
          <Image
            src="/landing/texture-books.webp"
            alt=""
            fill
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="-z-10 object-cover"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[#0b0b0b]/[0.72]" />
          <h2
            id="cta-heading"
            className="mx-auto max-w-3xl font-display text-4xl leading-[1.02] text-white sm:text-6xl"
          >
            Watch the shared blocklist <em className="font-display italic">catch a scammer</em>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/80">
            Submit an application as a builder, then as a known scammer. The second one is stopped before they ever join.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/apply" className={cn(pill.base, pill.white, "w-full sm:w-auto", darkRing)}>
              Try it
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className={cn(pill.base, pill.ghostDark, "w-full sm:w-auto", darkRing)}>
              Lead sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
