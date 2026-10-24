"use client";

import { useMemo } from "react";

import type { AccountSubject } from "@/features/students/components/profile/admin/AccountDialogs";
import { DEFAULT_FEE_SETTINGS, buildTuitionLedger, seedTuitionPayments } from "@/features/students/demoData/fee-data";
import { classTeacherFor } from "@/features/students/demoData/profile-data";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";

import { seedParentMeetings, seedParentMessages } from "../demoData/mock-data";
import { useParentAdminStore } from "../store/parent-admin.store";
import type { ParentProfile } from "../types/types";
import { parentSlug } from "../utils";
import { useParents } from "./use-parents";

const DEFAULT_PROFILE: ParentProfile = { preferredChannel: "sms", language: "Bangla" };

/**
 * One guardian by URL slug with children, messages, meetings, account and audit.
 * TODO (backend phase): GET /parents/by-slug/:slug and sub-resources.
 */
export function useParent(slug: string) {
  const { parents, students, hydrated, accountOf, guardiansByStudent } = useParents();
  const admin = useParentAdminStore();
  const studentDetails = useStudentAdminStore((s) => s.details);
  const tuitionPayments = useStudentAdminStore((s) => s.tuitionPayments);
  const feeSettings = useStudentAdminStore((s) => s.feeSettings);
  const parent = useMemo(() => parents.find((p) => parentSlug(p) === slug), [parents, slug]);

  const data = useMemo(() => {
    if (!parent || !hydrated) return undefined;
    const teacherOf = (studentId: string) => {
      const student = students.find((s) => s.id === studentId);
      return studentDetails[studentId]?.classTeacher?.name ?? (student ? classTeacherFor(student).name : "Class teacher");
    };
    // Guardians added by an admin start with an empty history (demo history is for demo families only).
    const isNew = Boolean(admin.profiles[parent.key]?.createdAt);
    const messages = [...admin.messages.filter((m) => m.parentKey === parent.key), ...(isNew ? [] : seedParentMessages(parent))].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    const meetings = [...admin.meetings.filter((m) => m.parentKey === parent.key), ...(isNew ? [] : seedParentMeetings(parent, teacherOf))]
      .map((m) => ({ ...m, ...admin.meetingState[m.id] }))
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    // Tuition per child (same rules as the student's Fees tab).
    const ledgers = new Map(
      parent.links.map((l) => [
        l.student.id,
        buildTuitionLedger(l.student, [...seedTuitionPayments(l.student), ...(tuitionPayments[l.student.id] ?? [])], feeSettings[l.student.id] ?? DEFAULT_FEE_SETTINGS),
      ]),
    );
    const outstanding = parent.links.filter((l) => l.student.status !== "left").reduce((sum, l) => sum + (ledgers.get(l.student.id)?.outstanding ?? 0), 0);
    return {
      ledgers,
      outstanding,
      messages,
      meetings,
      teacherOf,
      account: accountOf(parent),
      profile: { ...DEFAULT_PROFILE, ...admin.profiles[parent.key] },
      audit: admin.audit.filter((a) => a.parentKey === parent.key),
    };
  }, [parent, hydrated, students, studentDetails, tuitionPayments, feeSettings, admin, accountOf]);

  const subject: AccountSubject | undefined = parent
    ? {
        name: parent.name,
        kind: "guardian",
        smsTo: { name: parent.name, phone: parent.phone },
        onUpdate: (patch, action, detail) => admin.updateAccount(parent.key, patch, action, detail),
      }
    : undefined;

  return { hydrated, parent, parents, students, guardiansByStudent, subject, ...data };
}
