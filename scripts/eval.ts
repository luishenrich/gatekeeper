import { readFileSync } from "node:fs";
import { scoreApplication, PROMPT_VERSION, type Verdict } from "../lib/scorer";

const DATA = process.cwd() + "/data";
const SLUGS: Record<string, string> = { "1": "london-agent-builders", "2": "south-london-hack-nights" };

function toScorerApplication(row: any) {
  const text = row.application_text ?? row.application?.text ?? row.text;
  const community_slug = row.community_slug ?? SLUGS[String(row.community_applied)];
  if (!text || !community_slug) {
    throw new Error(
      `Applicant ${row.id ?? "?"} is missing application_text or community_applied (got community_applied=${row.community_applied})`,
    );
  }
  return {
    name: row.name,
    handle: row.handle,
    phone: row.phone,
    email: row.email,
    github: row.github,
    linkedin: row.linkedin,
    text,
    community_slug,
  };
}

const LABELS: Verdict[] = ["accept", "ask", "decline"];
const CONCURRENCY = Number(process.env.EVAL_CONCURRENCY || 5);

function parseCsv(s: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x !== "")) rows.push(row); row = []; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const [h, ...rest] = rows;
  return rest.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

const REQUIRED_SCORER_ENV = ["OPENROUTER_API_KEY"];

function missingScorerEnv(): string[] {
  return REQUIRED_SCORER_ENV.filter((name) => !process.env[name]?.trim());
}

async function main() {
  const missing = missingScorerEnv();
  if (missing.length) {
    console.error(
      `Missing environment variable(s) required to call the live scorer: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const model = process.env.SCORER_MODEL || "typesafe/jev-router";
  const rulesMd = readFileSync(`${DATA}/rules.md`, "utf8");
  const applicants: any[] = JSON.parse(readFileSync(`${DATA}/applicants.json`, "utf8"));
  const expected = new Map(parseCsv(readFileSync(`${DATA}/expected_decisions.csv`, "utf8")).map((r) => [r.id, r]));

  const t0 = Date.now();
  const results = await pool(applicants, CONCURRENCY, async (a) => {
    const app = toScorerApplication(a);
    const exp = expected.get(a.id)?.expected_decision as Verdict;
    try {
      const r = await scoreApplication(rulesMd, app);
      process.stderr.write(`${a.id} exp=${exp} got=${r.verdict} ${r.meta.latency_ms}ms\n`);
      return { id: a.id, expected: exp, ...r, error: null as string | null };
    } catch (e: any) {
      process.stderr.write(`${a.id} ERROR ${e?.message}\n`);
      return { id: a.id, expected: exp, verdict: null, score: null, reasons: [], rule_refs: [], meta: null, error: String(e?.message ?? e) };
    }
  });
  const wall = Date.now() - t0;

  const ok = results.filter((r) => !r.error);
  const errors = results.filter((r) => r.error);
  const correct = ok.filter((r) => r.verdict === r.expected).length;
  const cm: Record<string, Record<string, number>> = {};
  for (const e of LABELS) { cm[e] = {}; for (const p of LABELS) cm[e][p] = 0; }
  for (const r of ok) cm[r.expected][r.verdict as Verdict]++;
  const falseBlocks = ok.filter((r) => r.expected !== "decline" && r.verdict === "decline");
  const missed = ok.filter((r) => r.expected === "decline" && r.verdict === "accept");
  const lat = ok.map((r) => r.meta!.latency_ms);
  const meanLat = lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : 0;
  const sum = (k: string) => ok.reduce((s, r: any) => s + (Number(r.meta?.usage?.[k]) || 0), 0);
  const anyCost = ok.some((r: any) => typeof r.meta?.usage?.cost === "number");
  const upstream = ok.reduce((s, r: any) => s + (Number(r.meta?.usage?.cost_details?.upstream_inference_cost) || 0), 0);
  const byok = ok.some((r: any) => r.meta?.usage?.is_byok);

  const summary = {
    model, prompt_version: PROMPT_VERSION, n: results.length, errors: errors.length,
    accuracy: ok.length ? correct / results.length : 0, correct,
    confusion_matrix_rows_expected_cols_predicted: cm,
    false_blocks: falseBlocks.map((r) => r.id), missed_scammers: missed.map((r) => r.id),
    mean_latency_ms: Math.round(meanLat), wall_ms: wall,
    tokens: { prompt: sum("prompt_tokens"), completion: sum("completion_tokens"), total: sum("total_tokens") },
    cost_usd: anyCost ? Number(sum("cost").toFixed(6)) : null,
    upstream_cost_usd: Number(upstream.toFixed(6)), byok,
    misclassified: ok.filter((r) => r.verdict !== r.expected).map((r) => ({ id: r.id, expected: r.expected, got: r.verdict, reason: r.reasons[0] ?? "" })),
    error_messages: [...new Set(errors.map((r) => r.error))],
  };

  console.log(`\nModel: ${model}  Prompt: ${PROMPT_VERSION}`);
  console.log(`Accuracy: ${correct}/${results.length} = ${(summary.accuracy * 100).toFixed(1)}%  (errors: ${errors.length})`);
  console.log("Confusion matrix (rows = expected, cols = predicted):");
  console.log(`            ${LABELS.map((l) => l.padStart(8)).join("")}`);
  for (const e of LABELS) console.log(`  ${e.padEnd(9)} ${LABELS.map((p) => String(cm[e][p]).padStart(8)).join("")}`);
  console.log(`False blocks (expected accept/ask, got decline): ${falseBlocks.length} ${JSON.stringify(summary.false_blocks)}`);
  console.log(`Missed scammers (expected decline, got accept): ${missed.length} ${JSON.stringify(summary.missed_scammers)}`);
  console.log(`Mean latency: ${summary.mean_latency_ms} ms  (wall ${wall} ms, concurrency ${CONCURRENCY})`);
  console.log(`Tokens: ${JSON.stringify(summary.tokens)}  OpenRouter cost: ${summary.cost_usd ?? "n/a"} USD  Upstream cost: ${summary.upstream_cost_usd} USD${byok ? " (BYOK)" : ""}`);
  for (const m of summary.misclassified) console.log(`  MISS ${m.id}: expected ${m.expected}, got ${m.got} — ${m.reason}`);
  if (errors.length) console.log(`Errors: ${JSON.stringify(summary.error_messages)}`);

  console.log(`\nWrite to data/eval_results.json with:`);
  console.log(`echo '${JSON.stringify({ summary, results }, null, 2)}' > data/eval_results.json`);
}

main().catch((e) => { console.error(e?.message ?? e); process.exit(1); });
