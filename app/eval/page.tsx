import type { Metadata } from "next";
import clsx from "clsx";
import { AlertTriangle, Ban, FlaskConical, ShieldCheck, Trophy } from "lucide-react";
import { Card, DecisionPill, PageHeader, StatCard, asDecision, type Decision } from "@/components/ui";
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
    <span
      className={clsx(
        "inline-flex min-w-9 items-center justify-center rounded-md px-2 py-0.5 font-bold tabular-nums",
        value === 0 ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/40" : "bg-rose-50 text-rose-800 ring-1 ring-rose-600/50"
      )}
    >
      {value}
    </span>
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <FlaskConical className="h-4 w-4" aria-hidden />
            Scorer benchmark
          </span>
        }
        title="Eval"
        description={`Every candidate scoring model, run against the same ${BENCHMARK.testSetLabel} with known right answers.`}
      />

      {/* Headline */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={luna.name}
          icon={<Trophy className="h-4 w-4" aria-hidden />}
          value={
            <>
              {luna.correct}
              <span className="text-2xl text-slate-600">/{N}</span>
            </>
          }
          hint="correct decisions"
        />
        <StatCard
          label={jev.name}
          value={
            <>
              {jev.correct}
              <span className="text-2xl text-slate-600">/{N}</span>
            </>
          }
          hint="correct decisions"
        />
        <StatCard
          label="False blocks"
          tone={BENCHMARK.falseBlocks === 0 ? "accept" : "decline"}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          value={BENCHMARK.falseBlocks}
          hint="good applicants declined"
        />
        <StatCard
          label="Missed scammers"
          tone={BENCHMARK.missedScammers === 0 ? "accept" : "decline"}
          icon={<Ban className="h-4 w-4" aria-hidden />}
          value={BENCHMARK.missedScammers}
          hint="scammers accepted"
        />
      </div>

      {mismatches.length > 0 ? (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            Headline numbers don&apos;t match the eval data for {mismatches.map(({ m }) => m.name).join(", ")}. Update{" "}
            <code className="font-mono text-[15px]">lib/ui/benchmark.ts</code>.
          </p>
        </div>
      ) : null}

      {/* Model table */}
      <Card as="section" className="mt-10 overflow-hidden">
        <div className="border-b-2 border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900">All models</h2>
          <p className="mt-1 text-[15px] text-slate-600">
            Sorted by correct decisions, then cost. Zero false blocks and zero missed scammers are what matter most.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-[14px] font-semibold uppercase tracking-wide text-slate-600">
                <th scope="col" className="px-5 py-3 sm:px-6">Model</th>
                <th scope="col" className="w-[30%] px-4 py-3">Accuracy</th>
                <th scope="col" className="px-4 py-3 text-right">Correct</th>
                <th scope="col" className="px-4 py-3 text-right">False blocks</th>
                <th scope="col" className="px-4 py-3 text-right">Missed scammers</th>
                <th scope="col" className="px-4 py-3 text-right">Mean latency</th>
                <th scope="col" className="px-5 py-3 text-right sm:px-6">Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {models.map((row, i) => {
                const { provider, model } = splitId(row.id);
                const pct = row.stats.accuracy * 100;
                return (
                  <tr key={row.id} className={clsx("border-b border-slate-200 last:border-b-0", i === 0 && "bg-emerald-50/40")}>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{row.named?.name ?? model}</span>
                        {i === 0 ? (
                          <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide text-white">
                            Top
                          </span>
                        ) : null}
                      </div>
                      <div className="font-mono text-[13px] text-slate-600">
                        {provider ? `${provider}/` : ""}
                        {model}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"
                          role="img"
                          aria-label={`Accuracy ${pct.toFixed(1)} percent`}
                        >
                          <div
                            className={clsx("h-full rounded-full", i === 0 ? "bg-emerald-600" : "bg-slate-700")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right font-semibold tabular-nums text-slate-900">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-bold tabular-nums text-slate-900">
                      {row.correct}
                      <span className="font-semibold text-slate-600">/{N}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <CountCell value={row.stats.false_blocks} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <CountCell value={row.stats.missed_scammers} />
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-slate-900">{formatLatency(row.stats.mean_latency_ms)}</td>
                    <td className="px-5 py-4 text-right font-mono text-[15px] tabular-nums text-slate-900 sm:px-6">
                      {formatCost(row.stats.cost_usd)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confusion matrix for the top model */}
      {top ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card as="section" className="p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Confusion matrix · {top.named?.name ?? splitId(top.id).model}</h2>
            <p className="mt-1 text-[15px] text-slate-600">Rows are the right answer, columns are what the model decided.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[320px] border-separate border-spacing-1.5 text-center">
                <thead>
                  <tr>
                    <th scope="col" className="text-left text-[13px] font-semibold uppercase tracking-wide text-slate-600">
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
                              "h-14 rounded-lg text-2xl font-black tabular-nums",
                              diag
                                ? "bg-emerald-50 text-emerald-800"
                                : v > 0
                                  ? "bg-rose-50 text-rose-800 ring-2 ring-rose-600/50"
                                  : "bg-slate-50 text-slate-400"
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

          <Card as="section" className="p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Where it disagreed</h2>
            <p className="mt-1 text-[15px] text-slate-600">
              {topMisses.length === 0
                ? "No disagreements on this test set."
                : `${topMisses.length} of ${N} applicants. A lead still reviews every decline and ask.`}
            </p>
            <ul className="mt-5 space-y-4">
              {topMisses.map((m) => {
                const got = asDecision(m.got.verdict);
                return (
                  <li key={m.id} className="rounded-xl border-2 border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[15px] font-semibold text-slate-900">{m.id}</span>
                      <span className="text-[15px] text-slate-600">expected</span>
                      {m.expected ? <DecisionPill decision={m.expected} size="sm" /> : null}
                      <span className="text-[15px] text-slate-600">got</span>
                      {got ? <DecisionPill decision={got} size="sm" /> : <span className="font-semibold">—</span>}
                      {typeof m.got.score === "number" ? (
                        <span className="text-[15px] font-semibold tabular-nums text-slate-700">score {m.got.score}</span>
                      ) : null}
                    </div>
                    {m.got.reason ? <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{m.got.reason}</p> : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      ) : null}

      <p className="mt-10 border-t-2 border-slate-200 pt-6 text-[15px] text-slate-600">
        Test set: {BENCHMARK.testSetLabel}. No real applicant data.
      </p>
    </main>
  );
}
