"use client";

import clsx from "clsx";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { focusRing } from "@/components/ui";
import { COMMUNITIES, type CommunitySlug } from "@/lib/ui/communities";
import { useCommunity } from "@/lib/ui/useCommunity";
import { signOut } from "@/components/shell/actions";

const LEAD_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/queue", label: "Queue" },
  { href: "/settings", label: "Settings" },
] as const;
const PUBLIC_LINKS = [
  { href: "/apply", label: "Apply" },
  { href: "/eval", label: "Eval" },
] as const;

const COMMUNITY_PAGES = ["/dashboard", "/queue", "/settings"];

export function Wordmark() {
  return (
    <Link href="/" className={clsx("flex items-center gap-2 rounded-lg font-bold tracking-tight text-slate-900", focusRing)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg">Gatekeeper</span>
    </Link>
  );
}

function CommunitySwitcher() {
  const [community, setCommunity] = useCommunity();
  return (
    <label className="relative flex items-center">
      <span className="sr-only">Community</span>
      <select
        value={community}
        onChange={(e) => setCommunity(e.target.value as CommunitySlug)}
        className={clsx(
          "h-10 max-w-[15rem] appearance-none truncate rounded-xl border-2 border-slate-200 bg-white pl-3 pr-8 text-[15px] font-semibold text-slate-900 hover:border-slate-300",
          focusRing
        )}
      >
        {COMMUNITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 text-slate-600">▾</span>
    </label>
  );
}

export default function TopNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const links = signedIn ? [...LEAD_LINKS, ...PUBLIC_LINKS] : PUBLIC_LINKS;
  const showSwitcher = signedIn && COMMUNITY_PAGES.some((p) => pathname.startsWith(p));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (href: string) =>
    clsx(
      "rounded-lg px-3 py-2 font-semibold transition-colors duration-150",
      focusRing,
      isActive(href) ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    );

  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-[90rem] items-center gap-4 px-4 sm:px-6">
        <Wordmark />
        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)} aria-current={isActive(href) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {showSwitcher ? (
            <Suspense fallback={<div className="h-10 w-56 rounded-xl bg-slate-100" />}>
              <CommunitySwitcher />
            </Suspense>
          ) : null}
          {signedIn ? (
            <form action={signOut}>
              <button type="submit" className={clsx("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100", focusRing)}>
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login" className={clsx("rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800", focusRing)}>
              Lead sign in
            </Link>
          )}
        </div>
        <button
          type="button"
          className={clsx("ml-auto rounded-lg p-2 text-slate-800 hover:bg-slate-100 md:hidden", focusRing)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </nav>
      {open ? (
        <div id="mobile-nav" className="border-t-2 border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(href)} aria-current={isActive(href) ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-3 border-t-2 border-slate-100 pt-3">
            {showSwitcher ? (
              <Suspense fallback={null}>
                <CommunitySwitcher />
              </Suspense>
            ) : null}
            {signedIn ? (
              <form action={signOut}>
                <button type="submit" className={clsx("w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-100", focusRing)}>
                  Sign out
                </button>
              </form>
            ) : (
              <Link href="/login" className={clsx("rounded-xl bg-slate-900 px-4 py-2 text-center font-semibold text-white", focusRing)}>
                Lead sign in
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
