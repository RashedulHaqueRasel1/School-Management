"use client";

import { useMemo } from "react";

import { useStudentProfiles } from "@/features/students/hooks/use-student-profiles";
import { useTeachers } from "@/features/teachers/hooks/use-teachers";
import type { Teacher } from "@/features/teachers/types/types";

import { curriculumSubjects, subjectSlug, teacherSubjectName } from "../demoData/catalog";
import { useSubjectAdminHydrated, useSubjectAdminStore } from "../store/subject-admin.store";
import type { Subject, SubjectLearner } from "../types/types";

export type SubjectSummary = Subject & {
  learners: SubjectLearner[];
  teachers: Teacher[];
  /** Average % in the latest published exam. */
  average?: number;
  passRate?: number;
  latestExam?: string;
};

/**
 * Subject catalog (curriculum + admin-created) with who takes it, who teaches
 * it and the latest exam performance. TODO (backend phase): GET /subjects?withStats=1
 */
export function useSubjects() {
  const ready = useSubjectAdminHydrated();
  const settings = useSubjectAdminStore((s) => s.settings);
  const added = useSubjectAdminStore((s) => s.added);
  const archived = useSubjectAdminStore((s) => s.archived);
  const { profiles, students, hydrated: studentsReady } = useStudentProfiles();
  const { teachers, hydrated: teachersReady } = useTeachers();

  const subjects = useMemo<SubjectSummary[]>(() => {
    const base: Subject[] = [
      ...curriculumSubjects.map((s) => ({ ...s, ...settings[s.name], archived: Boolean(archived[s.name]) })),
      ...added.map((a) => ({ ...a, ...settings[a.name], slug: subjectSlug(a.name), custom: true, archived: Boolean(archived[a.name]) })),
    ];
    const all = [...profiles.values()];
    return base.map((subject) => {
      const learners = all.filter((p) => p.profile.subjects.some((s) => s.name === subject.name));
      const results = learners.flatMap((l) => {
        const exam = l.profile.exams.filter((e) => e.status === "published").at(-1);
        const r = exam?.results.find((x) => x.subject === subject.name);
        return r && exam ? [{ exam: exam.name, pct: (r.obtained / r.fullMarks) * 100, pass: (r.obtained / r.fullMarks) * 100 >= (subject.passMarks / subject.fullMarks) * 100 }] : [];
      });
      return {
        ...subject,
        learners,
        teachers: teachers.filter((t) => t.status !== "left" && t.subjects.includes(teacherSubjectName(subject.name))),
        average: results.length ? results.reduce((s, r) => s + r.pct, 0) / results.length : undefined,
        passRate: results.length ? (results.filter((r) => r.pass).length / results.length) * 100 : undefined,
        latestExam: results[0]?.exam,
      };
    });
  }, [settings, added, archived, profiles, teachers]);

  return { subjects, profiles, students, teachers, hydrated: ready && studentsReady && teachersReady };
}
