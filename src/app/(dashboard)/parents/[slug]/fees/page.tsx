import type { Metadata } from "next";

import { ParentFeesView } from "@/features/parents/components/profile/FeesView";

export const metadata: Metadata = { title: "Guardian · Fees" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ParentFeesView slug={slug} />;
}
