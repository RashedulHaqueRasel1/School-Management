import type { Metadata } from "next";

import { PaymentsView } from "@/features/fees/components/PaymentsView";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <PaymentsView />;
}
