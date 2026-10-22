"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui";

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
    <div className="overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <span className="font-mono text-[14px] text-slate-300">{label}</span>
        <button
          type="button"
          onClick={copy}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[14px] font-semibold text-slate-200 hover:bg-slate-800 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          )}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[15px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
