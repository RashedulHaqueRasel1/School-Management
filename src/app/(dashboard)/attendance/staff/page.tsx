import type { Metadata } from "next";

import { StaffRegisterView } from "@/features/attendance/components/StaffRegisterView";

export const metadata: Metadata = { title: "Staff Attendance" };

export default function StaffAttendancePage() {
  return <StaffRegisterView />;
}
