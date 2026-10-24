import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CURRENT_USER } from "@/features/admissions/constants";
import { uid } from "@/features/admissions/utils";

import type { Exam, ExamAudit, ExamAuditCategory, ExamRoom, ExamSettings, Paper } from "../types/types";

type ExamAdminState = {
  /** Exams created by admins. */
  added: Exam[];
  /** Settings changes by exam id. */
  settings: Record<string, Partial<ExamSettings>>;
  /** Edited routine (replaces the generated one once changed). */
  papers: Record<string, Paper[]>;
  rooms: Record<string, ExamRoom[]>;
  cancelled: Record<string, { reason: string; at: string }>;
  published: Record<string, string>;
  /** examId → studentIds whose admit card was released despite dues. */
  released: Record<string, string[]>;
  deleted: string[];
  audit: ExamAudit[];

  log: (examId: string, category: ExamAuditCategory, action: string, detail?: string) => void;
  addExam: (exam: Exam) => void;
  saveSettings: (examId: string, patch: Partial<ExamSettings>, detail: string, resetSchedule: boolean) => void;
  setPapers: (examId: string, papers: Paper[] | null, action: string, detail?: string) => void;
  setRooms: (examId: string, rooms: ExamRoom[] | null, action: string, detail?: string) => void;
  cancel: (examId: string, reason: string) => void;
  restore: (examId: string) => void;
  publish: (examId: string, on: boolean) => void;
  release: (examId: string, studentId: string, name: string) => void;
  remove: (examId: string) => void;
};

const entry = (examId: string, category: ExamAuditCategory, action: string, detail?: string): ExamAudit => ({
  id: uid(),
  examId,
  category,
  action,
  detail,
  at: new Date().toISOString(),
  by: CURRENT_USER,
});

const without = <T,>(record: Record<string, T>, key: string) => {
  const copy = { ...record };
  delete copy[key];
  return copy;
};

/** Admin changes to exams (localStorage). BACKEND: see features/examinations/BACKEND.md */
export const useExamAdminStore = create<ExamAdminState>()(
  persist(
    (set) => ({
      added: [],
      settings: {},
      papers: {},
      rooms: {},
      cancelled: {},
      published: {},
      released: {},
      deleted: [],
      audit: [],

      log: (examId, category, action, detail) => set((s) => ({ audit: [entry(examId, category, action, detail), ...s.audit] })),

      // BACKEND: POST /exams
      addExam: (exam) =>
        set((s) => ({ added: [...s.added, exam], audit: [entry(exam.id, "settings", "Exam created", `${exam.type} · ${exam.classes.length} classes · from ${exam.startDate}`), ...s.audit] })),

      // BACKEND: PATCH /exams/:id  (resetSchedule → regenerate the routine)
      saveSettings: (examId, patch, detail, resetSchedule) =>
        set((s) => ({
          settings: { ...s.settings, [examId]: { ...s.settings[examId], ...patch } },
          papers: resetSchedule ? without(s.papers, examId) : s.papers,
          audit: [entry(examId, "settings", "Exam settings updated", detail), ...s.audit],
        })),

      // BACKEND: PUT /exams/:id/papers  (null = back to generated)
      setPapers: (examId, papers, action, detail) =>
        set((s) => ({ papers: papers ? { ...s.papers, [examId]: papers } : without(s.papers, examId), audit: [entry(examId, "schedule", action, detail), ...s.audit] })),

      // BACKEND: PUT /exams/:id/rooms
      setRooms: (examId, rooms, action, detail) =>
        set((s) => ({ rooms: rooms ? { ...s.rooms, [examId]: rooms } : without(s.rooms, examId), audit: [entry(examId, "seating", action, detail), ...s.audit] })),

      cancel: (examId, reason) =>
        set((s) => ({ cancelled: { ...s.cancelled, [examId]: { reason, at: new Date().toISOString() } }, audit: [entry(examId, "settings", "Exam cancelled", reason), ...s.audit] })),

      restore: (examId) => set((s) => ({ cancelled: without(s.cancelled, examId), audit: [entry(examId, "settings", "Exam restored"), ...s.audit] })),

      // BACKEND: POST /exams/:id/publish · DELETE /exams/:id/publish
      publish: (examId, on) =>
        set((s) => ({
          published: on ? { ...s.published, [examId]: new Date().toISOString() } : without(s.published, examId),
          audit: [entry(examId, "results", on ? "Results published" : "Results unpublished"), ...s.audit],
        })),

      // BACKEND: POST /exams/:id/admit-cards/:studentId/release
      release: (examId, studentId, name) =>
        set((s) => ({ released: { ...s.released, [examId]: [...(s.released[examId] ?? []), studentId] }, audit: [entry(examId, "admit", "Admit card released despite dues", name), ...s.audit] })),

      // BACKEND: DELETE /exams/:id  (admin-created, no results)
      remove: (examId) => set((s) => ({ added: s.added.filter((e) => e.id !== examId), deleted: [...s.deleted, examId] })),
    }),
    { name: "exam-admin-demo", skipHydration: true },
  ),
);

export function useExamAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useExamAdminStore.persist.onFinishHydration(onChange),
    () => useExamAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useExamAdminStore.persist.hasHydrated()) void useExamAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
