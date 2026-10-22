"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CopyCode({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-[#111111] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </span>
          <span className="font-mono text-[13px] text-white/70">{label}</span>
        </span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] text-white/85 transition-colors hover:bg-white/10 hover:text-white motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[14px] leading-relaxed text-white/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}
