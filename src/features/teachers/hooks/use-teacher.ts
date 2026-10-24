"use client";

import { useMemo } from "react";

import { useClassAdminHydrated, useClassAdminStore } from "@/features/classes/store/class-admin.store";
import type { AccountSubject } from "@/features/students/components/profile/admin/AccountDialogs";
import {
  DEFAULT_WEEKEND,
  SHIFTS,
  addDaysIso,
  applyAttendanceCorrections,
  generateAttendance,
  hash,
  localToday,
  schoolDaysBetween,
} from "@/features/students/demoData/profile-data";

import {
  LEAVE_QUOTA,
  ROUTINE_DAYS,
  TEACHER_LEAVE_LABEL,
  buildRoutine,
  buildSalaryLedger,
  classTeacherOf,
  defaultSalarySettings,
  seedAssignments,
  seedSalaryPayments,
} from "../demoData/mock-data";
import { useTeacherAdminStore } from "../store/teacher-admin.store";
import type { PortalAccount, Shift, Teacher, TeacherLeaveType } from "../types/types";
import { teacherSlug } from "../utils";
import { leavesFor, useTeachers } from "./use-teachers";

type TeacherAdmin = ReturnType<typeof useTeacherAdminStore.getState>;

/**
 * A teacher's attendance for the current year (from joining, if later) with
 * approved leave, admin corrections and their personal weekend applied.
 * Pure — usable for every teacher at once (school-wide attendance).
 */
export function teacherAttendance(teacher: Teacher, admin: TeacherAdmin) {
  const preset = SHIFTS[teacher.shift] ?? SHIFTS.Morning!;
  // Staff arrive 20 minutes before classes start and leave 30 minutes after.
  const shift: Shift = { name: teacher.shift, start: preset.start - 20, end: preset.end + 30 };
  const yearStart = `${localToday().slice(0, 4)}-01-01`;
  const attendanceFrom = teacher.joinedOn > yearStart ? teacher.joinedOn : yearStart;
  const weekend = admin.weekends[teacher.id] ?? DEFAULT_WEEKEND;
  const leaves = leavesFor(teacher, admin.leaveRequests, admin.leaveState);
  const approved = leaves.filter((l) => l.status === "approved");
  const attendance = applyAttendanceCorrections(
    generateAttendance(`${teacher.id}:attendance`, attendanceFrom, shift, weekend),
    attendanceFrom,
    approved.map((l) => ({ from: l.from, to: l.to, label: TEACHER_LEAVE_LABEL[l.type] })),
    admin.attendance[teacher.id] ?? {},
    weekend,
  );
  return { shift, attendanceFrom, weekend, leaves, approved, attendance };
}

/**
 * One teacher by URL slug with everything the admin manages: attendance,
 * leave (+ balance), classes & routine, salary, account, audit, release.
 * TODO (backend phase): GET /teachers/by-slug/:slug and the sub-resources.
 */
export function useTeacher(slug: string) {
  const { teachers, hydrated } = useTeachers();
  const admin = useTeacherAdminStore();
  // Class teachers changed in Classes & Sections.
  useClassAdminHydrated();
  const sectionSettings = useClassAdminStore((s) => s.sections);
  const teacher = useMemo(() => teachers.find((t) => teacherSlug(t) === slug), [teachers, slug]);

  const data = useMemo(() => {
    if (!teacher || !hydrated) return undefined;
    const { shift, attendanceFrom, weekend, leaves, approved, attendance } = teacherAttendance(teacher, admin);

    const year = localToday().slice(0, 4);
    const leaveUsage = (Object.keys(LEAVE_QUOTA) as TeacherLeaveType[])
      .filter((type) => type !== "other" && (type !== "maternity" || teacher.gender === "Female"))
      .map((type) => {
        const used = approved
          .filter((l) => l.type === type && l.from.startsWith(year))
          .reduce((sum, l) => sum + schoolDaysBetween(l.from, l.to, weekend).length, 0);
        return { type, label: TEACHER_LEAVE_LABEL[type], quota: LEAVE_QUOTA[type], used, left: Math.max(0, LEAVE_QUOTA[type] - used) };
      });

    const assignments = admin.assignments[teacher.id] ?? seedAssignments(teacher);
    const salarySettings = admin.salarySettings[teacher.id] ?? defaultSalarySettings(teacher);
    const salary = buildSalaryLedger(teacher, salarySettings, [...seedSalaryPayments(teacher, salarySettings), ...(admin.salaryPayments[teacher.id] ?? [])]);

    const seed = hash(teacher.id);
    const storedAccount: PortalAccount = {
      username: teacher.email.split("@")[0] || teacher.id.toLowerCase(),
      status: "active",
      lastLoginAt: `${addDaysIso(localToday(), -(seed % 2))}T0${2 + (seed % 6)}:${String(seed % 60).padStart(2, "0")}:00Z`,
      passwordChangedAt: `${teacher.joinedOn}T09:00:00Z`,
      mustChangePassword: false,
      ...admin.accounts[teacher.id],
    };
    const account: PortalAccount =
      storedAccount.status === "suspended" && storedAccount.suspendedUntil && storedAccount.suspendedUntil < localToday()
        ? { ...storedAccount, status: "active", statusReason: undefined, suspendedUntil: undefined }
        : storedAccount;

    return {
      shift,
      attendance,
      attendanceFrom,
      leaves,
      leaveUsage,
      assignments,
      routine: buildRoutine(teacher.id, assignments, ROUTINE_DAYS.filter((d) => !weekend.days.includes(d))),
      weekend,
      classTeacherOf: classTeacherOf(teacher.id, Object.fromEntries(Object.entries(sectionSettings).map(([key, v]) => [key, v.classTeacherId]))),
      salary,
      account,
      audit: admin.audit.filter((e) => e.teacherId === teacher.id),
      release: admin.releases[teacher.id],
      corrections: admin.attendance[teacher.id] ?? {},
    };
  }, [teacher, hydrated, admin, sectionSettings]);

  const subject: AccountSubject | undefined = teacher
    ? {
        name: teacher.name,
        kind: "teacher",
        smsTo: { name: teacher.name, phone: teacher.phone },
        onUpdate: (patch, action, detail) => admin.updateAccount(teacher.id, patch, action, detail),
      }
    : undefined;

  return { hydrated, teacher, teachers, subject, ...data };
}
