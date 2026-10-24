import type { Metadata } from "next";

import { HolidaysView } from "@/features/events/components/HolidaysView";

export const metadata: Metadata = { title: "Holidays" };

export default function Page() {
  return <HolidaysView />;
}
