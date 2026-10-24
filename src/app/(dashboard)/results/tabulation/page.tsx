import type { Metadata } from "next";

import { TabulationView } from "@/features/results/components/TabulationView";

export const metadata: Metadata = { title: "Tabulation Sheet" };

export default function TabulationPage() {
  return <TabulationView />;
}
