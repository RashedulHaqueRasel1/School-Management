import type { Metadata } from "next";

import { SubjectResultsView } from "@/features/subjects/components/profile/ResultsView";

export const metadata: Metadata = { title: "Subject · Results" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubjectResultsView slug={slug} />;
}
