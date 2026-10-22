import type { Metadata } from "next";

import { AcademicsView } from "@/features/students/components/profile/AcademicsView";

export const metadata: Metadata = { title: "Subjects & Results" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AcademicsView slug={slug} />;
}
