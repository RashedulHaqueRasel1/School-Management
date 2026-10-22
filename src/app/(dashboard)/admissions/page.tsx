import type { Metadata } from "next";

import { AdmissionsView } from "@/features/admissions/components/AdmissionsView";

export const metadata: Metadata = { title: "Admissions Management" };

export default function AdmissionsPage() {
  return <AdmissionsView />;
}
