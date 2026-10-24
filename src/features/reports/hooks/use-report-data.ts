"use client";

import { useMemo } from "react";

import { useAdmissionsHydrated, useAdmissionsStore } from "@/features/admissions/store/admissions.store";
import { useExams } from "@/features/examinations/hooks/use-exams";
import { useFees } from "@/features/fees/hooks/use-fees";
import { localToday } from "@/features/students/demoData/profile-data";
import { useStudentProfiles } from "@/features/students/hooks/use-student-profiles";

import { useStaffAttendance } from "./use-staff-salary";

/**
 * Everything the reports need, from every module (students, attendance, exams,
 * fees, admissions, staff & salary). TODO (backend phase): GET /reports/* aggregates
 */
export function useReportData() {
  const { profiles, students, hydrated: profilesReady } = useStudentProfiles();
  const { accounts, payments, hydrated: feesReady } = useFees();
  const { exams, hydrated: examsReady } = useExams();
  const { staff, hydrated: staffReady } = useStaffAttendance();
  const admissionsReady = useAdmissionsHydrated();
  const admissions = useAdmissionsStore((s) => s.admissions);
  const hydrated = profilesReady && feesReady && examsReady && staffReady && admissionsReady;

  const current = useMemo(() => students.filter((s) => s.status !== "left"), [students]);
  const learners = useMemo(() => [...profiles.values()], [profiles]);

  return { hydrated, today: hydrated ? localToday() : "", students: current, learners, accounts, payments, exams, staff, admissions };
}
