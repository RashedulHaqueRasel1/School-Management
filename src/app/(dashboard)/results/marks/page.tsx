import type { Metadata } from "next";

import { MarkEntryView } from "@/features/results/components/MarkEntryView";

export const metadata: Metadata = { title: "Mark Entry" };

export default function MarkEntryPage() {
  return <MarkEntryView />;
}
