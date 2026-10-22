"use client";

import { useMemo } from "react";

import { useAdmissionsStore } from "@/features/admissions/store/admissions.store";

import { DEFAULT_FEE_SETTINGS, buildTuitionLedger, seedTuitionPayments } from "../demoData/fee-data";
import { seedLeaveRequests } from "../demoData/leave-data";
import { addDaysIso, buildStudentProfile, classTeacherFor, hash, localToday } from "../demoData/profile-data";
import { useStudentAdminStore } from "../store/student-admin.store";
import type { StudentAccount } from "../types/types";
import { studentSlug } from "../utils";
import { useStudents } from "./use-students";

/**
 * One student (by URL slug) with their full profile and everything the admin
 * can manage: leave requests, account, audit log. Admin edits from
 * useStudentAdminStore are layered on top of the demo data.
 * TODO (backend phase): GET /students/by-slug/:slug (+ /attendance, /results, /leave-requests, /account).
 */
export function useStudent(slug: string) {
  const { students, hydrated } = useStudents();
  const admissions = useAdmissionsStore((s) => s.admissions);
  const admin = useStudentAdminStore();

  const student = useMemo(() => students.find((s) => studentSlug(s) === slug), [students, slug]);
  const admission = useMemo(
    () => (student?.admissionId ? admissions.find((a) => a.id === student.admissionId) : undefined),
    [admissions, student],
  );

  const leaveRequests = useMemo(() => {
    if (!student) return [];
    const seeded = seedLeaveRequests(student, admin.details[student.id]?.classTeacher ?? classTeacherFor(student));
    const created = admin.leaveRequests.filter((r) => r.studentId === student.id);
    return [...created, ...seeded]
      .map((r) => ({ ...r, ...admin.leaveState[r.id] }))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [student, admin.leaveRequests, admin.leaveState, admin.details]);

  const profile = useMemo(
    () =>
      student
        ? buildStudentProfile(student, students, admission, {
            details: admin.details[student.id],
            marks: admin.marks,
            subjectSwaps: admin.subjectSwaps[student.id],
            customSubjects: admin.customSubjects[student.id],
            subjectEdits: admin.subjectEdits[student.id],
            attendance: admin.attendance[student.id],
            approvedLeaves: leaveRequests.filter((r) => r.stage === "approved"),
            guardians: admin.guardians[student.id],
          })
        : undefined,
    [student, students, admission, admin.details, admin.marks, admin.subjectSwaps, admin.customSubjects, admin.subjectEdits, admin.attendance, admin.guardians, leaveRequests],
  );

  const tuition = useMemo(() => {
    if (!student) return undefined;
    const payments = [...seedTuitionPayments(student), ...(admin.tuitionPayments[student.id] ?? [])];
    return buildTuitionLedger(student, payments, admin.feeSettings[student.id] ?? DEFAULT_FEE_SETTINGS);
  }, [student, admin.tuitionPayments, admin.feeSettings]);

  const transfer = student ? admin.transfers[student.id] : undefined;

  const account = useMemo<StudentAccount | undefined>(() => {
    if (!student) return undefined;
    const seed = hash(student.id);
    const stored: StudentAccount = {
      username: student.id.replace(/-/g, "").toLowerCase(),
      status: "active",
      // Demo: a login within the last couple of days.
      lastLoginAt: `${addDaysIso(localToday(), -(seed % 3))}T${String(1 + (seed % 12)).padStart(2, "0")}:${String(seed % 60).padStart(2, "0")}:00Z`,
      passwordChangedAt: `${student.enrolledOn}T09:00:00Z`,
      mustChangePassword: false,
      ...admin.accounts[student.id],
    };
    // A suspension ends automatically after its last day.
    // BACKEND: enforce the same rule at login time.
    if (stored.status === "suspended" && stored.suspendedUntil && stored.suspendedUntil < localToday()) {
      return { ...stored, status: "active", statusReason: undefined, suspendedUntil: undefined };
    }
    return stored;
  }, [student, admin.accounts]);

  const audit = useMemo(() => (student ? admin.audit.filter((e) => e.studentId === student.id) : []), [student, admin.audit]);

  return { hydrated, student, admission, profile, leaveRequests, account, audit, tuition, transfer };
}
