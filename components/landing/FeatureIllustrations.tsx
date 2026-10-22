import { ArrowDown, CornerDownLeft, FileText, Fingerprint, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Clean JSX illustrations for the landing feature rows. Everything shown is
 * fictional demo data and is labelled as such. No phone numbers anywhere.
 */

function Frame({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-muted/40 p-5 sm:p-8",
        "bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:20px_20px]",
        className
      )}
    >
      <figcaption className="sr-only">{label}</figcaption>
      <span className="absolute right-4 top-4 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Demo data
      </span>
      <div aria-hidden>{children}</div>
    </figure>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-[0_12px_32px_-18px_rgba(0,0,0,0.25)]", className)}>
      {children}
    </div>
  );
}

/* (1) Intake: WhatsApp chat + web form, both into one queue */
export function IntakeIllustration() {
  return (
    <Frame label="Demo data: a WhatsApp conversation and a web form both flow into one review queue.">
      <div className="mt-6 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3 sm:gap-4">
        {/* Phone */}
        <Card className="row-span-2 p-3 sm:p-4">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">Hack Nights intake</p>
              <p className="text-[11px] text-muted-foreground">WhatsApp</p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-[13px] leading-snug">
            <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-emerald-50 px-3 py-2 text-foreground ring-1 ring-emerald-200">
              Hi! I&apos;d like to join Friday&apos;s hack night.
            </p>
            <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-foreground">
              Thanks! What are you building?
            </p>
            <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-emerald-50 px-3 py-2 text-foreground ring-1 ring-emerald-200">
              A voice agent for GP bookings.
            </p>
          </div>
        </Card>

        {/* Web form */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Web form
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-3/4 rounded-full bg-muted" />
            <div className="h-6 rounded-lg border border-border" />
            <div className="h-2 w-1/2 rounded-full bg-muted" />
            <div className="h-6 rounded-lg border border-border" />
          </div>
        </Card>

      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <ArrowDown className="h-4 w-4 text-muted-foreground" />
        <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[14px] text-background">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          One queue
        </span>
      </div>
    </Frame>
  );
}

/* (2) Blocklist: two communities linked by a keyed hash, never a phone number */
export function BlocklistIllustration() {
  return (
    <Frame label="Demo data: London Agent Builders confirmed a scammer. When they apply to South London Hack Nights, the hash hmac:3f9a… matches. No phone number is shared.">
      <div className="mt-8 flex flex-col items-stretch gap-0 sm:flex-row sm:items-center">
        <Card className="p-4 sm:w-[38%]">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Confirmed in</p>
          <p className="mt-1 font-display text-xl leading-tight text-foreground">London Agent Builders</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] text-rose-700 ring-1 ring-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            Reported scam
          </span>
        </Card>

        {/* Connector */}
        <div className="relative flex flex-1 items-center justify-center py-6 sm:py-0">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l border-dashed border-foreground/30 sm:left-0 sm:top-1/2 sm:h-px sm:w-full sm:-translate-y-1/2 sm:translate-x-0 sm:border-l-0 sm:border-t" />
          <div className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
            <span className="flex items-center gap-1.5 font-mono text-[13px] text-foreground">
              <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
              hmac:3f9a…
            </span>
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white">
              Match
            </span>
          </div>
        </div>

        <Card className="p-4 sm:w-[38%]">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Applying to</p>
          <p className="mt-1 font-display text-xl leading-tight text-foreground">South London Hack Nights</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] text-orange-800 ring-1 ring-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Held for a lead
          </span>
        </Card>
      </div>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">Only the hash prefix travels. Never the phone number.</p>
    </Frame>
  );
}

/* (3) Queue: mini queue card with A / S / D and Enter */
const KEYS = [
  { k: "A", label: "Accept", cls: "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-[inset_0_-3px_0_theme(colors.emerald.200)]" },
  { k: "S", label: "Ask", cls: "border-orange-300 bg-orange-50 text-orange-800 shadow-[inset_0_-3px_0_theme(colors.orange.200)]" },
  { k: "D", label: "Decline", cls: "border-rose-300 bg-rose-50 text-rose-800 shadow-[inset_0_-3px_0_theme(colors.rose.200)]" },
] as const;

export function QueueIllustration() {
  return (
    <Frame label="Demo data: a review queue with three fictional applicants and the keyboard shortcuts A to accept, S to ask, D to decline and Enter to send.">
      <Card className="mt-6 overflow-hidden">
        {[
          { h: "@priya_builds", d: "Accept", c: "bg-emerald-600", sel: true },
          { h: "@tomas.dev", d: "Ask", c: "bg-orange-500", sel: false },
          { h: "@cryptomax_alpha1", d: "Decline", c: "bg-rose-600", sel: false },
        ].map((r) => (
          <div
            key={r.h}
            className={cn(
              "flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0",
              r.sel && "bg-muted/60"
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", r.c)} />
              <span className="truncate font-mono text-[13px] text-foreground">{r.h}</span>
            </span>
            <span className="shrink-0 text-[12px] text-muted-foreground">Suggested: {r.d}</span>
          </div>
        ))}
      </Card>
      <div className="mt-6 flex flex-wrap items-end justify-center gap-2.5 sm:gap-3">
        {KEYS.map(({ k, label, cls }) => (
          <div key={k} className="flex flex-col items-center gap-1.5">
            <span className={cn("grid h-12 w-12 place-items-center rounded-xl border font-mono text-lg sm:h-14 sm:w-14", cls)}>
              {k}
            </span>
            <span className="text-[12px] text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex h-12 items-center gap-1.5 rounded-xl border border-border bg-card px-4 font-mono text-[14px] text-foreground shadow-[inset_0_-3px_0_hsl(var(--border))] sm:h-14">
            Enter
            <CornerDownLeft className="h-4 w-4" />
          </span>
          <span className="text-[12px] text-muted-foreground">Send</span>
        </div>
      </div>
    </Frame>
  );
}
