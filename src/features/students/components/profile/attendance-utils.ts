import { localToday, minutesToTime } from "../../demoData/profile-data";
import type { AttendanceDay, AttendanceOverride, AttendanceStatus, Shift } from "../../types/types";

export const ATTENDANCE_STYLE: Record<AttendanceStatus, { label: string; pill: string; dot: string }> = {
  present: { label: "Present", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  late: { label: "Late", pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  absent: { label: "Absent", pill: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  leave: { label: "Leave", pill: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  holiday: { label: "Holiday", pill: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  weekend: { label: "Weekend", pill: "bg-soft text-fg-muted", dot: "bg-fg-subtle" },
};

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Counts up to today (approved future leave is shown on the calendar but not counted). */
export function summarize(allDays: AttendanceDay[]) {
  const today = localToday();
  const days = allDays.filter((d) => d.date <= today);
  const count = (s: AttendanceStatus) => days.filter((d) => d.status === s).length;
  const present = count("present");
  const late = count("late");
  const absent = count("absent");
  const leave = count("leave");
  const schoolDays = present + late + absent + leave;
  return {
    schoolDays,
    present,
    late,
    absent,
    leave,
    holidays: count("holiday"),
    /** Present + late over all school days. */
    rate: schoolDays ? Math.round(((present + late) / schoolDays) * 1000) / 10 : 0,
  };
}

/** "08:14 AM" → minutes from midnight. */
export function timeToMinutes(time: string) {
  const [, h, m, suffix] = /(\d+):(\d+) (AM|PM)/.exec(time) ?? [];
  if (!h) return 0;
  return ((Number(h) % 12) + (suffix === "PM" ? 12 : 0)) * 60 + Number(m);
}

export function formatDuration(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(Math.round(minutes % 60)).padStart(2, "0")}`;
}

export const inMonth = (days: AttendanceDay[], year: number, month: number) =>
  days.filter((d) => d.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));

/**
 * The record saved when an admin marks someone from a register (section, school
 * or staff register): plausible gate times for present / late, a note otherwise.
 */
export function adminMark(status: AttendanceStatus, shift: Pick<Shift, "start" | "end">, date: string): AttendanceOverride {
  const past = date < localToday();
  if (status === "present") return { status, checkIn: minutesToTime(shift.start - 8), checkOut: past ? minutesToTime(shift.end + 2) : undefined };
  if (status === "late") return { status, checkIn: minutesToTime(shift.start + 18), checkOut: past ? minutesToTime(shift.end + 2) : undefined, note: "Marked late by admin" };
  if (status === "leave") return { status, note: "Leave (marked by admin)" };
  return { status, note: "Absent (marked by admin)" };
}
