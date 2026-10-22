import type { Metadata } from "next";

import { TuitionReceiptView } from "@/features/students/components/print/TuitionReceiptView";

export const metadata: Metadata = { title: "Tuition Fee Slip" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ receiptNo: string }> }) {
  const { receiptNo } = await params;
  return <TuitionReceiptView receiptNo={decodeURIComponent(receiptNo)} />;
}
