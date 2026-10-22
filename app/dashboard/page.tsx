import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { matchesLeadToken } from "@/lib/auth/queue-admin";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const jar = await cookies();
  if (!matchesLeadToken(jar.get("gk_lead")?.value)) {
    redirect("/login");
  }

  const useMocks = process.env.USE_MOCKS === "true";
  return <DashboardClient useMocks={useMocks} />;
}
