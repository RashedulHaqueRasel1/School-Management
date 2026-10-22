import type { Metadata } from "next";

import { ReceiptView } from "@/features/admissions/components/receipt/ReceiptView";

export const metadata: Metadata = { title: "Money Receipt" };

// The receipt is loaded on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function ReceiptPage({ params }: { params: Promise<{ receiptNo: string }> }) {
  const { receiptNo } = await params;
  return <ReceiptView receiptNo={decodeURIComponent(receiptNo)} />;
}
