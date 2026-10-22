import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CURRENT_USER } from "@/features/admissions/constants";
import { formatDate, uid } from "@/features/admissions/utils";

import type {
  AttendanceOverride,
  FeeSettings,
  TransferRecord,
  TuitionPayment,
  AuditCategory,
  AuditEntry,
  GuardianInfo,
  SubjectEdit,
  SubjectInfo,
  LeaveDecision,
  LeaveRequest,
  StudentAccount,
  StudentDetailsPatch,
} from "../types/types";

type LeaveState = Pick<LeaveRequest, "stage" | "teacherDecision" | "adminDecision">;

type StudentAdminState = {
  /** Edited student / profile fields, by student ID. */
  details: Record<string, StudentDetailsPatch>;
  guardians: Record<string, GuardianInfo[]>;
  /** studentId → date → correction */
  attendance: Record<string, Record<string, AttendanceOverride>>;
  /** studentId → examId → subjectCode → marks */
  marks: Record<string, Record<string, Record<string, number>>>;
  /** studentId → original subject → replacement */
  subjectSwaps: Record<string, Record<string, string>>;
  /** studentId → extra subjects added by admin */
  customSubjects: Record<string, SubjectInfo[]>;
  /** studentId → subject code → teacher / periods change */
  subjectEdits: Record<string, Record<string, SubjectEdit>>;
  /** Decisions on (seeded or created) leave requests, by request ID. */
  leaveState: Record<string, LeaveState>;
  /** Requests filed by an admin on a student's behalf. */
  leaveRequests: LeaveRequest[];
  accounts: Record<string, Partial<StudentAccount>>;
  /** Tuition payments recorded by admins (demo history is generated). */
  tuitionPayments: Record<string, TuitionPayment[]>;
  feeSettings: Record<string, FeeSettings>;
  /** Issued transfer certificates — the student is "left" / archived. */
  transfers: Record<string, TransferRecord>;
  audit: AuditEntry[];

  updateDetails: (studentId: string, patch: StudentDetailsPatch, action: string, category?: AuditCategory) => void;
  setGuardians: (studentId: string, guardians: GuardianInfo[], action: string) => void;
  setAttendance: (studentId: string, date: string, value: AttendanceOverride | null, detail: string) => void;
  setMarks: (studentId: string, examId: string, examName: string, marks: Record<string, number>) => void;
  swapSubject: (studentId: string, original: string, current: string, replacement: string) => void;
  saveCustomSubject: (studentId: string, subject: SubjectInfo, isNew: boolean) => void;
  removeCustomSubject: (studentId: string, subject: SubjectInfo) => void;
  editSubject: (studentId: string, subject: SubjectInfo, edit: SubjectEdit) => void;
  decideLeave: (request: LeaveRequest, role: LeaveDecision["role"], approved: boolean, note: string) => void;
  addLeave: (request: LeaveRequest) => void;
  updateAccount: (studentId: string, patch: Partial<StudentAccount>, action: string, detail?: string) => void;
  recordTuition: (studentId: string, payment: TuitionPayment, detail: string) => void;
  setFeeSettings: (studentId: string, settings: FeeSettings) => void;
  issueTC: (studentId: string, record: TransferRecord) => void;
  revokeTC: (studentId: string, reason: string) => void;
};

/**
 * Admin changes to students, kept on top of the demo data and saved to
 * localStorage. Every action writes an audit entry.
 * BACKEND: each action maps to a PATCH/POST on /students/:id/… and the server
 * keeps the audit log (who changed what, when).
 */
