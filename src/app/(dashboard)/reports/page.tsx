import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Generate academic, attendance and financial reports."
    />
  );
}
