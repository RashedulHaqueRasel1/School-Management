import type { Metadata } from "next";

import { StructureView } from "@/features/fees/components/StructureView";

export const metadata: Metadata = { title: "Fee Structure" };

export default function Page() {
  return <StructureView />;
}
