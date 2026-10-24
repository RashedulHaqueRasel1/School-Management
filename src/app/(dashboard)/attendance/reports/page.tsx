import type { Metadata } from "next";

import { MonthlyReportView } from "@/features/attendance/components/MonthlyReportView";

export const metadata: Metadata = { title: "Attendance Reports" };

export default function AttendanceReportsPage() {
  return <MonthlyReportView />;
}
