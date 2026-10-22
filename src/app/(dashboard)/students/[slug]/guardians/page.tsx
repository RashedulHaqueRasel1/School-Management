import type { Metadata } from "next";

import { GuardiansView } from "@/features/students/components/profile/GuardiansView";

export const metadata: Metadata = { title: "Parents & Guardians" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GuardiansView slug={slug} />;
}
