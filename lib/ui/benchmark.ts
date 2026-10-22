import raw from "@/data/eval_results.json";

type ModelKey = "openai/gpt-6-luna" | "typesafe/jev-router";

function correctOf(modelKey: ModelKey): number {
  let correct = 0;
  for (const applicant of raw.applicants) {
    if (applicant[modelKey].verdict === applicant.expected) correct += 1;
  }
  return correct;
}

const n = raw.applicants.length;
const lunaCorrect = correctOf("openai/gpt-6-luna");
const jevCorrect = correctOf("typesafe/jev-router");
const luna = raw.models["openai/gpt-6-luna"];

/**
 * Landing benchmark figures from data/eval_results.json.
 * Ratios are per-applicant verdicts against `expected`.
 * falseBlocks and missedScammers are openai/gpt-6-luna's counts;
 * typesafe/jev-router reports the same zeros in that file.
 */
export const BENCHMARK = {
  luna: `${lunaCorrect}/${n}`,
  "jev-router": `${jevCorrect}/${n}`,
  falseBlocks: luna.false_blocks,
  missedScammers: luna.missed_scammers,
  n,
} as const;
