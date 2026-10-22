"use client";

import { BarChart3, BookOpenText, ExternalLink, FlaskConical, Inbox, LogOut, Settings2, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/shell/Logo";
import { signOut } from "@/components/shell/actions";
import { COMMUNITIES, type CommunitySlug } from "@/lib/ui/communities";
import { useCommunity } from "@/lib/ui/useCommunity";

const WORK = [
  { href: "/queue", label: "Review queue", icon: Inbox, hint: "J/K · A/S/D" },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/rules", label: "Community rules", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

const PUBLIC = [
  { href: "/apply", label: "Apply page", icon: UserPlus },
  { href: "/eval", label: "Eval results", icon: FlaskConical },
] as const;

export function CommunitySwitcher({ className }: { className?: string }) {
  const [community, setCommunity] = useCommunity();
  return (
    <Select value={community} onValueChange={(v) => setCommunity(v as CommunitySlug)}>
      <SelectTrigger aria-label="Community" className={className ?? "h-10 rounded-xl bg-card"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COMMUNITIES.map((c) => (
          <SelectItem key={c.slug} value={c.slug}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function WorkLinks() {
  const pathname = usePathname();
  const params = useSearchParams();
  const community = params.get("community");
  const withCommunity = (href: string) => (community ? `${href}?community=${community}` : href);
  return (
    <SidebarMenu>
      {WORK.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label} size="lg" className="h-10 rounded-xl text-[15px]">
            <Link href={withCommunity(item.href)}>
              <item.icon aria-hidden />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-4 px-3 pt-4">
        <Logo href="/queue" className="px-1 group-data-[collapsible=icon]:hidden" />
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Community</div>
          <Suspense fallback={<div className="h-10 rounded-xl bg-card" />}>
            <CommunitySwitcher />
          </Suspense>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Moderation</SidebarGroupLabel>
          <Suspense fallback={null}>
            <WorkLinks />
          </Suspense>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Public</SidebarGroupLabel>
          <SidebarMenu>
            {PUBLIC.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.label} className="rounded-xl">
                  <Link href={item.href}>
                    <item.icon aria-hidden />
                    <span>{item.label}</span>
                    <ExternalLink className="ml-auto !h-3.5 !w-3.5 opacity-50" aria-hidden />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit" tooltip="Sign out" className="rounded-xl text-muted-foreground">
                <LogOut aria-hidden />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
