import type { Metadata } from "next";

import { ReportCardPrint } from "@/features/results/components/print/ReportCardPrint";

export const metadata: Metadata = { title: "Report Cards" };

export const instant = false;

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ class?: string; section?: string; student?: string }> }) {
  const { slug } = await params;
  const { class: className, section, student } = await searchParams;
  return <ReportCardPrint slug={slug} className={className} section={section} studentId={student} />;
}
