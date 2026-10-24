import type { Metadata } from "next";

import { AcademicReportView } from "@/features/reports/components/AcademicReportView";

export const metadata: Metadata = { title: "Academic Report" };

export default function Page() {
  return <AcademicReportView />;
}
