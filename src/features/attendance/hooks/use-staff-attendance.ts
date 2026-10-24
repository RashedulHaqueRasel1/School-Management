"use client";

import { useMemo } from "react";

import { teacherAttendance } from "@/features/teachers/hooks/use-teacher";
import { useTeachers } from "@/features/teachers/hooks/use-teachers";
import { useTeacherAdminStore } from "@/features/teachers/store/teacher-admin.store";
import type { AttendanceDay, Shift, Teacher } from "@/features/teachers/types/types";

export type StaffRow = { teacher: Teacher; days: AttendanceDay[]; shift: Shift };

/** Attendance of every active teacher (same rules as the teacher profile). */
export function useTeacherAttendanceAll() {
  const { teachers, hydrated } = useTeachers();
  const admin = useTeacherAdminStore();
  const staff = useMemo<StaffRow[]>(() => {
    if (!hydrated) return [];
    return teachers
      .filter((t) => t.status !== "left")
      .map((t) => {
        const a = teacherAttendance(t, admin);
        return { teacher: t, days: a.attendance, shift: a.shift };
      });
  }, [teachers, admin, hydrated]);
  return { staff, hydrated };
}
