import type { Metadata } from "next";

import { ParentOverviewView } from "@/features/parents/components/profile/OverviewView";

export const metadata: Metadata = { title: "Guardian" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ParentOverviewView slug={slug} />;
}
