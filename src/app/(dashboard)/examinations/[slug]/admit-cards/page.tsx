import type { Metadata } from "next";

import { ExamAdmitCardsView } from "@/features/examinations/components/profile/AdmitCardsView";

export const metadata: Metadata = { title: "Admit Cards" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExamAdmitCardsView slug={slug} />;
}
