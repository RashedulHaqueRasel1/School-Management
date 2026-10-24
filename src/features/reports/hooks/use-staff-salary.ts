"use client";

import { useMemo } from "react";

import { teacherAttendance } from "@/features/teachers/hooks/use-teacher";
import { useTeachers } from "@/features/teachers/hooks/use-teachers";
import { buildSalaryLedger, defaultSalarySettings, seedSalaryPayments } from "@/features/teachers/demoData/mock-data";
import { useTeacherAdminStore } from "@/features/teachers/store/teacher-admin.store";
import type { AttendanceDay, SalaryLedger, Teacher } from "@/features/teachers/types/types";

export type StaffReportRow = { teacher: Teacher; days: AttendanceDay[]; salary: SalaryLedger };

/** Active teachers with attendance and salary ledger (same rules as the teacher profile). */
export function useStaffAttendance() {
  const { teachers, hydrated } = useTeachers();
  const admin = useTeacherAdminStore();
  const staff = useMemo<StaffReportRow[]>(() => {
    if (!hydrated) return [];
    return teachers
      .filter((t) => t.status !== "left")
      .map((t) => {
        const settings = admin.salarySettings[t.id] ?? defaultSalarySettings(t);
        return {
          teacher: t,
          days: teacherAttendance(t, admin).attendance,
          salary: buildSalaryLedger(t, settings, [...seedSalaryPayments(t, settings), ...(admin.salaryPayments[t.id] ?? [])]),
        };
      });
  }, [teachers, admin, hydrated]);
  return { staff, hydrated };
}
