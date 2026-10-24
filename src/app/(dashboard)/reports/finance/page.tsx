import type { Metadata } from "next";

import { FinanceReportView } from "@/features/reports/components/FinanceReportView";

export const metadata: Metadata = { title: "Finance Report" };

export default function Page() {
  return <FinanceReportView />;
}
