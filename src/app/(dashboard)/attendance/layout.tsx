import { AttendanceShell } from "@/features/attendance/components/AttendanceShell";

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return <AttendanceShell>{children}</AttendanceShell>;
}
