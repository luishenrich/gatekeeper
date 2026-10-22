"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shell/Logo";
import { Button, focusRing } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    console.error(error);
  }, [error]);

  const details = [error.message, error.digest ? `digest: ${error.digest}` : ""].filter(Boolean).join("\n");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main role="alert" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 pb-24 text-center sm:px-8">
        <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Something broke</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-7xl">
          This page hit <em className="font-display italic">a problem</em>
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          Nothing you did is lost. Try again, and if it keeps happening, copy the details below into an issue so we can fix it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset} icon={<RotateCw className="h-4 w-4" aria-hidden />}>
            Try again
          </Button>
          <Link
            href="/"
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-6 text-[16px] font-medium text-foreground transition-colors duration-150 hover:bg-accent",
              focusRing
            )}
          >
            Go home
          </Link>
        </div>
        {details ? (
          <div className="mt-8 w-full">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={cn("rounded-md text-[13px] font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground", focusRing)}
            >
              {open ? "Hide details" : "Show details"}
            </button>
            {open ? (
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-left font-mono text-[12px] text-foreground/80">
                {details}
              </pre>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
