import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid h-8 w-8 place-items-center rounded-[10px] bg-foreground", className)} aria-hidden>
      <svg viewBox="0 0 32 32" className="h-5 w-5">
        <path d="M16 4.5l9 3.4v6.7c0 5.8-3.9 10.3-9 12.7-5.1-2.4-9-6.9-9-12.7V7.9l9-3.4z" fill="#22C55E" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
      <LogoMark />
      <span className="font-display text-[22px] leading-none">Greenlight</span>
    </Link>
  );
}
