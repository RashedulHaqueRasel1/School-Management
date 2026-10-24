import { HOLIDAYS, WEEKEND_DAYS, addDaysIso, weekdayOf } from "@/features/students/demoData/profile-data";

import type { SchoolEvent } from "../types/types";

/*
 * Demo school calendar. Events are dated relative to today so the calendar
 * always looks current; school holidays use fixed dates.
 * TODO (backend phase): GET /events?from=&to=
 */

type Seed = Omit<SchoolEvent, "id" | "createdAt" | "custom" | "startDate" | "endDate"> & { start: number | string; days?: number };

const SEEDS: Seed[] = [
  { title: "Inter-class science fair", category: "Academic", start: 6, startTime: "09:00", endTime: "13:00", location: "School ground", groups: ["students", "parents"], classes: ["Class 6", "Class 7", "Class 8"], description: "Teams of up to three students present their science projects. The best three go to the district fair." },
  { title: "Annual sports day", category: "Sports", start: 12, startTime: "08:00", endTime: "15:00", location: "Playground", groups: ["students", "parents", "teachers"], classes: [], description: "Races, relays and team games for every class, followed by the prize-giving ceremony. Parents are welcome." },
  { title: "Staff meeting — exam duties", category: "Meeting", start: 2, startTime: "14:00", endTime: "15:30", location: "Conference room", groups: ["teachers"], classes: [], description: "Annual exam invigilation duties, result processing timeline and the winter sports week." },
  { title: "Study tour to Sonargaon", category: "Trip", start: 20, startTime: "07:30", endTime: "17:00", location: "Sonargaon, Narayanganj", groups: ["students", "parents"], classes: ["Class 9", "Class 10"], description: "Educational trip to the Folk Art and Craft Museum. Consent form and fee (৳800) by next week." },
  { title: "Inter-house debate competition", category: "Cultural", start: -5, startTime: "10:00", endTime: "13:00", location: "Main hall", groups: ["students"], classes: [], description: "Houses debate on “Technology makes us more connected”. Judges from the English department." },
  { title: "Parent–teacher meeting", category: "Meeting", start: 55, startTime: "10:00", endTime: "13:00", location: "Classrooms", groups: ["parents", "teachers"], classes: [], description: "Discuss annual exam results and progress with the class teacher." },
  { title: "Victory Day programme", category: "Cultural", start: "2026-12-16", startTime: "08:00", endTime: "11:00", location: "School ground", groups: ["students", "parents", "teachers"], classes: [], description: "Flag hoisting, discussion on the Liberation War and a cultural programme by students." },
  { title: "Winter vacation", category: "Holiday", start: "2026-12-20", days: 12, location: "", groups: ["students", "parents", "teachers"], classes: [], description: "The school is closed for winter vacation. Classes for the new session start in January." },
  { title: "Science olympiad (regional)", category: "Academic", start: -18, startTime: "09:00", endTime: "12:00", location: "Dhaka College", groups: ["students"], classes: ["Class 8", "Class 9", "Class 10"], description: "Selected students represent the school at the regional science olympiad." },
];

export function demoEvents(today: string): SchoolEvent[] {
  return SEEDS.map(({ start, days = 1, ...s }, i) => {
    let startDate = typeof start === "number" ? addDaysIso(today, start) : start;
    // Relative demo dates skip the weekly holiday.
    while (typeof start === "number" && WEEKEND_DAYS.includes(weekdayOf(startDate))) startDate = addDaysIso(startDate, 1);
    return { ...s, id: `EVT-${String(i + 1).padStart(3, "0")}`, startDate, endDate: addDaysIso(startDate, days - 1), createdAt: `${addDaysIso(today, -30)}T10:00:00`, custom: false };
  });
}

/** Government holidays grouped into ranges (Eid holidays → one item). */
export function governmentHolidays(): { title: string; startDate: string; endDate: string }[] {
  const dates = Object.keys(HOLIDAYS).sort();
  const groups: { title: string; startDate: string; endDate: string }[] = [];
  const base = (name: string) => name.replace(/ holidays$/, "");
  for (const d of dates) {
    const last = groups.at(-1);
    if (last && addDaysIso(last.endDate, 1) === d && base(HOLIDAYS[d]!) === last.title) last.endDate = d;
    else groups.push({ title: base(HOLIDAYS[d]!), startDate: d, endDate: d });
  }
  return groups;
}
