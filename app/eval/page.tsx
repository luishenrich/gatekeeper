export default function Eval() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Eval Dashboard</h1>
      <p className="text-gray-600 mb-4">Run evaluations with:</p>
      <div className="bg-gray-50 p-4 rounded mb-6">
        <p className="font-mono text-sm mb-2">npx tsx scripts/eval.ts</p>
        <p className="text-gray-600 text-sm">
          Scores all 30 applicants and shows accuracy, confusion matrix, false blocks.
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded">
        <p className="font-mono text-sm mb-2">npx tsx scripts/eval_spam.ts</p>
        <p className="text-gray-600 text-sm">
          Evaluates spam_text classifier on SMS spam dataset (requires fetch first).
        </p>
      </div>
      <p className="text-gray-600 mt-4 text-sm">
        Results can be committed as data/eval_results.json and data/eval_spam_results.json
      </p>
    </main>
  );
}
