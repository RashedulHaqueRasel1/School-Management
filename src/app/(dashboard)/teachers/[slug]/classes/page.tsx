import type { Metadata } from "next";

import { ClassesView } from "@/features/teachers/components/profile/ClassesView";

export const metadata: Metadata = { title: "Classes & Routine" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ClassesView slug={slug} />;
}
