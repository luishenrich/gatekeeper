"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shell/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/apply", label: "Try it" },
  { href: "/eval", label: "Eval" },
  { href: "https://github.com/luishenrich/gatekeeper", label: "GitHub" },
];

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled ? "border-b border-border/70 bg-background/85 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-8">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[15px] text-foreground/75 transition-colors hover:bg-foreground/5 hover:text-foreground",
                pathname === l.href && "text-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Button asChild className="rounded-full">
              <Link href="/queue">Open the queue</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/login">Lead sign in</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/apply">Try it free</Link>
              </Button>
            </>
          )}
        </div>
        <button
          type="button"
          className="ml-auto rounded-full p-2 hover:bg-foreground/5 md:hidden"
          aria-expanded={open}
          aria-controls="site-mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </nav>
      {open ? (
        <div id="site-mobile-nav" className="border-t border-border bg-background px-5 pb-5 pt-2 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl px-3 py-2.5 text-[17px] hover:bg-foreground/5">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={signedIn ? "/queue" : "/login"}>{signedIn ? "Open the queue" : "Lead sign in"}</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/apply">Try it free</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
