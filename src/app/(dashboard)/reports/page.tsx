import type { Metadata } from "next";

import { ReportsOverviewView } from "@/features/reports/components/ReportsOverviewView";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportsOverviewView />;
}
