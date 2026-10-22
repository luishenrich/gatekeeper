import { Check, Minus, X } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Cell = "yes" | "no" | "partial";

const TOOLS = ["Greenlight", "Combot CAS", "Mjolnir / Draupnir", "Discord FedBot"] as const;

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
    label: "Web and WhatsApp in one queue",
    hint: "WhatsApp intake and web form",
    cells: ["yes", "no", "no", "no"],
  },
  {
    label: "Open source, self-hostable",
    cells: ["yes", "no", "yes", "partial"],
  },
];

const CELL: Record<Cell, { Icon: typeof Check; word: string; text: string; dot: string }> = {
  yes: { Icon: Check, word: "Yes", text: "text-emerald-800", dot: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  no: { Icon: X, word: "No", text: "text-muted-foreground", dot: "bg-muted text-muted-foreground ring-border" },
  partial: { Icon: Minus, word: "Partial", text: "text-orange-800", dot: "bg-orange-50 text-orange-700 ring-orange-200" },
};

function CellMark({ value }: { value: Cell }) {
  const { Icon, word, text, dot } = CELL[value];
  return (
    <span className={cn("inline-flex items-center gap-2 text-[15px]", text)}>
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1", dot)}>
        <Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
      </span>
      {word}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)]">
      <Table className="min-w-[760px] text-[15px]">
        <TableCaption className="sr-only">Greenlight compared with other community moderation tools</TableCaption>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="h-14 w-[34%] px-5 text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Capability
            </TableHead>
            {TOOLS.map((t, i) => (
              <TableHead
                key={t}
                className={cn(
                  "h-14 px-5 text-[15px] font-medium text-foreground",
                  i === 0 && "bg-emerald-50 font-display text-[19px]"
                )}
              >
                {t}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.label} className="border-border hover:bg-muted/40">
              <TableHead scope="row" className="h-auto px-5 py-4 align-top font-normal text-foreground">
                {row.label}
                {row.hint ? <span className="mt-0.5 block text-[13px] text-muted-foreground">{row.hint}</span> : null}
              </TableHead>
              {row.cells.map((c, i) => (
                <TableCell key={TOOLS[i]} className={cn("px-5 py-4 align-top", i === 0 && "bg-emerald-50/50")}>
                  <CellMark value={c} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
