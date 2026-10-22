import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Attendance" };

export default function AttendancePage() {
  return (
    <ModulePlaceholder
      title="Attendance"
      description="Record and review daily student and staff attendance."
    />
  );
}
