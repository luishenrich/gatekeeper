import Link from "next/link";
import { requireLeadPage } from "@/lib/auth/requireLeadPage";
import SettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireLeadPage();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <Link href="/queue" className="text-sm font-medium text-slate-700 underline">
            Back to queue
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-xl space-y-4 px-4 py-6">
        <p className="text-sm text-slate-600">
          Auto mode is off until you turn it on. It only sends an ask question,
          or a welcome when the score is 80 or higher. Declines, blocklist hits,
          and web applications are never sent automatically.
        </p>
        <SettingsForm />
      </div>
    </main>
  );
}
