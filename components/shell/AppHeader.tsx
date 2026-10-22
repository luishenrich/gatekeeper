"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommunitySwitcher } from "@/components/shell/AppSidebar";

const TITLES: Record<string, string> = {
  "/queue": "Review queue",
  "/dashboard": "Dashboard",
  "/settings": "Settings",
};

export function AppHeader() {
  const pathname = usePathname();
  const title = Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] ?? "Greenlight";
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <span className="text-[15px] font-medium">{title}</span>
      <div className="ml-auto md:hidden">
        <Suspense fallback={null}>
          <CommunitySwitcher className="h-9 w-52 rounded-xl bg-card text-sm" />
        </Suspense>
      </div>
    </header>
  );
}
