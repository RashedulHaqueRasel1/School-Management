import type { Metadata } from "next";

import { SubjectSettingsView } from "@/features/subjects/components/profile/SettingsView";

export const metadata: Metadata = { title: "Subject · Settings" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubjectSettingsView slug={slug} />;
}
