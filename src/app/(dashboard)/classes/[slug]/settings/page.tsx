import type { Metadata } from "next";

import { SectionSettingsView } from "@/features/classes/components/profile/SettingsView";

export const metadata: Metadata = { title: "Section · Settings" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SectionSettingsView slug={slug} />;
}
