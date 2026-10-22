import "server-only";
import large from "@/data/eval_large_results.json";

// The only benchmark numbers the UI may show, computed from the 200-applicant
// eval (data/eval_large_results.json). Server-only: pass the result to client
// components as a prop so the 0.5 MB results file never ships to the browser.

type Summary = {
  n: number;
  correct: number;
  accuracy_over_scored: number;
  false_blocks: { count: number };
  missed_scammers_not_declined: { accepted: number; asked: number };
  cost_usd_total: number;
};
type Run = { summary: Summary; results: { id: string; category: string; expected: string; verdict: string }[] };

export const LARGE_RUNS = (large as unknown as { runs: Record<string, Run> }).runs;

const MODELS = [
  { id: "typesafe/jev-router", name: "Jev" },
  { id: "openai/gpt-6-luna", name: "GPT-6 Luna" },
] as const;

const lead = LARGE_RUNS[MODELS[0].id].summary;

export const BENCHMARK = {
  testSetSize: lead.n,
  testSetLabel: `${lead.n} labelled applicants`,
  models: MODELS.map((m) => ({ id: m.id, name: m.name, correct: LARGE_RUNS[m.id].summary.correct })),
  falseBlocks: lead.false_blocks.count,
  missedScammers: lead.missed_scammers_not_declined.accepted,
};

export type Benchmark = typeof BENCHMARK;
export type BenchmarkModel = Benchmark["models"][number];

export const DATASET_NOTE =
  "200 labelled applicants (80 good fit, 50 borderline, 50 scammers, 10 bots, 10 cross-community repeats). Scammer messages from UCI SMS Spam (CC BY 4.0) and telegram-spam-ham (WTFPL); the rest synthetic.";
