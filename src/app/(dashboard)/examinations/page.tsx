import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Examinations" };

export default function ExaminationsPage() {
  return (
    <ModulePlaceholder
      title="Examinations"
      description="Plan exams, schedules and seating arrangements."
    />
  );
}
