"use client";

import { useMemo } from "react";

import { useClasses } from "@/features/classes/hooks/use-classes";
import { sameSubject } from "@/features/classes/hooks/use-section";
import type { ClassSection } from "@/features/classes/types/types";
import { teacherFor } from "@/features/students/demoData/profile-data";
import type { Teacher as StudentTeacher } from "@/features/students/types/types";
import { seedAssignments } from "@/features/teachers/demoData/mock-data";
import { useTeacherAdminStore } from "@/features/teachers/store/teacher-admin.store";
import type { Teacher, TeachingAssignment } from "@/features/teachers/types/types";

import { defaultSyllabus, teacherSubjectName } from "../demoData/catalog";
import { useSubjectAdminStore } from "../store/subject-admin.store";
import type { SyllabusTopic } from "../types/types";
import { useSubjects } from "./use-subjects";

export type SectionTeaching = {
  section: ClassSection;
  /** Teachers assigned in the teacher module. */
  assigned: { teacher: Teacher; assignment: TeachingAssignment }[];
  /** School default subject teacher when nobody is assigned. */
  fallback?: StudentTeacher;
  learners: number;
};

/**
 * One subject by slug: sections that study it (with teachers), syllabus per
 * class, learners and audit. TODO (backend phase): GET /subjects/by-slug/:slug
 */
export function useSubject(slug: string) {
  const { subjects, teachers, hydrated: subjectsReady } = useSubjects();
  const { sections, hydrated: classesReady } = useClasses();
  const assignments = useTeacherAdminStore((s) => s.assignments);
  const syllabusEdits = useSubjectAdminStore((s) => s.syllabus);
  const audit = useSubjectAdminStore((s) => s.audit);
  const subject = useMemo(() => subjects.find((s) => s.slug === slug), [subjects, slug]);
  const hydrated = subjectsReady && classesReady;

  const data = useMemo(() => {
    if (!subject || !hydrated) return undefined;
    const active = teachers.filter((t) => t.status !== "left");
    const teaching: SectionTeaching[] = sections
      .filter((s) => !s.archived && subject.classes.includes(s.className))
      .map((section) => {
        const assigned = active.flatMap((t) =>
          (assignments[t.id] ?? seedAssignments(t))
            .filter((a) => a.className === section.className && a.section === section.section && sameSubject(a.subject, subject.name))
            .map((assignment) => ({ teacher: t, assignment })),
        );
        const raw = teacherSubjectName(subject.name);
        const fallback = !subject.custom ? teacherFor(raw) : undefined;
        return {
          section,
          assigned,
          // teacherFor() falls back to an unrelated teacher when nobody teaches the subject — ignore that.
          fallback: fallback?.subject === raw ? fallback : undefined,
          learners: subject.learners.filter((l) => l.student.className === section.className && l.student.section === section.section).length,
        };
      });
    const syllabus = (className: string): { topics: SyllabusTopic[]; edited: boolean } => {
      const edited = syllabusEdits[`${subject.name}::${className}`];
      return { topics: edited ?? defaultSyllabus(subject.name, className), edited: Boolean(edited) };
    };
    return { teaching, syllabus, audit: audit.filter((a) => a.subject === subject.name) };
  }, [subject, hydrated, teachers, sections, assignments, syllabusEdits, audit]);

  return { hydrated, subject, subjects, teachers, sections, ...data };
}
