import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={<Compass className="h-7 w-7" aria-hidden />}
        title="We couldn't find that page"
        body="The link may be old, or the application may have been handled already."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800">
              Back to home
            </Link>
            <Link href="/queue" className="rounded-xl border-2 border-slate-300 px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-50">
              Open the queue
            </Link>
          </div>
        }
      />
    </main>
  );
}
