import type { Metadata } from "next";

import { DailyOverviewView } from "@/features/attendance/components/DailyOverviewView";

export const metadata: Metadata = { title: "Attendance" };

export default function AttendancePage() {
  return <DailyOverviewView />;
}
