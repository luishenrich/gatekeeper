import type { Metadata } from "next";
import ApplyClient from "./ApplyClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Apply" };

export default function ApplyPage() {
  const useMocks = process.env.USE_MOCKS === "true";
  return <ApplyClient useMocks={useMocks} />;
}
