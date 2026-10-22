import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import SettingsClient, { SettingsSkeleton } from "./SettingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const jar = await cookies();
  if (!matchesLeadToken(jar.get("gk_lead")?.value)) {
    redirect("/login?next=/settings");
  }

  const useMocks = process.env.USE_MOCKS === "true";
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsClient useMocks={useMocks} />
      </Suspense>
    </main>
  );
}
