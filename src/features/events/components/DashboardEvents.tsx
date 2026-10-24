"use client";

import { UpcomingEvents } from "@/features/dashboard/components/UpcomingEvents";

import { useCalendar } from "../hooks/use-calendar";
import { time12 } from "../utils";

/** Dashboard "Upcoming Events" card — the next four items on the school calendar. */
export function DashboardEvents() {
  const { items, today } = useCalendar();
  const next = items
    .filter((i) => i.endDate >= today)
    .slice(0, 4)
    .map((i) => ({
      id: i.id,
      title: i.title,
      time: i.closed ? "School closed" : `${i.startTime ? time12(i.startTime) : "All day"}${i.location ? ` · ${i.location}` : ""}`,
      day: i.startDate.slice(8),
      month: new Date(`${i.startDate}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      type: i.category === "Holiday" ? ("Holiday" as const) : i.category === "Exam" ? ("Exam" as const) : ("Event" as const),
    }));
  return <UpcomingEvents events={next} />;
}
