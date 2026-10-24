"use client";

import { useMemo } from "react";

import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { classTeacherFor } from "@/features/students/demoData/profile-data";
import { useStudents } from "@/features/students/hooks/use-students";
import type { Student, Teacher as StudentTeacher } from "@/features/students/types/types";
import { useTeachers } from "@/features/teachers/hooks/use-teachers";
import type { Teacher } from "@/features/teachers/types/types";

import { DEFAULT_SECTIONS, classOrder, defaultSettings, levelOf, sectionKey, sectionSlug } from "../demoData/mock-data";
import { useClassAdminHydrated, useClassAdminStore } from "../store/class-admin.store";
import type { ClassSection } from "../types/types";

/** A teacher record in the shape the student module uses for class / subject teachers. */
export const toStudentTeacher = (t: Teacher): StudentTeacher => ({ id: t.id, name: t.name, subject: t.subjects[0] ?? "", designation: t.designation, phone: t.phone, email: t.email });

function majority(values: string[]) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * Every class section (standard A/B, admin-created, and any custom section a
 * student was moved to) with its students, settings and class teacher.
 * TODO (backend phase): GET /sections
 */
export function useClasses() {
  const { students, hydrated: studentsReady } = useStudents();
  const { teachers, hydrated: teachersReady } = useTeachers();
  const classReady = useClassAdminHydrated();
  const settings = useClassAdminStore((s) => s.sections);
  const added = useClassAdminStore((s) => s.added);
  const archived = useClassAdminStore((s) => s.archived);

  const sections = useMemo<ClassSection[]>(() => {
    const keys = new Map<string, { className: string; section: string; custom: boolean }>();
    const add = (className: string, section: string, custom: boolean) => {
      const key = sectionKey(className, section);
      if (!keys.has(key)) keys.set(key, { className, section, custom });
    };
    for (const c of CLASS_OPTIONS) for (const s of DEFAULT_SECTIONS) add(c, s, false);
    for (const a of added) add(a.className, a.section, true);
    for (const st of students) if (st.status !== "left") add(st.className, st.section, true);

    return [...keys.entries()]
      .map(([key, { className, section, custom }]) => {
        const list: Student[] = students.filter((s) => s.status !== "left" && s.className === className && s.section === section).sort((a, b) => a.roll - b.roll);
        const merged = { ...defaultSettings(className, section, { shift: majority(list.map((s) => s.shift)), version: majority(list.map((s) => s.version)) }), ...settings[key] };
        const override = merged.classTeacherId ? teachers.find((t) => t.id === merged.classTeacherId) : undefined;
        return {
          key,
          slug: sectionSlug(className, section),
          className,
          section,
          level: levelOf(className),
          settings: merged,
          students: list,
          classTeacher: override ? toStudentTeacher(override) : classTeacherFor({ className, section }),
          custom,
          archived: Boolean(archived[key]),
        };
      })
      .sort((a, b) => classOrder(a.className) - classOrder(b.className) || a.className.localeCompare(b.className) || a.section.localeCompare(b.section));
  }, [students, teachers, settings, added, archived]);

  return { sections, students, teachers, hydrated: studentsReady && teachersReady && classReady };
}
