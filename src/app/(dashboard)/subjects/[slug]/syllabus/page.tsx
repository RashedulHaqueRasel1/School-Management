import type { Metadata } from "next";

import { SubjectSyllabusView } from "@/features/subjects/components/profile/SyllabusView";

export const metadata: Metadata = { title: "Subject · Syllabus" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubjectSyllabusView slug={slug} />;
}
