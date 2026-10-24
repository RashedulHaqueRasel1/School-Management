import type { Metadata } from "next";

import { ExamScheduleView } from "@/features/examinations/components/profile/ScheduleView";

export const metadata: Metadata = { title: "Exam Routine" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExamScheduleView slug={slug} />;
}
