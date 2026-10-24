"use client";

import { useMemo } from "react";

import { DEFAULT_FEE_SETTINGS, buildTuitionLedger, seedTuitionPayments } from "@/features/students/demoData/fee-data";
import { useStudentProfiles } from "@/features/students/hooks/use-student-profiles";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { ExamResult, Student } from "@/features/students/types/types";
import { localToday } from "@/features/students/demoData/profile-data";
import { useTeachers } from "@/features/teachers/hooks/use-teachers";

import { useExamAdminStore } from "../store/exam-admin.store";
import { seatPlan } from "../utils";
import { useExams } from "./use-exams";

/** Admit cards are withheld when this many months of tuition are unpaid. */
export const WITHHOLD_AFTER_MONTHS = 2;

export type Candidate = {
  student: Student;
  /** Unpaid tuition up to today. */
  due: number;
  /** Months unpaid — two or more withholds the admit card. */
  monthsDue: number;
  /** Admit card can be printed. */
  eligible: boolean;
  released: boolean;
  room?: string;
  seat?: number;
  /** This exam's result on the student's profile (demo exams). */
  result?: ExamResult;
};

/**
 * One exam by URL slug with candidates (dues, seat, result), seat plan,
 * invigilators and change log. TODO (backend phase): GET /exams/by-slug/:slug + sub-resources
 */
export function useExam(slug: string) {
  const { exams, hydrated: examsReady } = useExams();
  const { profiles, hydrated: profilesReady } = useStudentProfiles();
  const { teachers, hydrated: teachersReady } = useTeachers();
  const studentAdmin = useStudentAdminStore();
  const released = useExamAdminStore((s) => s.released);
  const allAudit = useExamAdminStore((s) => s.audit);
  const hydrated = examsReady && profilesReady && teachersReady;
  const exam = exams.find((e) => e.slug === slug);

  const data = useMemo(() => {
    if (!exam) return null;
    const plan = seatPlan(exam.candidates, exam.rooms);
    const seatOf = new Map(plan.seats.map((s) => [s.student.id, s]));
    const today = localToday();
    const releasedIds = new Set(released[exam.id] ?? []);
    const candidates: Candidate[] = exam.candidates.map((student) => {
      const ledger = buildTuitionLedger(student, [...seedTuitionPayments(student), ...(studentAdmin.tuitionPayments[student.id] ?? [])], studentAdmin.feeSettings[student.id] ?? DEFAULT_FEE_SETTINGS);
      const monthsDue = ledger.months.filter((m) => m.due > 0 && m.dueDate <= today).length;
      const seat = seatOf.get(student.id);
      const result = profiles.get(student.id)?.profile.exams.find((e) => e.id === exam.id && e.status === "published");
      return { student, due: ledger.outstanding, monthsDue, released: releasedIds.has(student.id), eligible: monthsDue < WITHHOLD_AFTER_MONTHS || releasedIds.has(student.id), room: seat?.room.name, seat: seat?.seat, result };
    });
    return { plan, candidates, audit: allAudit.filter((a) => a.examId === exam.id) };
  }, [exam, released, allAudit, profiles, studentAdmin.tuitionPayments, studentAdmin.feeSettings]);

  return { exam, exams, teachers, hydrated, ...data };
}
