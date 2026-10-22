import type { Metadata } from "next";

import { TransferCertificateView } from "@/features/students/components/print/TransferCertificateView";

export const metadata: Metadata = { title: "Transfer Certificate" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ tcNo: string }> }) {
  const { tcNo } = await params;
  return <TransferCertificateView tcNo={decodeURIComponent(tcNo)} />;
}
