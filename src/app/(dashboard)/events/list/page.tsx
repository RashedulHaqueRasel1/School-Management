import type { Metadata } from "next";

import { EventsListView } from "@/features/events/components/EventsListView";

export const metadata: Metadata = { title: "All Events" };

export default function Page() {
  return <EventsListView />;
}
