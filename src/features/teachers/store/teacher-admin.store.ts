import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CURRENT_USER } from "@/features/admissions/constants";
import { uid } from "@/features/admissions/utils";

import type {
  AttendanceOverride,
  PortalAccount,
  ReleaseRecord,
  SalaryPayment,
  SalarySettings,
  Teacher,
  TeacherAudit,
  TeacherAuditCategory,
  TeacherInput,
  TeacherLeave,
  TeachingAssignment,
} from "../types/types";

type LeaveState = Pick<TeacherLeave, "status" | "decision" | "substitute">;

type TeacherAdminState = {
  /** Teachers added by admins (demo teachers come from demoData). */
  added: Teacher[];
  /** Edits to any teacher, by ID. */
  details: Record<string, Partial<TeacherInput>>;
  attendance: Record<string, Record<string, AttendanceOverride>>;
  leaveRequests: TeacherLeave[];
  leaveState: Record<string, LeaveState>;
  /** Replaces the teacher's class assignments when set. */
  assignments: Record<string, TeachingAssignment[]>;
  salarySettings: Record<string, SalarySettings>;
  salaryPayments: Record<string, SalaryPayment[]>;
  accounts: Record<string, Partial<PortalAccount>>;
  releases: Record<string, ReleaseRecord>;
  audit: TeacherAudit[];

  addTeacher: (input: TeacherInput, ids: string[]) => Teacher;
  updateTeacher: (id: string, patch: Partial<TeacherInput>, action: string) => void;
  setAttendance: (id: string, date: string, value: AttendanceOverride | null, detail: string) => void;
  addLeave: (leave: TeacherLeave) => void;
  decideLeave: (leave: TeacherLeave, approved: boolean, note: string, substitute?: string) => void;
  setAssignments: (id: string, assignments: TeachingAssignment[], action: string, detail?: string) => void;
  setSalarySettings: (id: string, settings: SalarySettings) => void;
  paySalary: (id: string, payment: SalaryPayment) => void;
  updateAccount: (id: string, patch: Partial<PortalAccount>, action: string, detail?: string) => void;
  release: (id: string, record: ReleaseRecord) => void;
  rejoin: (id: string, reason: string) => void;
};

/**
 * Admin changes to teachers on top of the demo data (localStorage).
 * Every action writes an audit entry. BACKEND: see features/teachers/BACKEND.md
 */
export const useTeacherAdminStore = create<TeacherAdminState>()(
  persist(
    (set) => {
      const log = (teacherId: string, category: TeacherAuditCategory, action: string, detail?: string): TeacherAudit => ({
        id: uid(),
        teacherId,
        category,
        action,
        detail,
        at: new Date().toISOString(),
        by: CURRENT_USER,
      });

      return {
        added: [],
        details: {},
        attendance: {},
        leaveRequests: [],
        leaveState: {},
        assignments: {},
        salarySettings: {},
        salaryPayments: {},
        accounts: {},
        releases: {},
        audit: [],

        // BACKEND: POST /teachers
        addTeacher: (input, ids) => {
          const max = ids.reduce((m, id) => Math.max(m, Number(id.split("-").pop()) || 0), 0);
          const teacher: Teacher = { ...input, id: `TCH-${String(max + 1).padStart(3, "0")}` };
          set((s) => ({ added: [...s.added, teacher], audit: [log(teacher.id, "profile", "Teacher added", `${teacher.designation} · ${teacher.department}`), ...s.audit] }));
          return teacher;
        },

        // BACKEND: PATCH /teachers/:id
        updateTeacher: (id, patch, action) =>
          set((s) => ({ details: { ...s.details, [id]: { ...s.details[id], ...patch } }, audit: [log(id, "profile", action), ...s.audit] })),

        setAttendance: (id, date, value, detail) =>
          set((s) => {
            const current = { ...s.attendance[id] };
            if (value) current[date] = value;
            else delete current[date];
            return {
              attendance: { ...s.attendance, [id]: current },
              audit: [log(id, "attendance", value ? "Attendance corrected" : "Attendance correction removed", detail), ...s.audit],
            };
          }),

        addLeave: (leave) =>
          set((s) => ({ leaveRequests: [leave, ...s.leaveRequests], audit: [log(leave.teacherId, "leave", "Leave added by admin", `${leave.from} → ${leave.to}`), ...s.audit] })),

        // BACKEND: POST /teacher-leaves/:id/decision  { approved, note, substituteId }
        decideLeave: (leave, approved, note, substitute) =>
          set((s) => ({
            leaveState: {
              ...s.leaveState,
              [leave.id]: { status: approved ? "approved" : "rejected", decision: { by: CURRENT_USER, at: new Date().toISOString(), note }, substitute },
            },
            audit: [
              log(leave.teacherId, "leave", `Leave ${approved ? "approved" : "rejected"}`, `${leave.from} → ${leave.to}${substitute ? ` · substitute: ${substitute}` : ""}${note ? ` · ${note}` : ""}`),
              ...s.audit,
            ],
          })),

        // BACKEND: PUT /teachers/:id/assignments
        setAssignments: (id, assignments, action, detail) =>
          set((s) => ({ assignments: { ...s.assignments, [id]: assignments }, audit: [log(id, "classes", action, detail), ...s.audit] })),

        // BACKEND: PUT /teachers/:id/salary
        setSalarySettings: (id, settings) =>
          set((s) => ({
            salarySettings: { ...s.salarySettings, [id]: settings },
            audit: [log(id, "salary", "Salary structure updated", `Basic ৳ ${settings.basic.toLocaleString("en-US")}`), ...s.audit],
          })),

        // BACKEND: POST /teachers/:id/salary/payments  (payslip number generated server-side)
        paySalary: (id, payment) =>
          set((s) => ({
            salaryPayments: { ...s.salaryPayments, [id]: [payment, ...(s.salaryPayments[id] ?? [])] },
            audit: [log(id, "salary", `Salary paid · ${payment.slipNo}`, `৳ ${payment.net.toLocaleString("en-US")} for ${payment.month}`), ...s.audit],
          })),

        updateAccount: (id, patch, action, detail) =>
          set((s) => ({ accounts: { ...s.accounts, [id]: { ...s.accounts[id], ...patch } }, audit: [log(id, "account", action, detail), ...s.audit] })),

        // BACKEND: POST /teachers/:id/release  → status "left", experience certificate
        release: (id, record) =>
          set((s) => ({ releases: { ...s.releases, [id]: record }, audit: [log(id, "release", `${record.type} recorded · ${record.certNo}`, record.reason), ...s.audit] })),

        rejoin: (id, reason) =>
          set((s) => {
            const releases = { ...s.releases };
            delete releases[id];
            return { releases, audit: [log(id, "release", "Release cancelled — back to active", reason), ...s.audit] };
          }),
      };
    },
    { name: "teacher-admin-demo", skipHydration: true },
  ),
);

export function useTeacherAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useTeacherAdminStore.persist.onFinishHydration(onChange),
    () => useTeacherAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useTeacherAdminStore.persist.hasHydrated()) void useTeacherAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