export const useStudentAdminStore = create<StudentAdminState>()(
  persist(
    (set) => {
      const log = (studentId: string, category: AuditCategory, action: string, detail?: string): AuditEntry => ({
        id: uid(),
        studentId,
        category,
        action,
        detail,
        at: new Date().toISOString(),
        by: CURRENT_USER,
      });

      return {
        details: {},
        guardians: {},
        attendance: {},
        marks: {},
        subjectSwaps: {},
        customSubjects: {},
        subjectEdits: {},
        leaveState: {},
        leaveRequests: [],
        accounts: {},
        tuitionPayments: {},
        feeSettings: {},
        transfers: {},
        audit: [],

        updateDetails: (studentId, patch, action, category = "personal") =>
          set((s) => ({
            details: { ...s.details, [studentId]: { ...s.details[studentId], ...patch } },
            audit: [log(studentId, category, action), ...s.audit],
          })),

        setGuardians: (studentId, guardians, action) =>
          set((s) => {
            const primary = guardians.find((g) => g.isPrimary) ?? guardians[0];
            return {
              guardians: { ...s.guardians, [studentId]: guardians },
              // Keep the student list's contact columns in sync with the primary guardian.
              details: primary
                ? {
                    ...s.details,
                    [studentId]: { ...s.details[studentId], guardianName: primary.name, guardianRelation: primary.relation, phone: primary.phone, email: primary.email },
                  }
                : s.details,
              audit: [log(studentId, "guardian", action), ...s.audit],
            };
          }),

        setAttendance: (studentId, date, value, detail) =>
          set((s) => {
            const current = { ...s.attendance[studentId] };
            if (value) current[date] = value;
            else delete current[date];
            return {
              attendance: { ...s.attendance, [studentId]: current },
              audit: [log(studentId, "attendance", value ? "Attendance corrected" : "Attendance correction removed", detail), ...s.audit],
            };
          }),

        setMarks: (studentId, examId, examName, marks) =>
          set((s) => ({
            marks: { ...s.marks, [studentId]: { ...s.marks[studentId], [examId]: { ...s.marks[studentId]?.[examId], ...marks } } },
            audit: [log(studentId, "results", `Marks updated · ${examName}`, `${Object.keys(marks).length} subject(s)`), ...s.audit],
          })),

        swapSubject: (studentId, original, current, replacement) =>
          set((s) => ({
            subjectSwaps: { ...s.subjectSwaps, [studentId]: { ...s.subjectSwaps[studentId], [original]: replacement } },
            audit: [log(studentId, "academic", "Subject changed", `${current} → ${replacement}`), ...s.audit],
          })),

        saveCustomSubject: (studentId, subject, isNew) =>
          set((s) => {
            const list = s.customSubjects[studentId] ?? [];
            return {
              customSubjects: {
                ...s.customSubjects,
                [studentId]: isNew ? [...list, subject] : list.map((x) => (x.code === subject.code ? subject : x)),
              },
              audit: [log(studentId, "academic", isNew ? "Subject added" : "Subject updated", `${subject.name} (${subject.code}) · ${subject.teacher.name}`), ...s.audit],
            };
          }),

        removeCustomSubject: (studentId, subject) =>
          set((s) => ({
            customSubjects: { ...s.customSubjects, [studentId]: (s.customSubjects[studentId] ?? []).filter((x) => x.code !== subject.code) },
            audit: [log(studentId, "academic", "Subject removed", `${subject.name} (${subject.code})`), ...s.audit],
          })),

        editSubject: (studentId, subject, rawEdit) =>
          set((s) => {
            // Keep only the fields that actually changed (undefined would erase the original).
            const edit = Object.fromEntries(Object.entries(rawEdit).filter(([, v]) => v !== undefined)) as SubjectEdit;
            return {
            subjectEdits: {
              ...s.subjectEdits,
              [studentId]: { ...s.subjectEdits[studentId], [subject.code]: { ...s.subjectEdits[studentId]?.[subject.code], ...edit } },
            },
            audit: [
              log(
                studentId,
                "academic",
                `Subject updated · ${subject.name}`,
                [edit.teacher && `Teacher: ${subject.teacher.name} → ${edit.teacher.name}`, edit.periodsPerWeek !== undefined && `${edit.periodsPerWeek} periods/week`].filter(Boolean).join(" · "),
              ),
              ...s.audit,
            ],
            };
          }),

        decideLeave: (request, role, approved, note) =>
          set((s) => {
            const decision: LeaveDecision = { by: CURRENT_USER, role, at: new Date().toISOString(), approved, note };
            // The admin's decision is final. An admin may also decide while it still waits for the teacher.
            const next: LeaveState =
              role === "Class teacher"
                ? { stage: approved ? "admin" : "rejected", teacherDecision: decision, adminDecision: request.adminDecision }
                : { stage: approved ? "approved" : "rejected", teacherDecision: request.teacherDecision, adminDecision: decision };
            return {
              leaveState: { ...s.leaveState, [request.id]: next },
              audit: [
                log(request.studentId, "leave", `Leave ${approved ? "approved" : "rejected"}${role === "Admin" && request.stage === "teacher" ? " (teacher step overridden)" : ""}`, `${formatDate(request.from)} → ${formatDate(request.to)}${note ? ` · ${note}` : ""}`),
                ...s.audit,
              ],
            };
          }),

        addLeave: (request) =>
          set((s) => ({
            leaveRequests: [request, ...s.leaveRequests],
            audit: [log(request.studentId, "leave", "Leave filed by admin", `${formatDate(request.from)} → ${formatDate(request.to)}`), ...s.audit],
          })),

        // BACKEND: POST /students/:id/tuition/payments  (receipt number generated server-side)
        recordTuition: (studentId, payment, detail) =>
          set((s) => ({
            tuitionPayments: { ...s.tuitionPayments, [studentId]: [payment, ...(s.tuitionPayments[studentId] ?? [])] },
            audit: [log(studentId, "fees", `Tuition received · ${payment.receiptNo}`, detail), ...s.audit],
          })),

        // BACKEND: PUT /students/:id/tuition/settings
        setFeeSettings: (studentId, settings) =>
          set((s) => ({
            feeSettings: { ...s.feeSettings, [studentId]: settings },
            audit: [
              log(studentId, "fees", "Fee discount updated", settings.discountPercent ? `${settings.discountPercent}% · ${settings.discountReason}` : "Discount removed"),
              ...s.audit,
            ],
          })),

        // BACKEND: POST /students/:id/transfer-certificate  → status "left", record archived
        issueTC: (studentId, record) =>
          set((s) => ({
            transfers: { ...s.transfers, [studentId]: record },
            audit: [
              log(studentId, "transfer", `Transfer certificate issued · ${record.tcNo}`, `${record.reason}${record.duesWaived ? ` · dues of ৳ ${record.duesAtIssue.toLocaleString("en-US")} waived` : ""}`),
              ...s.audit,
            ],
          })),

        // BACKEND: DELETE /students/:id/transfer-certificate  (re-admit; TC number is voided)
        revokeTC: (studentId, reason) =>
          set((s) => {
            const transfers = { ...s.transfers };
            const tcNo = transfers[studentId]?.tcNo;
            delete transfers[studentId];
            return { transfers, audit: [log(studentId, "transfer", `Transfer certificate cancelled · ${tcNo ?? ""}`, reason), ...s.audit] };
          }),

        updateAccount: (studentId, patch, action, detail) =>
          set((s) => ({
            accounts: { ...s.accounts, [studentId]: { ...s.accounts[studentId], ...patch } },
            audit: [log(studentId, "account", action, detail), ...s.audit],
          })),
      };
    },
    { name: "student-admin-demo", skipHydration: true },
  ),
);

export function useStudentAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useStudentAdminStore.persist.onFinishHydration(onChange),
    () => useStudentAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useStudentAdminStore.persist.hasHydrated()) void useStudentAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
