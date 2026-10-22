import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shell/Logo";
import { focusRing } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Not found" };

const pill = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors duration-150";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 pb-24 text-center sm:px-8">
        <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Error 404</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-7xl">
          We couldn&apos;t find <em className="font-display italic">that page</em>
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          The link may be old, or the application may have been handled already.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={cn(pill, "bg-foreground text-background hover:bg-foreground/85", focusRing)}>
            Back to home
          </Link>
          <Link href="/queue" className={cn(pill, "border border-border bg-card text-foreground hover:bg-accent", focusRing)}>
            Open the queue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </main>
    </div>
  );
}
