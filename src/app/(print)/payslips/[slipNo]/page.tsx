import type { Metadata } from "next";

import { PayslipView } from "@/features/teachers/components/print/PayslipView";

export const metadata: Metadata = { title: "Salary Payslip" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slipNo: string }> }) {
  const { slipNo } = await params;
  return <PayslipView slipNo={decodeURIComponent(slipNo)} />;
}
