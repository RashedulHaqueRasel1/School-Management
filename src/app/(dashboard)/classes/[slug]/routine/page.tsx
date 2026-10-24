import type { Metadata } from "next";

import { SectionRoutineView } from "@/features/classes/components/profile/RoutineView";

export const metadata: Metadata = { title: "Section · Routine" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SectionRoutineView slug={slug} />;
}
