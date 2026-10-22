import type { ReactNode } from "react";

// Minimal renderer for the rules_md subset we store: headings, numbered and
// bulleted lists, paragraphs, rules, **bold** and *italic*. No raw HTML.

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyPrefix}-${i++}`} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      out.push(<em key={`${keyPrefix}-${i++}`}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "h1" | "h2" | "p"; text: string }
  | { kind: "ol" | "ul"; items: { n?: number; text: string }[] }
  | { kind: "hr" };

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of md.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const ol = line.match(/^\s*(\d+)\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const prev = blocks[blocks.length - 1];
    if (line.startsWith("## ")) blocks.push({ kind: "h2", text: line.slice(3) });
    else if (line.startsWith("# ")) blocks.push({ kind: "h1", text: line.slice(2) });
    else if (/^-{3,}$/.test(line.trim())) blocks.push({ kind: "hr" });
    else if (ol) {
      if (prev?.kind === "ol") prev.items.push({ n: Number(ol[1]), text: ol[2] });
      else blocks.push({ kind: "ol", items: [{ n: Number(ol[1]), text: ol[2] }] });
    } else if (ul) {
      if (prev?.kind === "ul") prev.items.push({ text: ul[1] });
      else blocks.push({ kind: "ul", items: [{ text: ul[1] }] });
    } else if (prev?.kind === "p") prev.text += ` ${line.trim()}`;
    else blocks.push({ kind: "p", text: line.trim() });
  }
  return blocks;
}

export function RulesMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-foreground/85">
      {parse(markdown).map((b, i) => {
        const k = `b${i}`;
        switch (b.kind) {
          case "h1":
            return null; // the page header already shows the community name
          case "h2":
            return (
              <h2 key={k} className="pt-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                {inline(b.text, k)}
              </h2>
            );
          case "hr":
            return <hr key={k} className="border-border" />;
          case "ol":
            return (
              <ol key={k} className="space-y-2.5">
                {b.items.map((it, j) => (
                  <li key={j} id={it.n ? `rule-${it.n}` : undefined} className="flex scroll-mt-20 gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-[12px] font-medium tabular-nums text-background">
                      {it.n}
                    </span>
                    <span>{inline(it.text, `${k}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={k} className="space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" aria-hidden />
                    <span>{inline(it.text, `${k}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          default:
            return <p key={k}>{inline(b.text, k)}</p>;
        }
      })}
    </div>
  );
}
