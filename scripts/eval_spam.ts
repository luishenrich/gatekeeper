import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { classifySpamText } from "../lib/spam-classifier";

function evalSpam() {
  if (!existsSync("data/sms_spam.local.json")) {
    console.error("data/sms_spam.local.json not found. Run: npx tsx scripts/fetch_sms_spam.ts");
    process.exit(1);
  }

  const rows: any[] = JSON.parse(readFileSync("data/sms_spam.local.json", "utf8"));
  let tp = 0, fp = 0, tn = 0, fn = 0;

  const threshold = 0.5;

  for (const row of rows) {
    const text = row.row?.sms ?? "";
    const label = row.row?.label ?? "";
    const isSpam = label === "spam";
    const result = classifySpamText(text);
    const predicted = result.score >= threshold;

    if (isSpam && predicted) tp++;
    else if (isSpam && !predicted) fn++;
    else if (!isSpam && predicted) fp++;
    else tn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  const results = {
    dataset: "ucirvine/sms_spam",
    n: rows.length,
    threshold,
    tp, fp, tn, fn,
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    f1: Number(f1.toFixed(3)),
  };

  console.log(`\nSpam Classifier Evaluation (threshold ${threshold}):`);
  console.log(`Dataset: ${results.dataset} (${results.n} messages)`);
  console.log(`TP: ${tp}  FP: ${fp}  TN: ${tn}  FN: ${fn}`);
  console.log(`Precision: ${results.precision}  Recall: ${results.recall}  F1: ${results.f1}`);

  writeFileSync("data/eval_spam_results.json", JSON.stringify(results, null, 2));
  console.log(`\nSaved results to data/eval_spam_results.json`);
}

evalSpam();
