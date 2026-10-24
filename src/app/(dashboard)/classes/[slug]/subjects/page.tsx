import type { Metadata } from "next";

import { SectionSubjectsView } from "@/features/classes/components/profile/SubjectsView";

export const metadata: Metadata = { title: "Section · Subjects" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SectionSubjectsView slug={slug} />;
}
