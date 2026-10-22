import { cookies } from "next/headers";
import { AppHeader } from "@/components/shell/AppHeader";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const defaultOpen = jar.get("sidebar:state")?.value !== "false";
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <AppHeader />
        <main id="main" tabIndex={-1} className="min-h-0 flex-1 outline-none">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
