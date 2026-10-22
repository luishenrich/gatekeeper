import Link from "next/link";
import { Logo } from "@/components/shell/Logo";
import { REPO_URL } from "@/lib/ui/communities";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-md text-sm text-muted-foreground">
            Built at the Grok Bot Community Engineering London Hackathon, 22 Oct 2026 · MIT · All applicant data shown is fictional
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/apply" className="hover:text-foreground">Try it</Link>
          <Link href="/eval" className="hover:text-foreground">Eval</Link>
          <Link href="/login" className="hover:text-foreground">Lead sign in</Link>
          <a href={REPO_URL} className="hover:text-foreground">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
