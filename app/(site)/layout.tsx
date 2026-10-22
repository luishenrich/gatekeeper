import { SiteNav } from "@/components/shell/SiteNav";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { hasLeadPageAccess } from "@/lib/auth/requireLeadPage";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await hasLeadPageAccess();
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
