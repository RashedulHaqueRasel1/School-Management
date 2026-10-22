import type { Metadata } from "next";

import { OverviewView } from "@/features/students/components/profile/OverviewView";

export const metadata: Metadata = { title: "Student Overview" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <OverviewView slug={slug} />;
}
