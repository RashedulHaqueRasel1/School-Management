import type { Metadata } from "next";

import { SectionOverviewView } from "@/features/classes/components/profile/OverviewView";

export const metadata: Metadata = { title: "Class Section" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SectionOverviewView slug={slug} />;
}
