import clsx from "clsx";
import { Check, Minus, X } from "lucide-react";

type Cell = "yes" | "no" | "partial";

const TOOLS = ["Gatekeeper", "Combot CAS", "Mjolnir / Draupnir", "Discord FedBot"] as const;

// Conservative, based on each project's public docs. When unsure we say "Partial" or "No".
const ROWS: { label: string; hint?: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  {
    label: "Screens at application time, before anyone joins",
    cells: ["yes", "no", "no", "no"],
  },
  {
    label: "Explains each decision with the community rule it used",
    cells: ["yes", "no", "no", "no"],
  },
  {
    label: "Blocklist shared across communities",
    cells: ["yes", "yes", "yes", "yes"],
  },
  {
    label: "Shares only keyed hashes, never raw phone or handle",
    hint: "HMAC-SHA256 with a server secret",
    cells: ["yes", "no", "partial", "no"],
  },
  {
    label: "A human confirms every decline",
    cells: ["yes", "no", "partial", "partial"],
  },
  {
    label: "Web, WhatsApp and Discord in one queue",
    hint: "WhatsApp intake, Discord join check",
    cells: ["yes", "no", "no", "no"],
  },
  {
    label: "Open source, self-hostable",
    cells: ["yes", "no", "yes", "partial"],
  },
];

const CELL: Record<Cell, { Icon: typeof Check; word: string; cls: string }> = {
  yes: { Icon: Check, word: "Yes", cls: "text-emerald-800 [&_svg]:bg-emerald-100 [&_svg]:text-emerald-700" },
  no: { Icon: X, word: "No", cls: "text-slate-600 [&_svg]:bg-slate-100 [&_svg]:text-slate-500" },
  partial: { Icon: Minus, word: "Partial", cls: "text-amber-900 [&_svg]:bg-amber-100 [&_svg]:text-amber-700" },
};

function CellMark({ value }: { value: Cell }) {
  const { Icon, word, cls } = CELL[value];
  return (
    <span className={clsx("inline-flex items-center gap-2 text-[15px] font-semibold", cls)}>
      <Icon className="h-6 w-6 shrink-0 rounded-full p-1" aria-hidden strokeWidth={3} />
      {word}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">Gatekeeper compared with other community moderation tools</caption>
        <thead>
          <tr className="border-b-2 border-slate-200 bg-slate-50">
            <th scope="col" className="w-[36%] px-5 py-4 text-[14px] font-bold uppercase tracking-wide text-slate-600">
              Capability
            </th>
            {TOOLS.map((t, i) => (
              <th
                key={t}
                scope="col"
                className={clsx(
                  "px-5 py-4 text-[15px] font-bold",
                  i === 0 ? "bg-slate-900 text-white" : "text-slate-900"
                )}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-slate-100">
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="px-5 py-4 align-top font-semibold text-slate-900">
                {row.label}
                {row.hint ? <span className="mt-0.5 block text-[14px] font-normal text-slate-600">{row.hint}</span> : null}
              </th>
              {row.cells.map((c, i) => (
                <td key={TOOLS[i]} className={clsx("px-5 py-4 align-top", i === 0 && "bg-slate-50")}>
                  <CellMark value={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
