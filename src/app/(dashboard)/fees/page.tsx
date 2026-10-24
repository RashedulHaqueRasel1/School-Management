import type { Metadata } from "next";

import { FeesOverviewView } from "@/features/fees/components/FeesOverviewView";

export const metadata: Metadata = { title: "Fees & Payments" };

export default function FeesPage() {
  return <FeesOverviewView />;
}
