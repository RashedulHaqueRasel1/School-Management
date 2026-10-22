import type { Metadata } from "next";

import { FeesView } from "@/features/students/components/profile/FeesView";

export const metadata: Metadata = { title: "Tuition Fees" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FeesView slug={slug} />;
}
