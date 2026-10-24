import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { slugify } from "@/features/admissions/utils";
import { EXAMS, WEEKEND_DAYS, addDaysIso, holidayName, subjectNamesFor, weekdayOf } from "@/features/students/demoData/profile-data";

import type { Exam, ExamRoom, ExamSettings, ExamType, Paper } from "../types/types";

/*
 * Demo exams = the session's exams the student results already use (same ids),
 * with a generated routine and rooms. TODO (backend phase): GET /exams
 */

export const EXAM_TYPES: ExamType[] = ["Term", "Half Yearly", "Annual", "Class test", "Model test"];

export const PRE_PRIMARY = ["Play", "Nursery", "KG"];

const TYPE_OF: Record<string, ExamType> = { "first-term": "Term", "half-yearly": "Half Yearly", "second-term": "Term", annual: "Annual" };

export const DEFAULT_INSTRUCTIONS =
  "Bring this admit card to every paper. Be seated 15 minutes before the start. Mobile phones, smart watches and notes are not allowed in the exam hall.";

export const DEFAULT_EXAMS: Exam[] = EXAMS.map((e) => ({
  id: e.id,
  slug: slugify(e.name),
  name: e.name,
  type: TYPE_OF[e.id] ?? "Term",
  startDate: e.heldOn,
  classes: [...CLASS_OPTIONS],
  startTime: 9 * 60 + 30,
  fullMarks: 100,
  passMarks: 33,
  instructions: DEFAULT_INSTRUCTIONS,
  custom: false,
}));

/** One paper for religion (each student sits their own religion's paper). */
export const RELIGION_PAPER = "Religion & Moral Education";

export function examSubjects(className: string) {
  return subjectNamesFor(className, "Islam").map((s) => (s.includes("Religion") || s.includes("Islam") ? RELIGION_PAPER : s === "Early Childhood" ? "General Knowledge" : s));
}

/** Paper length by level: pre-primary 1h, primary 2h, secondary 3h (class tests 40 min). */
export function paperDuration(className: string, type: ExamType) {
  if (type === "Class test") return 40;
  if (PRE_PRIMARY.includes(className)) return 60;
  return Number(className.replace(/\D/g, "")) <= 5 ? 120 : 180;
}

export const isExamDay = (date: string) => !WEEKEND_DAYS.includes(weekdayOf(date)) && !holidayName(date);

/** The next exam day on or after `date`. */
export function nextExamDay(date: string) {
  let d = date;
  while (!isExamDay(d)) d = addDaysIso(d, 1);
  return d;
}

/** Every class sits one subject per exam day, in curriculum order. */
export function generateSchedule(exam: Pick<ExamSettings, "startDate" | "classes" | "startTime" | "type">): Paper[] {
  const papers: Paper[] = [];
  for (const className of exam.classes) {
    let date = nextExamDay(exam.startDate);
    for (const subject of examSubjects(className)) {
      papers.push({ id: `${className}::${subject}`, className, subject, date, start: exam.startTime, duration: paperDuration(className, exam.type) });
      date = nextExamDay(addDaysIso(date, 1));
    }
  }
  return papers;
}

const INVIGILATION_ROOMS = ["Room 101", "Room 102", "Room 201", "Room 202", "Room 301", "Room 302", "Room 401", "Room 402", "Hall A", "Hall B"];

export function defaultRooms(): ExamRoom[] {
  return INVIGILATION_ROOMS.map((name, i) => ({ id: slugify(name), name, capacity: name.startsWith("Hall") ? 60 : 30, invigilatorId: `TCH-${String(i + 1).padStart(3, "0")}` }));
}
