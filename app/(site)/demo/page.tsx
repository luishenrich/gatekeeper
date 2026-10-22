import type { Metadata } from "next";
import { DemoClient } from "./DemoClient";

export const metadata: Metadata = { title: "Live demo" };

export default function DemoPage() {
  return <DemoClient />;
}
