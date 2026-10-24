import type { Metadata } from "next";

import { SubjectClassesView } from "@/features/subjects/components/profile/ClassesView";

export const metadata: Metadata = { title: "Subject · Classes & Teachers" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubjectClassesView slug={slug} />;
}
