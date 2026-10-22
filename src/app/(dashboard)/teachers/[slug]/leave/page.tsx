import type { Metadata } from "next";

import { TeacherLeaveView } from "@/features/teachers/components/profile/LeaveView";

export const metadata: Metadata = { title: "Teacher Leave" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeacherLeaveView slug={slug} />;
}
