"use client";

import { useMemo } from "react";

import { useAdmissionsStore } from "@/features/admissions/store/admissions.store";
import { DEFAULT_FEE_SETTINGS, buildTuitionLedger, seedTuitionPayments } from "@/features/students/demoData/fee-data";
import { DEFAULT_WEEKEND, hash, seeded, subjectsFor } from "@/features/students/demoData/profile-data";
import { studentLeaveRequests, studentProfileFor } from "@/features/students/hooks/use-student";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { Student, StudentProfile, Teacher as StudentTeacher, TuitionLedger } from "@/features/students/types/types";
import { PERIODS_PER_DAY, ROUTINE_DAYS, buildRoutine, seedAssignments } from "@/features/teachers/demoData/mock-data";
import { useTeacherAdminStore } from "@/features/teachers/store/teacher-admin.store";
import type { RoutineSlot, Teacher, TeachingAssignment } from "@/features/teachers/types/types";

import { sectionLabel } from "../demoData/mock-data";
import { useClassAdminStore } from "../store/class-admin.store";
import type { RoutineCell } from "../types/types";
import { useClasses } from "./use-classes";

/** Curriculum names vs teacher subject names ("General Knowledge" is taught by early-childhood teachers). */
export const sameSubject = (a: string, b: string) => a === b || ([a, b].includes("General Knowledge") && [a, b].includes("Early Childhood"));

export type GridCell = {
  slot: string;
  day: number;
  period: number;
  cell: RoutineCell;
  /** Changed by an admin in this section's routine. */
  edited: boolean;
  /** Teacher has another class at the same time (or two classes fall in this period). */
  clash?: string;
  /** Curriculum period with no teacher assigned yet. */
  unassigned?: boolean;
};

export type SectionMember = { student: Student; profile: StudentProfile; ledger: TuitionLedger };

/**
 * One section by URL slug with students (full profiles), subject teachers and
 * the weekly routine. TODO (backend phase): GET /sections/by-slug/:slug (+ /routine, /attendance)
 */
