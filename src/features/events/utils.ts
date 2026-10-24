import { BookOpen, Bus, ClipboardList, Music, PartyPopper, Trophy, Umbrella, Users, type LucideIcon } from "lucide-react";

import type { BadgeTone } from "@/components/ui/badge";
import { addDaysIso } from "@/features/students/demoData/profile-data";

import type { EventCategory, SchoolEvent } from "./types/types";

export const CATEGORIES: EventCategory[] = ["Holiday", "Academic", "Exam", "Sports", "Cultural", "Meeting", "Trip", "Other"];
/** Categories an admin can create (exams come from Examinations). */
export const EDITABLE_CATEGORIES = CATEGORIES.filter((c) => c !== "Exam");

export const CATEGORY_STYLE: Record<EventCategory, { icon: LucideIcon; tone: BadgeTone; chip: string; dot: string; tile: string }> = {
  Holiday: { icon: Umbrella, tone: "success", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200", dot: "bg-emerald-500", tile: "bg-emerald-50 text-emerald-700" },
  Academic: { icon: BookOpen, tone: "info", chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200", dot: "bg-indigo-500", tile: "bg-indigo-50 text-indigo-700" },
  Exam: { icon: ClipboardList, tone: "warning", chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200", dot: "bg-amber-500", tile: "bg-amber-50 text-amber-700" },
  Sports: { icon: Trophy, tone: "danger", chip: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200", dot: "bg-rose-500", tile: "bg-rose-50 text-rose-700" },
  Cultural: { icon: Music, tone: "violet", chip: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200", dot: "bg-violet-500", tile: "bg-violet-50 text-violet-700" },
  Meeting: { icon: Users, tone: "neutral", chip: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200", dot: "bg-sky-500", tile: "bg-sky-50 text-sky-700" },
  Trip: { icon: Bus, tone: "info", chip: "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200", dot: "bg-teal-500", tile: "bg-teal-50 text-teal-700" },
  Other: { icon: PartyPopper, tone: "neutral", chip: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200", dot: "bg-slate-400", tile: "bg-slate-100 text-slate-600" },
};

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Every date an event covers. */
export function datesOf(e: Pick<SchoolEvent, "startDate" | "endDate">) {
  const out: string[] = [];
  for (let d = e.startDate; d <= e.endDate && out.length < 400; d = addDaysIso(d, 1)) out.push(d);
  return out;
}

export const dayCount = (e: Pick<SchoolEvent, "startDate" | "endDate">) => datesOf(e).length;

/** "09:00" → "9:00 AM" */
export function time12(t?: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number) as [number, number];
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function whenLabel(e: Pick<SchoolEvent, "startDate" | "endDate" | "startTime" | "endTime">) {
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const days = e.startDate === e.endDate ? fmt(e.startDate) : `${fmt(e.startDate)} – ${fmt(e.endDate)}`;
  const times = e.startTime ? ` · ${time12(e.startTime)}${e.endTime ? ` – ${time12(e.endTime)}` : ""}` : " · All day";
  return days + times;
}

/** School holiday dates → name (fed to the attendance / exam holiday registry). */
export function holidayMap(events: SchoolEvent[]) {
  const map: Record<string, string> = {};
  for (const e of events) if (e.category === "Holiday") for (const d of datesOf(e)) map[d] = e.title;
  return map;
}
