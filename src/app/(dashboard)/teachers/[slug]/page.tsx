import type { Metadata } from "next";

import { TeacherOverviewView } from "@/features/teachers/components/profile/OverviewView";

export const metadata: Metadata = { title: "Teacher" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeacherOverviewView slug={slug} />;
}
