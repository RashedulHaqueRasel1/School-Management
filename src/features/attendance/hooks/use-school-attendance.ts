"use client";

import { useMemo } from "react";

import { useClasses } from "@/features/classes/hooks/use-classes";
import { useStudentProfiles } from "@/features/students/hooks/use-student-profiles";
import { localToday } from "@/features/students/demoData/profile-data";
import type { AttendanceDay, Shift, Student } from "@/features/students/types/types";

import { useAttendanceHydrated, useAttendanceStore } from "../store/attendance.store";
import { useTeacherAttendanceAll } from "./use-staff-attendance";

export type StudentRow = { student: Student; days: AttendanceDay[]; shift: Shift };

export type DayCounts = { total: number; present: number; late: number; absent: number; leave: number; unmarked: number; off: number; rate: number };

/** One person's record for a date. */
export const dayOf = (days: AttendanceDay[], date: string) => days.find((d) => d.date === date);

/** Totals for a date over people's attendance (off days are excluded from the rate). */
export function countDay(list: { days: AttendanceDay[] }[], date: string): DayCounts {
  const c = { total: list.length, present: 0, late: 0, absent: 0, leave: 0, unmarked: 0, off: 0, rate: 0 };
  for (const p of list) {
    const d = dayOf(p.days, date);
    if (!d) c.unmarked += 1;
    else if (d.status === "weekend" || d.status === "holiday") c.off += 1;
    else c[d.status] += 1;
  }
  const marked = c.present + c.late + c.absent + c.leave;
  c.rate = marked ? Math.round(((c.present + c.late) / marked) * 1000) / 10 : 0;
  return c;
}

/**
 * Everyone's attendance — students (full profiles), staff and sections — for
 * the school-wide registers and reports. TODO (backend phase): GET /attendance?date= · /attendance/report?month=
 */
export function useSchoolAttendance() {
  const { profiles, hydrated: studentsReady } = useStudentProfiles();
  const { staff, hydrated: staffReady } = useTeacherAttendanceAll();
  const { sections, hydrated: classesReady } = useClasses();
  const attendanceReady = useAttendanceHydrated();
  const selected = useAttendanceStore((s) => s.date);
  const setDate = useAttendanceStore((s) => s.setDate);
  const hydrated = studentsReady && staffReady && classesReady && attendanceReady;

  const students = useMemo<StudentRow[]>(
    () => [...profiles.values()].map(({ student, profile }) => ({ student, days: profile.attendance, shift: profile.shift })).sort((a, b) => a.student.className.localeCompare(b.student.className) || a.student.roll - b.student.roll),
    [profiles],
  );

  const today = hydrated ? localToday() : "";
  return { students, staff, sections, hydrated, today, date: selected ?? today, setDate };
}
