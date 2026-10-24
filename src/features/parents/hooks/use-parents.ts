"use client";

import { useCallback, useMemo } from "react";

import { useAdmissionsStore } from "@/features/admissions/store/admissions.store";
import { normalizePhone } from "@/features/admissions/utils";
import { addDaysIso, guardiansFor, hash, localToday } from "@/features/students/demoData/profile-data";
import { useStudents } from "@/features/students/hooks/use-students";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { GuardianInfo } from "@/features/students/types/types";

import { useParentAdminHydrated, useParentAdminStore } from "../store/parent-admin.store";
import type { GuardianRole, Parent, PortalAccount } from "../types/types";

const ROLE_ORDER: GuardianRole[] = ["Father", "Mother", "Local guardian"];

/**
 * Every guardian of every student, grouped by mobile number — siblings share
 * one parent record. TODO (backend phase): GET /parents
 */
export function useParents() {
  const { students, hydrated: studentsReady } = useStudents();
  const parentsReady = useParentAdminHydrated();
  const admissions = useAdmissionsStore((s) => s.admissions);
  const guardianEdits = useStudentAdminStore((s) => s.guardians);
  const profiles = useParentAdminStore((s) => s.profiles);
  const accounts = useParentAdminStore((s) => s.accounts);

  const parents = useMemo<Parent[]>(() => {
    const byKey = new Map<string, Parent>();
    for (const student of students) {
      const admission = student.admissionId ? admissions.find((a) => a.id === student.admissionId) : undefined;
      const guardians = guardianEdits[student.id] ?? guardiansFor(student, admission);
      for (const g of guardians) {
        const key = normalizePhone(g.phone ?? "");
        if (!key) continue;
        let p = byKey.get(key);
        if (!p) {
          p = { key, id: `PG-${key.slice(-6)}`, name: g.name, phone: key, email: "", occupation: "", nid: "", roles: [], links: [], address: student.address, inactive: true };
          byKey.set(key, p);
        }
        p.email ||= g.email ?? "";
        p.occupation ||= g.occupation ?? "";
        p.nid ||= g.nid ?? "";
        if (!p.roles.includes(g.role)) p.roles.push(g.role);
        p.links.push({ student, role: g.role, relation: g.relation, isPrimary: g.isPrimary, guardians });
        if (student.status !== "left") p.inactive = false;
      }
    }
    return [...byKey.values()].map((p) => ({
      ...p,
      roles: ROLE_ORDER.filter((r) => p.roles.includes(r)),
      address: profiles[p.key]?.address || p.address,
    }));
  }, [students, admissions, guardianEdits, profiles]);

  const hydrated = studentsReady && parentsReady;

  /** Each student's current guardian list (for linking a guardian to another child). */
  const guardiansByStudent = useMemo(() => {
    const map = new Map<string, GuardianInfo[]>();
    for (const p of parents) for (const l of p.links) map.set(l.student.id, l.guardians);
    return map;
  }, [parents]);

  /** Guardian portal login (one account for all children). */
  const accountOf = useCallback(
    (p: Pick<Parent, "key">): PortalAccount => {
      const seed = hash(p.key);
      const today = hydrated ? localToday() : "2026-01-01";
      const stored: PortalAccount = {
        username: p.key,
        status: "active",
        lastLoginAt: `${addDaysIso(today, -(seed % 9))}T1${seed % 10}:${String(seed % 60).padStart(2, "0")}:00Z`,
        passwordChangedAt: "2026-01-05T09:00:00Z",
        mustChangePassword: false,
        ...accounts[p.key],
      };
      if (hydrated && stored.status === "suspended" && stored.suspendedUntil && stored.suspendedUntil < today) {
        return { ...stored, status: "active", statusReason: undefined, suspendedUntil: undefined };
      }
      return stored;
    },
    [accounts, hydrated],
  );

  return { parents, students, hydrated, accountOf, guardiansByStudent };
}
