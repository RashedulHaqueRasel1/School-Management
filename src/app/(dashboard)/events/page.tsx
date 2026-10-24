import type { Metadata } from "next";

import { CalendarView } from "@/features/events/components/CalendarView";

export const metadata: Metadata = { title: "Events & Holidays" };

export default function EventsPage() {
  return <CalendarView />;
}
