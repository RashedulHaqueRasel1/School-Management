import type { Metadata } from "next";

import { ExamOverviewView } from "@/features/examinations/components/profile/OverviewView";

export const metadata: Metadata = { title: "Examination" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExamOverviewView slug={slug} />;
}
