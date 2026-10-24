import type { Metadata } from "next";

import { ExamSeatingView } from "@/features/examinations/components/profile/SeatingView";

export const metadata: Metadata = { title: "Seat Plan" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExamSeatingView slug={slug} />;
}
