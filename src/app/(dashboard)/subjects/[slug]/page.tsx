import type { Metadata } from "next";

import { SubjectOverviewView } from "@/features/subjects/components/profile/OverviewView";

export const metadata: Metadata = { title: "Subject" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubjectOverviewView slug={slug} />;
}
