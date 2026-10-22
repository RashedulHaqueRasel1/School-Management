"use client";

import type { AccountSubject } from "../components/profile/admin/AccountDialogs";
import { useStudentAdminStore } from "../store/student-admin.store";
import type { Student } from "../types/types";

/** Wires the shared account dialogs to a student (SMS goes to the guardian). */
export function useStudentAccountSubject(student: Student | undefined): AccountSubject | undefined {
  const updateAccount = useStudentAdminStore((s) => s.updateAccount);
  if (!student) return undefined;
  return {
    name: student.name,
    kind: "student",
    smsTo: { name: student.guardianName, phone: student.phone },
    onUpdate: (patch, action, detail) => updateAccount(student.id, patch, action, detail),
  };
}
