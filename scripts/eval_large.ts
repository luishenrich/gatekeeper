import { readFileSync, writeFileSync } from "node:fs";
import { scoreApplication, PROMPT_VERSION } from "../lib/scorer";
const SLUGS: Record<number, string> = { 1: "london-agent-builders", 2: "south-london-hack-nights" };
const FILE = process.env.APPLICANTS!; const RULES = process.env.RULES!; const OUT = process.env.OUT!;
const N = Number(process.env.EVAL_CONCURRENCY || 5);
const model = process.env.SCORER_MODEL!;
async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>) { const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const rules = readFileSync(RULES, "utf8"); const apps: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const t0 = Date.now();
  const res = await pool(apps, N, async (a) => {
    const app = { name: a.name, handle: a.handle, phone: a.phone, email: a.email, github: a.github, linkedin: a.linkedin, text: a.application_text, community_slug: SLUGS[a.community_applied] };
    let err: any;
    for (let t = 0; t < 3; t++) {
      try { const r = await scoreApplication(rules, app); process.stderr.write(`${a.id} ${a.expected_decision}->${r.verdict} ${r.meta.latency_ms}ms\n`);
        return { id: a.id, category: a.category, community: a.community_applied, source: a.source, expected: a.expected_decision, verdict: r.verdict, score: r.score, reasons: r.reasons, rule_refs: r.rule_refs, latency_ms: r.meta.latency_ms, usage: r.meta.usage ?? null, served_model: r.meta.model, error: null };
      } catch (e: any) { err = e; if (e?.status === 429 || (e?.status ?? 0) >= 500) { await sleep(3000 * (t + 1)); continue; } break; }
    }
    process.stderr.write(`${a.id} ERROR ${String(err?.message).slice(0, 200)}\n`);
    return { id: a.id, category: a.category, community: a.community_applied, source: a.source, expected: a.expected_decision, verdict: null, error: String(err?.message ?? err).slice(0, 300) } as any;
  });
  const wall = Date.now() - t0;
  const ok = res.filter((r) => !r.error);
  const L = ["accept", "ask", "decline"]; const cm: any = {}; for (const e of L) { cm[e] = {}; for (const p of L) cm[e][p] = 0; }
  ok.forEach((r) => cm[r.expected][r.verdict]++);
  const cats: any = {}; for (const r of ok) { const k = r.category + (r.source !== "synthetic" ? "" : ""); cats[k] ??= { n: 0, correct: 0 }; cats[k].n++; if (r.verdict === r.expected) cats[k].correct++; }
  const bySource: any = {}; for (const r of ok.filter((r) => r.expected === "decline")) { bySource[r.source] ??= { n: 0, declined: 0 }; bySource[r.source].n++; if (r.verdict === "decline") bySource[r.source].declined++; }
  const lat = ok.map((r) => r.latency_ms).sort((a, b) => a - b); const q = (p: number) => lat[Math.min(lat.length - 1, Math.floor(p * lat.length))];
  const costs = ok.map((r) => r.usage?.cost).filter((c) => typeof c === "number");
  const fb = ok.filter((r) => r.expected !== "decline" && r.verdict === "decline");
  const missed = ok.filter((r) => r.expected === "decline" && r.verdict !== "decline");
  const summary = { model, prompt_version: PROMPT_VERSION, served_models: [...new Set(ok.map((r) => r.served_model))], n: res.length, scored: ok.length, errors: res.length - ok.length,
    accuracy_over_scored: ok.length ? ok.filter((r) => r.verdict === r.expected).length / ok.length : null, correct: ok.filter((r) => r.verdict === r.expected).length,
    confusion_rows_expected_cols_predicted: cm, per_category: cats, decline_recall_by_source: bySource,
    false_blocks: { count: fb.length, ids: fb.map((r) => `${r.id}(${r.category})`) },
    missed_scammers_not_declined: { count: missed.length, accepted: missed.filter((r) => r.verdict === "accept").length, asked: missed.filter((r) => r.verdict === "ask").length, ids: missed.map((r) => `${r.id}->${r.verdict}`) },
    ask_rate: ok.length ? ok.filter((r) => r.verdict === "ask").length / ok.length : null,
    latency_ms: { mean: lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null, p50: q(0.5), p95: q(0.95) }, wall_ms: wall, concurrency: N,
    cost_usd_total: costs.length ? Number(costs.reduce((a, b) => a + b, 0).toFixed(6)) : null, cost_reported_for: costs.length,
    tokens: { prompt: ok.reduce((s, r) => s + (r.usage?.prompt_tokens || 0), 0), completion: ok.reduce((s, r) => s + (r.usage?.completion_tokens || 0), 0) },
    error_messages: [...new Set(res.filter((r) => r.error).map((r) => r.error))].slice(0, 5) };
  writeFileSync(OUT, JSON.stringify({ summary, results: res }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
}
main().catch((e) => { console.error(e?.message); process.exit(1); });