export function useSection(slug: string) {
  const { sections, students, teachers, hydrated } = useClasses();
  const section = useMemo(() => sections.find((s) => s.slug === slug), [sections, slug]);
  const teacherAdmin = useTeacherAdminStore();
  const studentAdmin = useStudentAdminStore();
  const routineOverrides = useClassAdminStore((s) => s.routine);
  const audit = useClassAdminStore((s) => s.audit);
  const admissions = useAdmissionsStore((s) => s.admissions);

  const data = useMemo(() => {
    if (!section || !hydrated) return undefined;
    const active = teachers.filter((t) => t.status !== "left");
    const assignmentsOf = (t: Teacher) => teacherAdmin.assignments[t.id] ?? seedAssignments(t);
    const routines = new Map<string, RoutineSlot[]>(
      active.map((t) => {
        const weekend = teacherAdmin.weekends[t.id] ?? DEFAULT_WEEKEND;
        return [t.id, buildRoutine(t.id, assignmentsOf(t), ROUTINE_DAYS.filter((d) => !weekend.days.includes(d)))];
      }),
    );
    const mine = (a: TeachingAssignment) => a.className === section.className && a.section === section.section;

    // Subject teachers
    const sectionAssignments = active.flatMap((t) => assignmentsOf(t).filter(mine).map((assignment) => ({ teacher: t, assignment })));
    const curriculum = subjectsFor(section.className, "Islam");
    const subjects = [
      ...curriculum.map((s) => ({
        name: s.name,
        code: s.code,
        periodsPerWeek: s.periodsPerWeek,
        custom: false,
        teachers: sectionAssignments.filter((a) => sameSubject(a.assignment.subject, s.name)),
        /** The school's default subject teacher (what the student profile shows until someone is assigned). */
        defaultTeacher: s.teacher as StudentTeacher | undefined,
      })),
      ...[...new Set(sectionAssignments.map((a) => a.assignment.subject))]
        .filter((name) => !curriculum.some((c) => sameSubject(c.name, name)))
        .map((name) => ({ name, code: "", periodsPerWeek: 0, custom: true, teachers: sectionAssignments.filter((a) => a.assignment.subject === name), defaultTeacher: undefined as StudentTeacher | undefined })),
    ];

    // Routine: teachers' routines for this section, then admin edits on top.
    const overrides = routineOverrides[section.key] ?? {};
    const busy = (teacherId: string, day: number, period: number) => {
      const other = routines.get(teacherId)?.find((s) => s.day === day && s.period === period && !mine(s.assignment));
      return other ? sectionLabel(other.assignment.className, other.assignment.section) : undefined;
    };
    const grid: GridCell[] = ROUTINE_DAYS.flatMap((day) =>
      Array.from({ length: PERIODS_PER_DAY }, (_, i) => {
        const period = i + 1;
        const slot = `${day}-${period}`;
        const here = active.flatMap((t) => (routines.get(t.id) ?? []).filter((s) => s.day === day && s.period === period && mine(s.assignment)).map((s) => ({ t, s })));
        const first = here[0];
        return {
          slot,
          day,
          period,
          cell: first ? { subject: first.s.assignment.subject, teacherId: first.t.id, teacherName: first.t.name } : null,
          edited: false,
          clash: here.length > 1 ? `${here.length} classes scheduled together: ${here.map((h) => h.s.assignment.subject).join(", ")}` : undefined,
        } as GridCell;
      }),
    );

    // Curriculum subjects without an assigned teacher get their periods with the default subject teacher.
    const random = seeded(hash(`${section.key}:routine`));
    for (const sub of subjects.filter((x) => x.teachers.length === 0 && x.periodsPerWeek > 0)) {
      let placed = 0;
      let dayIndex = Math.floor(random() * ROUTINE_DAYS.length);
      for (let guard = 0; placed < sub.periodsPerWeek && guard < ROUTINE_DAYS.length * 3; guard += 1, dayIndex += 1) {
        const day = ROUTINE_DAYS[dayIndex % ROUTINE_DAYS.length]!;
        const sameDay = grid.some((c) => c.day === day && c.cell?.subject === sub.name);
        const free = grid.find((c) => c.day === day && !c.cell);
        if (!free || (sameDay && guard < ROUTINE_DAYS.length * 2)) continue;
        const religion = sub.name.includes("Religion") || sub.name.includes("Islam");
        const fallback = religion ? undefined : sub.defaultTeacher;
        free.cell = {
          subject: religion ? "Religion & Moral Education" : sub.name,
          teacherId: fallback?.id ?? "",
          teacherName: religion ? "Per student's religion" : (fallback?.name ?? "No teacher"),
        };
        free.unassigned = !religion && !fallback;
        placed += 1;
      }
    }

    // Admin edits win.
    for (const c of grid) {
      if (!(c.slot in overrides)) continue;
      const cell = overrides[c.slot] ?? null;
      const elsewhere = cell ? busy(cell.teacherId, c.day, c.period) : undefined;
      Object.assign(c, { cell, edited: true, unassigned: false, clash: elsewhere ? `${cell!.teacherName} also teaches ${elsewhere} now` : undefined });
    }

    // Students with full profiles (attendance, results) and tuition.
    const members: SectionMember[] = section.students.map((student) => {
      const admission = student.admissionId ? admissions.find((a) => a.id === student.admissionId) : undefined;
      const profile = studentProfileFor(student, students, admission, studentAdmin, studentLeaveRequests(student, studentAdmin));
      const ledger = buildTuitionLedger(student, [...seedTuitionPayments(student), ...(studentAdmin.tuitionPayments[student.id] ?? [])], studentAdmin.feeSettings[student.id] ?? DEFAULT_FEE_SETTINGS);
      return { student, profile, ledger };
    });

    return { subjects, grid, busy, members, curriculum, audit: audit.filter((a) => a.sectionKey === section.key) };
  }, [section, hydrated, teachers, teacherAdmin, studentAdmin, routineOverrides, audit, admissions, students]);

  return { hydrated, section, sections, students, teachers, ...data };
}
