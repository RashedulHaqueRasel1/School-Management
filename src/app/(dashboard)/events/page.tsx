import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Events & Holidays" };

export default function EventsPage() {
  return (
    <ModulePlaceholder
      title="Events & Holidays"
      description="Maintain the school calendar, events and holidays."
    />
  );
}
