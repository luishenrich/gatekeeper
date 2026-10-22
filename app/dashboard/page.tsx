import { requireLeadPage } from "@/lib/auth/requireLeadPage";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireLeadPage();

  const useMocks = process.env.USE_MOCKS === "true";
  return <DashboardClient useMocks={useMocks} />;
}
