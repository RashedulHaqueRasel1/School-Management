import { classOrder } from "@/features/classes/demoData/mock-data";
import { minutesToTime } from "@/features/students/demoData/profile-data";
import type { Student } from "@/features/students/types/types";

import type { Exam, ExamRoom, ExamStatus, Paper } from "./types/types";

export type ExamTab = "schedule" | "seating" | "admit-cards" | "results" | "settings";

export const examHref = (e: Pick<Exam, "slug">, tab?: ExamTab) => `/examinations/${e.slug}${tab ? `/${tab}` : ""}`;

export const STATUS_STYLE: Record<ExamStatus, { label: string; tone: "info" | "warning" | "neutral" | "success" | "danger"; ribbon: "info" | "warning" | "neutral" | "success" | "danger" }> = {
  scheduled: { label: "Scheduled", tone: "info", ribbon: "info" },
  ongoing: { label: "Ongoing", tone: "warning", ribbon: "warning" },
  completed: { label: "Marks entry", tone: "neutral", ribbon: "neutral" },
  published: { label: "Published", tone: "success", ribbon: "success" },
  cancelled: { label: "Cancelled", tone: "danger", ribbon: "danger" },
};

export const timeRange = (p: Pick<Paper, "start" | "duration">) => `${minutesToTime(p.start)} – ${minutesToTime(p.start + p.duration)}`;

export const hours = (minutes: number) => (minutes % 60 ? `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60}m` : `${minutes / 60}h`);

export const sortClasses = (classes: string[]) => [...classes].sort((a, b) => classOrder(a) - classOrder(b) || a.localeCompare(b));

export function examStatus(e: Exam, start: string, end: string, today: string): ExamStatus {
  if (e.cancelled) return "cancelled";
  if (today < start) return "scheduled";
  if (today <= end) return "ongoing";
  // Demo exams already have generated results on every student profile.
  return e.publishedAt || !e.custom ? "published" : "completed";
}

/** Papers that clash: the same class with two papers at overlapping times on one day. */
export function clashesOf(papers: Paper[]) {
  const ids = new Set<string>();
  for (const a of papers)
    for (const b of papers)
      if (a.id < b.id && a.className === b.className && a.date === b.date && a.start < b.start + b.duration && b.start < a.start + a.duration) {
        ids.add(a.id);
        ids.add(b.id);
      }
  return ids;
}

export type Seat = { student: Student; room: ExamRoom; seat: number };

/**
 * Seat plan: students of different classes alternate (round-robin by class),
 * then fill the rooms in order. Returns the seats and anyone without a seat.
 */
export function seatPlan(students: Student[], rooms: ExamRoom[]) {
  const byClass = new Map<string, Student[]>();
  for (const s of [...students].sort((a, b) => classOrder(a.className) - classOrder(b.className) || a.section.localeCompare(b.section) || a.roll - b.roll)) {
    byClass.set(s.className, [...(byClass.get(s.className) ?? []), s]);
  }
  const queues = [...byClass.values()];
  const order: Student[] = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) order.push(q.shift()!);

  const seats: Seat[] = [];
  let i = 0;
  for (const room of rooms) for (let seat = 1; seat <= room.capacity && i < order.length; seat++) seats.push({ student: order[i++]!, room, seat });
  return { seats, unseated: order.slice(i) };
}

export function downloadCsv(rows: (string | number)[][], fileName: string) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
