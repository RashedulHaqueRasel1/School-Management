import type { Metadata } from "next";

import { DuesView } from "@/features/fees/components/DuesView";

export const metadata: Metadata = { title: "Fee Dues" };

export default function Page() {
  return <DuesView />;
}
