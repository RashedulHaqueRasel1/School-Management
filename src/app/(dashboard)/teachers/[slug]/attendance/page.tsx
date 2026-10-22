import type { Metadata } from "next";

import { TeacherAttendanceView } from "@/features/teachers/components/profile/AttendanceView";

export const metadata: Metadata = { title: "Teacher Attendance" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeacherAttendanceView slug={slug} />;
}
