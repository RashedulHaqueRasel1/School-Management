"use client";

import { useMemo } from "react";

import { classOrder } from "@/features/classes/demoData/mock-data";
import { DEFAULT_FEE_SETTINGS, buildTuitionLedger, seedTuitionPayments } from "@/features/students/demoData/fee-data";
import { localToday } from "@/features/students/demoData/profile-data";
import { useStudents } from "@/features/students/hooks/use-students";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { Student, TuitionLedger, TuitionPayment } from "@/features/students/types/types";

import { useFeesHydrated, useFeesStore } from "../store/fees.store";

export type FeeAccount = {
  student: Student;
  ledger: TuitionLedger;
  /** Unpaid past their due date (incl. part-paid). */
  overdue: number;
  overdueMonths: number;
  /** This month's fee still open (not yet overdue). */
  dueNow: number;
  lastPaid?: string;
  /** Latest reminder sent. */
  remindedAt?: string;
};

export type PaymentRow = TuitionPayment & { student: Student };

/**
 * Tuition accounts of every current student (same ledger as the student's Fees
 * tab) and every payment. TODO (backend phase): GET /fees/accounts · GET /fees/payments
 */
export function useFees() {
  const { students, hydrated: studentsReady } = useStudents();
  const feesReady = useFeesHydrated();
  const tuitionPayments = useStudentAdminStore((s) => s.tuitionPayments);
  const feeSettings = useStudentAdminStore((s) => s.feeSettings);
  const reminders = useFeesStore((s) => s.reminders);
  const hydrated = studentsReady && feesReady;

  const accounts = useMemo<FeeAccount[]>(() => {
    if (!hydrated) return [];
    const today = localToday();
    return students
      .filter((s) => s.status !== "left")
      .map((student) => {
        const ledger = buildTuitionLedger(student, [...seedTuitionPayments(student), ...(tuitionPayments[student.id] ?? [])], feeSettings[student.id] ?? DEFAULT_FEE_SETTINGS);
        const late = ledger.months.filter((m) => m.due > 0 && m.dueDate < today);
        return {
          student,
          ledger,
          overdue: late.reduce((s, m) => s + m.due, 0),
          overdueMonths: late.length,
          dueNow: ledger.months.filter((m) => m.due > 0 && m.month <= today.slice(0, 7) && m.dueDate >= today).reduce((s, m) => s + m.due, 0),
          lastPaid: ledger.payments[0]?.paidOn,
          remindedAt: reminders[student.id]?.[0],
        };
      })
      .sort((a, b) => classOrder(a.student.className) - classOrder(b.student.className) || a.student.section.localeCompare(b.student.section) || a.student.roll - b.student.roll);
  }, [hydrated, students, tuitionPayments, feeSettings, reminders]);

  const payments = useMemo<PaymentRow[]>(
    () => accounts.flatMap((a) => a.ledger.payments.map((p) => ({ ...p, student: a.student }))).sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.receiptNo.localeCompare(a.receiptNo)),
    [accounts],
  );

  return { accounts, payments, hydrated, today: hydrated ? localToday() : "" };
}
