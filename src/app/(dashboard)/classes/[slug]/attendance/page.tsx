import type { Metadata } from "next";

import { SectionAttendanceView } from "@/features/classes/components/profile/AttendanceView";

export const metadata: Metadata = { title: "Section · Attendance" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SectionAttendanceView slug={slug} />;
}
