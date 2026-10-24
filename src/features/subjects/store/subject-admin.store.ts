import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CURRENT_USER } from "@/features/admissions/constants";
import { uid } from "@/features/admissions/utils";

import type { SubjectAudit, SubjectAuditCategory, SubjectSettings, SyllabusTopic } from "../types/types";

type SubjectAdminState = {
  /** Settings changes by subject name. */
  settings: Record<string, Partial<SubjectSettings>>;
  /** Subjects created by admins. */
  added: (SubjectSettings & { name: string; createdAt: string })[];
  archived: Record<string, { reason: string; at: string }>;
  /** "Subject::Class" → full topic list (replaces the demo syllabus once edited). */
  syllabus: Record<string, SyllabusTopic[]>;
  audit: SubjectAudit[];

  log: (subject: string, category: SubjectAuditCategory, action: string, detail?: string) => void;
  saveSettings: (subject: string, patch: Partial<SubjectSettings>, detail: string) => void;
  addSubject: (subject: SubjectSettings & { name: string }) => void;
  archive: (subject: string, reason: string) => void;
  restore: (subject: string) => void;
  setSyllabus: (subject: string, className: string, topics: SyllabusTopic[], action: string, detail?: string) => void;
  resetSyllabus: (subject: string, className: string) => void;
};

const entry = (subject: string, category: SubjectAuditCategory, action: string, detail?: string): SubjectAudit => ({
  id: uid(),
  subject,
  category,
  action,
  detail,
  at: new Date().toISOString(),
  by: CURRENT_USER,
});

/** Admin changes to subjects (localStorage). BACKEND: see features/subjects/BACKEND.md */
export const useSubjectAdminStore = create<SubjectAdminState>()(
  persist(
    (set) => ({
      settings: {},
      added: [],
      archived: {},
      syllabus: {},
      audit: [],

      log: (subject, category, action, detail) => set((s) => ({ audit: [entry(subject, category, action, detail), ...s.audit] })),

      // BACKEND: PATCH /subjects/:id
      saveSettings: (subject, patch, detail) =>
        set((s) => ({ settings: { ...s.settings, [subject]: { ...s.settings[subject], ...patch } }, audit: [entry(subject, "settings", "Subject settings updated", detail), ...s.audit] })),

      // BACKEND: POST /subjects
      addSubject: (subject) =>
        set((s) => ({
          added: [...s.added, { ...subject, createdAt: new Date().toISOString() }],
          audit: [entry(subject.name, "settings", "Subject created", `${subject.code} · ${subject.type} · ${subject.classes.join(", ")}`), ...s.audit],
        })),

      archive: (subject, reason) =>
        set((s) => ({ archived: { ...s.archived, [subject]: { reason, at: new Date().toISOString() } }, audit: [entry(subject, "settings", "Subject archived", reason), ...s.audit] })),

      restore: (subject) =>
        set((s) => {
          const archived = { ...s.archived };
          delete archived[subject];
          return { archived, audit: [entry(subject, "settings", "Subject restored"), ...s.audit] };
        }),

      // BACKEND: PUT /subjects/:id/syllabus/:class
      setSyllabus: (subject, className, topics, action, detail) =>
        set((s) => ({ syllabus: { ...s.syllabus, [`${subject}::${className}`]: topics }, audit: [entry(subject, "syllabus", action, detail), ...s.audit] })),

      resetSyllabus: (subject, className) =>
        set((s) => {
          const syllabus = { ...s.syllabus };
          delete syllabus[`${subject}::${className}`];
          return { syllabus, audit: [entry(subject, "syllabus", "Syllabus reset to default plan", className), ...s.audit] };
        }),
    }),
    { name: "subject-admin-demo", skipHydration: true },
  ),
);

export function useSubjectAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useSubjectAdminStore.persist.onFinishHydration(onChange),
    () => useSubjectAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useSubjectAdminStore.persist.hasHydrated()) void useSubjectAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
