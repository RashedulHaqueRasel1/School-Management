"use client";

import { useMemo } from "react";

import { localToday } from "@/features/students/demoData/profile-data";
import { useStudents } from "@/features/students/hooks/use-students";
import type { Student } from "@/features/students/types/types";

import { DEFAULT_EXAMS, defaultRooms, generateSchedule } from "../demoData/mock-data";
import { useExamAdminHydrated, useExamAdminStore } from "../store/exam-admin.store";
import type { Exam, ExamRoom, ExamStatus, Paper } from "../types/types";
import { examStatus } from "../utils";

export type ExamSummary = Exam & {
  papers: Paper[];
  rooms: ExamRoom[];
  /** Exam days in order. */
  days: string[];
  endDate: string;
  status: ExamStatus;
  /** Current students of the exam's classes. */
  candidates: Student[];
  /** The routine was edited by an admin. */
  editedSchedule: boolean;
};

/**
 * Every exam of the session (demo + admin-created) with its routine, rooms and
 * status. TODO (backend phase): GET /exams?withPapers=1
 */
export function useExams() {
  const ready = useExamAdminHydrated();
  const { students, hydrated: studentsReady } = useStudents();
  const added = useExamAdminStore((s) => s.added);
  const settings = useExamAdminStore((s) => s.settings);
  const papers = useExamAdminStore((s) => s.papers);
  const rooms = useExamAdminStore((s) => s.rooms);
  const cancelled = useExamAdminStore((s) => s.cancelled);
  const published = useExamAdminStore((s) => s.published);
  const deleted = useExamAdminStore((s) => s.deleted);
  const hydrated = ready && studentsReady;

  const exams = useMemo<ExamSummary[]>(() => {
    if (!hydrated) return [];
    const today = localToday();
    const current = students.filter((s) => s.status !== "left");
    return [...DEFAULT_EXAMS, ...added]
      .filter((e) => !deleted.includes(e.id))
      .map((base) => {
        const e: Exam = { ...base, ...settings[base.id], cancelled: cancelled[base.id], publishedAt: published[base.id] };
        const list = (papers[e.id] ?? generateSchedule(e)).filter((p) => e.classes.includes(p.className)).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
        const days = [...new Set(list.map((p) => p.date))];
        const endDate = days.at(-1) ?? e.startDate;
        return {
          ...e,
          papers: list,
          rooms: rooms[e.id] ?? defaultRooms(),
          days,
          endDate,
          status: examStatus(e, days[0] ?? e.startDate, endDate, today),
          candidates: current.filter((s) => e.classes.includes(s.className)),
          editedSchedule: Boolean(papers[e.id]),
        };
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [hydrated, students, added, settings, papers, rooms, cancelled, published, deleted]);

  return { exams, students, hydrated };
}
