"use client";

import { useMemo } from "react";

import { useAdmissionsHydrated, useAdmissionsStore } from "@/features/admissions/store/admissions.store";

import { existingStudents } from "../demoData/mock-data";
import { useStudentAdminHydrated, useStudentAdminStore } from "../store/student-admin.store";
import type { Student } from "../types/types";
import { buildStudents } from "../utils";

/**
 * All students: existing ones + applicants enrolled by their first payment,
 * with admin edits (section, shift, contact…) applied.
 * TODO (backend phase): replace with a TanStack Query hook — GET /students.
 */
export function useStudents() {
  const admissionsReady = useAdmissionsHydrated();
  const adminReady = useStudentAdminHydrated();
  const admissions = useAdmissionsStore((s) => s.admissions);
  const details = useStudentAdminStore((s) => s.details);
  const transfers = useStudentAdminStore((s) => s.transfers);

  const students = useMemo<Student[]>(
    () =>
      buildStudents(existingStudents, admissions).map((base) => {
        const s: Student = { ...base, status: transfers[base.id] ? "left" : "active" };
        const patch = details[s.id];
        if (!patch) return s;
        const { name, gender, dateOfBirth, bloodGroup, className, section, roll, version, shift, enrolledOn, address, guardianName, guardianRelation, phone, email } = patch;
        const studentFields = { name, gender, dateOfBirth, bloodGroup, className, section, roll, version, shift, enrolledOn, address, guardianName, guardianRelation, phone, email };
        return { ...s, ...Object.fromEntries(Object.entries(studentFields).filter(([, v]) => v !== undefined)) };
      }),
    [admissions, details, transfers],
  );

  return { students, hydrated: admissionsReady && adminReady };
}
