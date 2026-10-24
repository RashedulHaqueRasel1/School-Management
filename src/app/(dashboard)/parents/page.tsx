import type { Metadata } from "next";

import { ParentsView } from "@/features/parents/components/ParentsView";

export const metadata: Metadata = { title: "Parents & Guardians" };

export default function ParentsPage() {
  return <ParentsView />;
}
