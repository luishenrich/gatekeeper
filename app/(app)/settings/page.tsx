import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasLeadPageAccess } from "@/lib/auth/requireLeadPage";
import SettingsClient, { SettingsSkeleton } from "./SettingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  if (!(await hasLeadPageAccess())) {
    redirect("/login?next=/settings");
  }

  const useMocks = process.env.USE_MOCKS === "true";
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsClient useMocks={useMocks} />
      </Suspense>
    </div>
  );
}
