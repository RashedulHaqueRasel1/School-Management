"use client";

import { useMemo } from "react";

import { useAdmissionsStore } from "@/features/admissions/store/admissions.store";

import { useStudentAdminStore } from "../store/student-admin.store";
import type { Student, StudentProfile } from "../types/types";
import { studentLeaveRequests, studentProfileFor } from "./use-student";
import { useStudents } from "./use-students";

/**
 * Full profiles (subjects, results, attendance) of every current student, with
 * all admin edits — for school-wide views such as subject results.
 * TODO (backend phase): replace with aggregated API endpoints.
 */
export function useStudentProfiles() {
  const { students, hydrated } = useStudents();
  const admin = useStudentAdminStore();
  const admissions = useAdmissionsStore((s) => s.admissions);

  const profiles = useMemo(() => {
    const map = new Map<string, { student: Student; profile: StudentProfile }>();
    if (!hydrated) return map;
    for (const student of students) {
      if (student.status === "left") continue;
      const admission = student.admissionId ? admissions.find((a) => a.id === student.admissionId) : undefined;
      map.set(student.id, { student, profile: studentProfileFor(student, students, admission, admin, studentLeaveRequests(student, admin)) });
    }
    return map;
  }, [students, admissions, admin, hydrated]);

  return { profiles, students, hydrated };
}
