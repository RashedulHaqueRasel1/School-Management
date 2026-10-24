import type { Metadata } from "next";

import { SectionStudentsView } from "@/features/classes/components/profile/StudentsView";

export const metadata: Metadata = { title: "Section · Students" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SectionStudentsView slug={slug} />;
}
