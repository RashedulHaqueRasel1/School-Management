"use client";

import { useCallback, useMemo } from "react";

import { useExams } from "@/features/examinations/hooks/use-exams";
import { sortClasses } from "@/features/examinations/utils";
import { useStudentProfiles } from "@/features/students/hooks/use-student-profiles";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";

import { useResultsStore } from "../store/results.store";
import { buildSheet, hasResults, type SheetRow } from "../utils";

/**
 * Exams with results, the selected exam / class and their result sheets.
 * TODO (backend phase): GET /results?examId=&classId= · GET /results/summary?examId=
 */
export function useResults() {
  const { exams: allExams, hydrated: examsReady } = useExams();
  const { profiles, hydrated: profilesReady } = useStudentProfiles();
  const marks = useStudentAdminStore((s) => s.marks);
  const customSubjects = useStudentAdminStore((s) => s.customSubjects);
  const examId = useResultsStore((s) => s.examId);
  const selectedClass = useResultsStore((s) => s.className);
  const setExam = useResultsStore((s) => s.setExam);
  const setClass = useResultsStore((s) => s.setClass);
  const hydrated = examsReady && profilesReady;

  const exams = useMemo(() => allExams.filter(hasResults).sort((a, b) => b.startDate.localeCompare(a.startDate)), [allExams]);
  // Default: the latest exam waiting for marks, else the latest published one.
  const exam = exams.find((e) => e.id === examId) ?? exams.find((e) => e.status === "completed") ?? exams[0];
  const customCodes = useCallback((id: string) => new Set((customSubjects[id] ?? []).map((s) => s.code)), [customSubjects]);
  // Sheets of the classes that had students sitting the exam.
  const sheets = useMemo(() => {
    const map = new Map<string, SheetRow[]>();
    if (!exam || !hydrated) return map;
    for (const c of sortClasses(exam.classes)) {
      const rows = buildSheet(exam, c, profiles, marks, customCodes);
      if (rows.length) map.set(c, rows);
    }
    return map;
  }, [exam, profiles, marks, customCodes, hydrated]);
  const classes = useMemo(() => [...sheets.keys()], [sheets]);
  const className = selectedClass && classes.includes(selectedClass) ? selectedClass : null;

  return { exams, exam, classes, className, sheets, hydrated, setExam, setClass };
}
