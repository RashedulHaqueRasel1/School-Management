import type { Metadata } from "next";

import { ExamSettingsView } from "@/features/examinations/components/profile/SettingsView";

export const metadata: Metadata = { title: "Exam Settings" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExamSettingsView slug={slug} />;
}
