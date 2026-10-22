import smallRaw from "@/data/eval_results.json";
import largeRaw from "@/data/eval_large_results.json";

type SmallModelKey = "openai/gpt-6-luna" | "typesafe/jev-router";

type LargeSummary = {
  n: number;
  correct: number;
  accuracy_over_scored: number;
  false_blocks: { count: number };
  missed_scammers_not_declined: { accepted: number; asked: number };
  cost_usd_total: number | null;
};

type LargeResult = {
  id: string;
  category: string;
  expected: string;
  verdict: string | null;
};

type LargeRun = { summary: LargeSummary; results: LargeResult[] };

const largeRuns = (largeRaw as { runs: Record<string, LargeRun> }).runs;
const lunaLarge = largeRuns["openai/gpt-6-luna"];
const jevLarge = largeRuns["typesafe/jev-router"];

function correctOf(modelKey: SmallModelKey): number {
  let correct = 0;
  for (const applicant of smallRaw.applicants) {
    if (applicant[modelKey].verdict === applicant.expected) correct += 1;
  }
  return correct;
}

function botsSentToAsk(run: LargeRun): number {
  return run.results.filter(
    (row) => row.category === "bot" && row.expected === "decline" && row.verdict === "ask"
  ).length;
}

function percent(accuracy: number): string {
  return `${(accuracy * 100).toFixed(1)}%`;
}

const n = smallRaw.applicants.length;
const lunaCorrect = correctOf("openai/gpt-6-luna");
const jevCorrect = correctOf("typesafe/jev-router");
const lunaSmall = smallRaw.models["openai/gpt-6-luna"];

const secondary = {
  n,
  luna: `${lunaCorrect}/${n}`,
  "jev-router": `${jevCorrect}/${n}`,
  falseBlocks: lunaSmall.false_blocks,
  missedScammers: lunaSmall.missed_scammers,
} as const;

const primary = {
  n: jevLarge.summary.n,
  "jev-router": {
    ratio: `${jevLarge.summary.correct}/${jevLarge.summary.n}`,
    accuracy: jevLarge.summary.accuracy_over_scored,
    percent: percent(jevLarge.summary.accuracy_over_scored),
    falseBlocks: jevLarge.summary.false_blocks.count,
    scammersAccepted: jevLarge.summary.missed_scammers_not_declined.accepted,
    botsSentToAsk: botsSentToAsk(jevLarge),
    costUsd: jevLarge.summary.cost_usd_total,
  },
  luna: {
    ratio: `${lunaLarge.summary.correct}/${lunaLarge.summary.n}`,
    accuracy: lunaLarge.summary.accuracy_over_scored,
    percent: percent(lunaLarge.summary.accuracy_over_scored),
    falseBlocks: lunaLarge.summary.false_blocks.count,
    scammersAccepted: lunaLarge.summary.missed_scammers_not_declined.accepted,
    sentToAsk: lunaLarge.summary.missed_scammers_not_declined.asked,
  },
} as const;

/**
 * Landing benchmark figures.
 * Top-level fields stay the n=30 set so existing imports keep working.
 * `primary` is the 200-applicant set in data/eval_large_results.json.
 * `secondary` repeats the n=30 set from data/eval_results.json.
 * jev-router's false blocks and missed scammers on the small set are both 0, same as luna.
 */
export const BENCHMARK = {
  luna: secondary.luna,
  "jev-router": secondary["jev-router"],
  falseBlocks: secondary.falseBlocks,
  missedScammers: secondary.missedScammers,
  n: secondary.n,
  primary,
  secondary,
} as const;
