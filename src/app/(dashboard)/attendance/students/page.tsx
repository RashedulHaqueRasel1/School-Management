import type { Metadata } from "next";

import { StudentRegisterView } from "@/features/attendance/components/StudentRegisterView";

export const metadata: Metadata = { title: "Student Attendance" };

export default function StudentAttendancePage() {
  return <StudentRegisterView />;
}
