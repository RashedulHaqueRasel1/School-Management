import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Fees & Payments" };

export default function FeesPage() {
  return (
    <ModulePlaceholder
      title="Fees & Payments"
      description="Manage fee structures, invoices and payment collection."
    />
  );
}
