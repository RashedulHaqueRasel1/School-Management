import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage() {
  return (
    <ModulePlaceholder
      title="Results"
      description="Enter marks, publish results and generate report cards."
    />
  );
}
