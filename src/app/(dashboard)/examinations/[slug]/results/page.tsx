import type { Metadata } from "next";

import { ExamResultsView } from "@/features/examinations/components/profile/ResultsView";

export const metadata: Metadata = { title: "Exam Results" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExamResultsView slug={slug} />;
}
