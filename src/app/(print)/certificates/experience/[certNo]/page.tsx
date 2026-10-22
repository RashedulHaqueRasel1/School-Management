import type { Metadata } from "next";

import { ExperienceCertificateView } from "@/features/teachers/components/print/ExperienceCertificateView";

export const metadata: Metadata = { title: "Experience Certificate" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ certNo: string }> }) {
  const { certNo } = await params;
  return <ExperienceCertificateView certNo={decodeURIComponent(certNo)} />;
}
