import type { Metadata } from "next";
import clsx from "clsx";
import { Ban, FlaskConical, ShieldCheck, Trophy } from "lucide-react";
import { Card } from "@/components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BENCHMARK, DATASET_NOTE, LARGE_RUNS } from "@/lib/ui/benchmark";
import smallEval from "@/data/eval_results.json";

export const metadata: Metadata = { title: "Eval" };

const CATEGORIES = [
  { key: "good_fit", label: "Good fit" },
  { key: "borderline", label: "Borderline" },
  { key: "scammer", label: "Scammers" },
  { key: "bot", label: "Bots" },
] as const;

type LargeSummary = {
  n: number;
  correct: number;
  accuracy_over_scored: number;
  false_blocks: { count: number };
  missed_scammers_not_declined: { accepted: number; asked: number };
  per_category: Record<string, { n: number; correct: number }>;
  latency_ms?: { mean: number };
  cost_usd_total: number;
};

const rows = BENCHMARK.models
  .map((m) => {
    const run = LARGE_RUNS[m.id];
    const s = run.summary as unknown as LargeSummary;
    const wrong = run.results.filter((r) => r.verdict !== r.expected);
    const acceptedByCategory = wrong
      .filter((r) => r.verdict === "accept")
      .reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + 1 }), {});
    const botsToAsk = wrong.filter((r) => r.category === "bot" && r.verdict === "ask").length;
    return { ...m, s, acceptedByCategory, botsToAsk };
  })
  .sort((a, b) => b.s.correct - a.s.correct);

const topId = rows[0]?.id;

function pct(x: number) {
  return `${(x * 100).toFixed(1)}%`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function honestNote(): string {
  const parts = rows.map((r) => {
    const acc = Object.entries(r.acceptedByCategory)
      .map(([cat, n]) => plural(n, cat.replace("_", " ")))
      .join(", ");
    return `${acc || "nothing"} accepted (${r.name})`;
  });
  const bots = rows.filter((r) => r.botsToAsk > 0).map((r) => `${plural(r.botsToAsk, "bot")} went to Ask with ${r.name}`);
  return `Misses went to Ask, never Accept, except ${parts.join(" / ")}${bots.length ? `; ${bots.join("; ")}` : ""}.`;
}

type SmallStats = { accuracy: number; false_blocks: number; missed_scammers: number; mean_latency_ms: number; cost_usd: number };
const SMALL_N = 30;
const smallRows = Object.entries(smallEval.models as Record<string, SmallStats>)
  .map(([id, st]) => ({ id, st, correct: Math.round(st.accuracy * SMALL_N) }))
  .sort((a, b) => b.correct - a.correct);

function Zero({ value }: { value: number }) {
  return <span className={clsx("tabular-nums", value === 0 ? "text-green-700" : "text-red-700")}>{value}</span>;
}

export default function EvalPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
        <FlaskConical className="h-4 w-4" aria-hidden />
        Eval
      </div>
      <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
        How the scorer <em className="font-display italic">scores</em>
      </h1>
      <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-muted-foreground">{DATASET_NOTE}</p>

      {/* Headline cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => (
          <Card key={r.id} className={clsx("p-5", r.id === topId && "border-foreground")}>
            <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-muted-foreground">
              {r.name}
              {r.id === topId ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-background">
                  <Trophy className="h-3 w-3" aria-hidden />
                  Top
                </span>
              ) : null}
            </div>
            <div className="mt-3 font-display text-5xl leading-none tabular-nums">
              {r.s.correct}
              <span className="text-2xl text-muted-foreground">/{r.s.n}</span>
            </div>
            <div className="mt-2 text-[13px] text-muted-foreground">{pct(r.s.accuracy_over_scored)} correct</div>
          </Card>
        ))}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            False blocks
          </div>
          <div className="mt-3 font-display text-5xl leading-none tabular-nums text-green-700">{BENCHMARK.falseBlocks}</div>
          <div className="mt-2 text-[13px] text-muted-foreground">Good applicants declined</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <Ban className="h-4 w-4" aria-hidden />
            Scammers accepted
          </div>
          <div className="mt-3 font-display text-5xl leading-none tabular-nums text-green-700">{BENCHMARK.missedScammers}</div>
          <div className="mt-2 text-[13px] text-muted-foreground">Scammers let straight in</div>
        </Card>
      </div>

      <p className="mt-6 rounded-2xl border border-border bg-muted/50 px-5 py-4 text-[15px] leading-relaxed text-foreground/85">
        {honestNote()}
      </p>

      {/* Main table */}
      <h2 className="mt-14 font-display text-3xl">Results on {BENCHMARK.testSetLabel}</h2>
      <Card className="mt-4 overflow-x-auto rounded-3xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[10rem]">Model</TableHead>
              <TableHead className="min-w-[12rem]">Accuracy</TableHead>
              <TableHead className="text-right">False blocks</TableHead>
              <TableHead className="text-right">Scammers accepted</TableHead>
              <TableHead className="text-right">Scammers → Ask</TableHead>
              {CATEGORIES.map((c) => (
                <TableHead key={c.key} className="whitespace-nowrap text-right">
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="text-right">Mean latency</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="font-mono text-[12px] text-muted-foreground">{r.id}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
                      <div className={clsx("h-full rounded-full", r.id === topId ? "bg-foreground" : "bg-foreground/40")} style={{ width: pct(r.s.accuracy_over_scored) }} />
                    </div>
                    <span className="whitespace-nowrap tabular-nums">
                      {r.s.correct}/{r.s.n} · {pct(r.s.accuracy_over_scored)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Zero value={r.s.false_blocks.count} />
                </TableCell>
                <TableCell className="text-right">
                  <Zero value={r.s.missed_scammers_not_declined.accepted} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.s.missed_scammers_not_declined.asked}</TableCell>
                {CATEGORIES.map((c) => {
                  const pc = r.s.per_category[c.key];
                  return (
                    <TableCell key={c.key} className="whitespace-nowrap text-right tabular-nums">
                      {pc ? `${pc.correct}/${pc.n}` : "—"}
                    </TableCell>
                  );
                })}
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {r.s.latency_ms ? `${(r.s.latency_ms.mean / 1000).toFixed(1)} s` : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {r.s.cost_usd_total > 0 ? `$${r.s.cost_usd_total.toFixed(2)}` : "BYOK"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-3 text-[13px] text-muted-foreground">
        &ldquo;Scammers&rdquo; includes the 10 cross-community repeats. BYOK: billed to our own provider key, so the router reports no cost.
      </p>

      {/* Earlier run, secondary */}
      <section className="mt-16 border-t border-border pt-10" aria-labelledby="earlier-run">
        <h2 id="earlier-run" className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
          Earlier 30-applicant run
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">
          The first, smaller test set (30 fictional applicants). Kept for reference; the 200-applicant results above are the
          benchmark.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <Table className="text-[14px]">
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Correct</TableHead>
                <TableHead className="text-right">False blocks</TableHead>
                <TableHead className="text-right">Missed scammers</TableHead>
                <TableHead className="text-right">Mean latency</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {smallRows.map(({ id, st, correct }) => (
                <TableRow key={id}>
                  <TableCell className="font-mono text-[13px]">{id}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {correct}/{SMALL_N}
                  </TableCell>
                  <TableCell className="text-right">
                    <Zero value={st.false_blocks} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Zero value={st.missed_scammers} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{(st.mean_latency_ms / 1000).toFixed(1)} s</TableCell>
                  <TableCell className="text-right tabular-nums">${st.cost_usd.toFixed(3)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
