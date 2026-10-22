"use client";

import { useState } from "react";
import evalResults from "@/data/eval_results.json";

export default function EvalPage() {
  const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-6-luna");

  const models = Object.entries(evalResults.models);
  const applicants = evalResults.applicants;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Scorer Evaluation Results</h1>
        
        <section className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">Model Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Model</th>
                  <th className="text-right py-2 px-4">Accuracy</th>
                  <th className="text-right py-2 px-4">False Blocks</th>
                  <th className="text-right py-2 px-4">Missed Scammers</th>
                  <th className="text-right py-2 px-4">Mean Latency (ms)</th>
                  <th className="text-right py-2 px-4">Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {models.map(([modelName, stats]) => (
                  <tr 
                    key={modelName} 
                    className={`border-b hover:bg-gray-50 cursor-pointer ${selectedModel === modelName ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedModel(modelName)}
                  >
                    <td className="py-2 px-4 font-medium">{modelName}</td>
                    <td className="text-right py-2 px-4">{(stats.accuracy * 100).toFixed(1)}%</td>
                    <td className="text-right py-2 px-4">{stats.false_blocks}</td>
                    <td className="text-right py-2 px-4">{stats.missed_scammers}</td>
                    <td className="text-right py-2 px-4">{stats.mean_latency_ms.toFixed(0)}</td>
                    <td className="text-right py-2 px-4">${stats.cost_usd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Confusion Matrix: {selectedModel}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr>
                  <th className="py-2 px-4 border"></th>
                  <th colSpan={3} className="py-2 px-4 border bg-gray-100">Predicted</th>
                </tr>
                <tr>
                  <th className="py-2 px-4 border">Actual</th>
                  <th className="py-2 px-4 border">Accept</th>
                  <th className="py-2 px-4 border">Ask</th>
                  <th className="py-2 px-4 border">Decline</th>
                </tr>
              </thead>
              <tbody>
                {['accept', 'ask', 'decline'].map((actual) => {
                  const row = (evalResults.models as any)[selectedModel].confusion_matrix[actual];
                  return (
                    <tr key={actual}>
                      <td className="py-2 px-4 border font-medium capitalize bg-gray-100">{actual}</td>
                      <td className="py-2 px-4 border">{row.accept}</td>
                      <td className="py-2 px-4 border">{row.ask}</td>
                      <td className="py-2 px-4 border">{row.decline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">
            Per-Applicant Results: {selectedModel}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">ID</th>
                  <th className="text-left py-2 px-2">Expected</th>
                  <th className="text-left py-2 px-2">Got</th>
                  <th className="text-right py-2 px-2">Score</th>
                  <th className="text-left py-2 px-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((app: any) => {
                  const result = app[selectedModel];
                  const isCorrect = app.expected === result.verdict;
                  return (
                    <tr 
                      key={app.id} 
                      className={`border-b ${!isCorrect ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-2 px-2 font-medium">{app.id}</td>
                      <td className="py-2 px-2 capitalize">{app.expected}</td>
                      <td className={`py-2 px-2 capitalize ${!isCorrect ? 'text-red-600 font-semibold' : ''}`}>
                        {result.verdict}
                      </td>
                      <td className="text-right py-2 px-2">{result.score}</td>
                      <td className="py-2 px-4 text-xs text-gray-700">{result.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 text-sm text-gray-600">
          <p><strong>Test set:</strong> 30 applicants (12 accept, 8 ask, 10 decline)</p>
          <p><strong>Recommended model:</strong> openai/gpt-6-luna (29/30 accuracy, 0 false blocks, 0 missed scammers)</p>
          <p><strong>Current default:</strong> typesafe/jev-router (28/30 accuracy, fallback for cost/latency)</p>
        </div>
      </div>
    </div>
  );
}
