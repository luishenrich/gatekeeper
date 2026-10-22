import { cookies } from "next/headers";
import { SiteNav } from "@/components/shell/SiteNav";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { matchesLeadToken } from "@/lib/auth/queue-admin";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const signedIn = matchesLeadToken(jar.get("gk_lead")?.value);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav signedIn={signedIn} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
