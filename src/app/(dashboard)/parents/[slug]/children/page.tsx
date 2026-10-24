import type { Metadata } from "next";

import { ChildrenView } from "@/features/parents/components/profile/ChildrenView";

export const metadata: Metadata = { title: "Guardian · Children" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ChildrenView slug={slug} />;
}
