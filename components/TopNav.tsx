"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/queue", label: "Queue" },
  { href: "/apply", label: "Apply" },
  { href: "/eval", label: "Eval" },
] as const;

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-14 shrink-0 items-center gap-6 border-b-2 border-slate-200 bg-white px-6 text-[17px] text-slate-900">
      <Link href="/" className="font-bold tracking-tight hover:underline">
        Gatekeeper
      </Link>
      <div className="flex items-center gap-1">
        {LINKS.map(({ href, label }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 font-semibold ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <Link
        href="/settings"
        className="ml-auto font-semibold text-slate-600 hover:text-slate-900 hover:underline"
      >
        Settings
      </Link>
    </nav>
  );
}
