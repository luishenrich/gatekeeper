// The only benchmark numbers the UI may show. Every page reads from here.
// Source: data/eval_results.json (30 fictional applicants). Update here only.
export const BENCHMARK = {
  testSetSize: 30,
  testSetLabel: "30 fictional applicants",
  models: [
    { id: "openai/gpt-6-luna", name: "GPT-6 Luna", correct: 29 },
    { id: "typesafe/jev-router", name: "Jev", correct: 28 },
  ],
  falseBlocks: 0,
  missedScammers: 0,
} as const;

export type BenchmarkModel = (typeof BENCHMARK.models)[number];
