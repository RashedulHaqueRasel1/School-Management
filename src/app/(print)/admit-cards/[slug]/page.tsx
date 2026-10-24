import type { Metadata } from "next";

import { AdmitCardsPrint } from "@/features/examinations/components/print/AdmitCardsPrint";

export const metadata: Metadata = { title: "Admit Cards" };

export const instant = false;

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ class?: string; student?: string }> }) {
  const { slug } = await params;
  const { class: className, student } = await searchParams;
  return <AdmitCardsPrint slug={slug} className={className} studentId={student} />;
}
