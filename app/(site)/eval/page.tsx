import type { Metadata } from "next";
import clsx from "clsx";
import { AlertTriangle, Ban, FlaskConical, ShieldCheck, Trophy } from "lucide-react";
import { Card, DecisionPill, asDecision, type Decision } from "@/components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BENCHMARK } from "@/lib/ui/benchmark";
import evalResults from "@/data/eval_results.json";

export const metadata: Metadata = { title: "Eval" };

type ModelStats = {
  accuracy: number;
  confusion_matrix: Record<Decision, Record<Decision, number>>;
  false_blocks: number;
  missed_scammers: number;
  mean_latency_ms: number;
  cost_usd: number;
};

type ApplicantRow = {
  id: string;
  expected: string;
} & Record<string, unknown>;

type Verdict = { verdict?: string; score?: number; reason?: string };

const N = BENCHMARK.testSetSize;
const DECISIONS: Decision[] = ["accept", "ask", "decline"];

const models = Object.entries(evalResults.models as Record<string, ModelStats>)
  .map(([id, stats]) => ({
    id,
    stats,
    correct: Math.round(stats.accuracy * N),
    named: BENCHMARK.models.find((m) => m.id === id) ?? null,
  }))
  .sort((a, b) => b.correct - a.correct || a.stats.cost_usd - b.stats.cost_usd);

const top = models[0];

const mismatches = BENCHMARK.models
  .map((m) => ({ m, row: models.find((r) => r.id === m.id) }))
  .filter(({ m, row }) => !row || row.correct !== m.correct);

function splitId(id: string) {
  const i = id.indexOf("/");
  return i === -1 ? { provider: "", model: id } : { provider: id.slice(0, i), model: id.slice(i + 1) };
}

