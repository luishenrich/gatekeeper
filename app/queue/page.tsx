import LegacyQueue from "@/components/queue/LegacyQueue";
import { requireLeadPage } from "@/lib/auth/requireLeadPage";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  await requireLeadPage();
  const useMocks = process.env.USE_MOCKS === "true";
  return <LegacyQueue useMocks={useMocks} authed />;
}
