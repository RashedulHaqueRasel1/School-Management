import type { Metadata } from "next";

import { AttendanceView } from "@/features/students/components/profile/AttendanceView";

export const metadata: Metadata = { title: "Student Attendance" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AttendanceView slug={slug} />;
}
