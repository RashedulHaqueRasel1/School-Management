import type { Metadata } from "next";

import { PersonalInfoView } from "@/features/students/components/profile/PersonalInfoView";

export const metadata: Metadata = { title: "Personal Info" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PersonalInfoView slug={slug} />;
}