function formatLatency(ms: number) {
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatCost(usd: number) {
  return `$${usd < 0.1 ? usd.toFixed(4) : usd.toFixed(3)}`;
}

function CountCell({ value }: { value: number }) {
  return (
    <span className={clsx("font-display text-2xl leading-none tabular-nums", value === 0 ? "text-emerald-700" : "text-rose-700")}>
      {value}
    </span>
  );
}

function HeroStat({
  label,
  value,
  of,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: number;
  of?: number;
  hint: string;
  tone?: "good" | "bad";
  icon?: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl p-6">
      <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
        {label}
      </div>
      <div
        className={clsx(
          "mt-4 font-display text-6xl leading-none tabular-nums md:text-7xl",
          tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : "text-foreground"
        )}
      >
        {value}
        {of !== undefined ? <span className="text-3xl text-muted-foreground">/{of}</span> : null}
      </div>
      <div className="mt-3 text-[14px] text-muted-foreground">{hint}</div>
    </Card>
  );
}

export default function EvalPage() {
  const [luna, jev] = BENCHMARK.models;
  const topMisses = top
    ? (evalResults.applicants as ApplicantRow[])
        .map((a) => ({ id: a.id, expected: asDecision(a.expected), got: (a[top.id] ?? {}) as Verdict }))
        .filter((r) => r.expected && r.got.verdict !== r.expected)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="pb-10">
        <div className="mb-4 flex items-center gap-2 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
          <FlaskConical className="h-4 w-4" aria-hidden />
          Scorer benchmark
        </div>
        <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl">
          How the scorer <em className="font-display italic">scores</em>
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
          Every candidate scoring model, run against the same {BENCHMARK.testSetLabel} with known right answers.
        </p>
      </div>

      {/* Headline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeroStat label={luna.name} icon={<Trophy aria-hidden />} value={luna.correct} of={N} hint="correct decisions" />
        <HeroStat label={jev.name} value={jev.correct} of={N} hint="correct decisions" />
        <HeroStat
          label="False blocks"
          icon={<ShieldCheck aria-hidden />}
          tone={BENCHMARK.falseBlocks === 0 ? "good" : "bad"}
          value={BENCHMARK.falseBlocks}
          hint="good applicants declined"
        />
        <HeroStat
          label="Missed scammers"
          icon={<Ban aria-hidden />}
          tone={BENCHMARK.missedScammers === 0 ? "good" : "bad"}
          value={BENCHMARK.missedScammers}
          hint="scammers accepted"
        />
      </div>

      {mismatches.length > 0 ? (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-[15px]">
            Headline numbers don&apos;t match the eval data for {mismatches.map(({ m }) => m.name).join(", ")}. Update{" "}
            <code className="font-mono text-[14px]">lib/ui/benchmark.ts</code>.
          </p>
        </div>
      ) : null}

      {/* Model table */}
      <Card as="section" className="mt-12 overflow-hidden rounded-3xl">
        <div className="px-6 pb-4 pt-6 sm:px-8">
          <h2 className="font-display text-3xl text-foreground">All models</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Sorted by correct decisions, then cost. Zero false blocks and zero missed scammers are what matter most.
          </p>
        </div>
        <Table className="min-w-[760px] text-[15px]">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-10 pl-6 text-[12px] font-medium uppercase tracking-wider sm:pl-8">Model</TableHead>
              <TableHead className="h-10 w-[28%] text-[12px] font-medium uppercase tracking-wider">Accuracy</TableHead>
              <TableHead className="h-10 text-right text-[12px] font-medium uppercase tracking-wider">Correct</TableHead>
              <TableHead className="h-10 text-right text-[12px] font-medium uppercase tracking-wider">False blocks</TableHead>
              <TableHead className="h-10 text-right text-[12px] font-medium uppercase tracking-wider">Missed scammers</TableHead>
              <TableHead className="h-10 text-right text-[12px] font-medium uppercase tracking-wider">Latency</TableHead>
              <TableHead className="h-10 pr-6 text-right text-[12px] font-medium uppercase tracking-wider sm:pr-8">Cost (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((row, i) => {
              const { provider, model } = splitId(row.id);
              const pct = row.stats.accuracy * 100;
              return (
                <TableRow key={row.id} className={clsx("border-border/70", i === 0 && "bg-muted/60 hover:bg-muted")}>
                  <TableCell className="py-4 pl-6 sm:pl-8">
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap font-medium text-foreground">{row.named?.name ?? model}</span>
                      {i === 0 ? (
                        <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-background">
                          Top
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 whitespace-nowrap font-mono text-[12px] text-muted-foreground">
                      {provider ? `${provider}/` : ""}
                      {model}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`Accuracy ${pct.toFixed(1)} percent`}
                      >
                        <div
                          className={clsx("h-full rounded-full", i === 0 ? "bg-foreground" : "bg-foreground/35")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 text-right tabular-nums text-foreground">{pct.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right tabular-nums text-foreground">
                    <span className="font-display text-2xl leading-none">{row.correct}</span>
                    <span className="text-muted-foreground">/{N}</span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <CountCell value={row.stats.false_blocks} />
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <CountCell value={row.stats.missed_scammers} />
                  </TableCell>
                  <TableCell className="py-4 text-right tabular-nums text-foreground/80">{formatLatency(row.stats.mean_latency_ms)}</TableCell>
                  <TableCell className="py-4 pr-6 text-right font-mono text-[13px] tabular-nums text-foreground/80 sm:pr-8">
                    {formatCost(row.stats.cost_usd)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Confusion matrix for the top model */}
      {top ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card as="section" className="rounded-3xl p-6 sm:p-8">
            <h2 className="font-display text-3xl text-foreground">
              Confusion <em className="font-display italic">matrix</em>
            </h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {top.named?.name ?? splitId(top.id).model}. Rows are the right answer, columns are what the model decided.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[320px] border-separate border-spacing-2 text-center">
                <thead>
                  <tr>
                    <th scope="col" className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Actual ↓ / Got →
                    </th>
                    {DECISIONS.map((d) => (
                      <th key={d} scope="col" className="pb-1">
                        <DecisionPill decision={d} size="sm" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DECISIONS.map((actual) => (
                    <tr key={actual}>
                      <th scope="row" className="pr-2 text-left">
                        <DecisionPill decision={actual} size="sm" />
                      </th>
                      {DECISIONS.map((got) => {
                        const v = top.stats.confusion_matrix[actual]?.[got] ?? 0;
                        const diag = actual === got;
                        return (
                          <td
                            key={got}
                            className={clsx(
                              "h-16 rounded-2xl border font-display text-3xl tabular-nums",
                              diag
                                ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                                : v > 0
                                  ? "border-rose-200 bg-rose-50/70 text-rose-700"
                                  : "border-border bg-muted/50 text-muted-foreground"
                            )}
                          >
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card as="section" className="rounded-3xl p-6 sm:p-8">
            <h2 className="font-display text-3xl text-foreground">
              Where it <em className="font-display italic">disagreed</em>
            </h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {topMisses.length === 0
                ? "No disagreements on this test set."
                : `${topMisses.length} of ${N} applicants. A lead still reviews every decline and ask.`}
            </p>
            <ul className="mt-6 divide-y divide-border">
              {topMisses.map((m) => {
                const got = asDecision(m.got.verdict);
                return (
                  <li key={m.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2 text-[14px]">
                      <span className="font-mono font-medium text-foreground">{m.id}</span>
                      <span className="text-muted-foreground">expected</span>
                      {m.expected ? <DecisionPill decision={m.expected} size="sm" /> : null}
                      <span className="text-muted-foreground">got</span>
                      {got ? <DecisionPill decision={got} size="sm" /> : <span className="font-medium">—</span>}
                      {typeof m.got.score === "number" ? (
                        <span className="tabular-nums text-muted-foreground">· score {m.got.score}</span>
                      ) : null}
                    </div>
                    {m.got.reason ? <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">{m.got.reason}</p> : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      ) : null}

      <p className="mt-12 border-t border-border pt-6 text-[14px] text-muted-foreground">
        Test set: {BENCHMARK.testSetLabel}. No real applicant data.
      </p>
    </div>
  );
}
