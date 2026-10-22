import { CURRENT_USER } from "@/features/admissions/constants";
import type { PaymentMethod } from "@/features/admissions/types/types";

import type { FeeSettings, Student, TuitionLedger, TuitionMonth, TuitionPayment } from "../types/types";
import { SESSION_START, hash, localToday, seeded } from "./profile-data";

/*
 * Monthly tuition fees. The fee schedule depends on the class; demo payments
 * are generated per student (deterministic) and admin-recorded payments are
 * added on top. TODO (backend phase): GET /students/:id/tuition
 */

/** Fee is due by this day of each month; unpaid after it = overdue. */
export const TUITION_DUE_DAY = 10;

export const SESSION_END_MONTH = "2026-12";

export const DEFAULT_FEE_SETTINGS: FeeSettings = { discountPercent: 0, discountReason: "" };

export function monthlyFeeFor(className: string) {
  if (["Play", "Nursery", "KG"].includes(className)) return 2000;
  const grade = Number(className.replace(/\D/g, "")) || 0;
  if (grade <= 5) return 2500;
  if (grade <= 8) return 3000;
  return 3500;
}

export function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Session months the student is billed for (from enrolment to December). */
export function billedMonths(student: Pick<Student, "enrolledOn">) {
  const start = (student.enrolledOn > SESSION_START ? student.enrolledOn : SESSION_START).slice(0, 7);
  const months: string[] = [];
  for (let m = start; m <= SESSION_END_MONTH; m = nextMonth(m)) months.push(m);
  return months;
}

const studentNumber = (student: Pick<Student, "id">) => student.id.split("-").pop()!;

export function tuitionReceiptPrefix(student: Pick<Student, "id">) {
  return `TF-${studentNumber(student)}-`;
}

const METHODS: PaymentMethod[] = ["bkash", "cash", "nagad", "bkash", "bank", "rocket", "cash"];

/** Demo history: most past months paid on time, a few late, partial or unpaid. */
export function seedTuitionPayments(student: Student): TuitionPayment[] {
  const random = seeded(hash(`${student.id}:tuition`));
  const today = localToday();
  const current = today.slice(0, 7);
  const fee = monthlyFeeFor(student.className);
  const payments: TuitionPayment[] = [];

  for (const month of billedMonths(student)) {
    if (month > current) break;
    const roll = random();
    const isCurrent = month === current;
    if (isCurrent && (Number(today.slice(8, 10)) < 4 || roll > 0.55)) continue; // not paid yet this month
    if (!isCurrent && roll > 0.9) continue; // skipped month → overdue
    const amount = !isCurrent && roll > 0.82 ? fee / 2 : fee;
    const day = Math.min(28, 2 + Math.floor(random() * (roll > 0.75 ? 20 : 9)));
    const paidOn = `${month}-${String(day).padStart(2, "0")}`;
    if (paidOn > today || paidOn < student.enrolledOn) continue;
    const method = METHODS[Math.floor(random() * METHODS.length)]!;
    payments.push({
      id: `tf-${student.id}-${month}`,
      receiptNo: `${tuitionReceiptPrefix(student)}${month.replace("-", "")}`,
      allocations: [{ month, amount }],
      total: amount,
      method,
      transactionId: method === "cash" ? "" : `${["BK", "NG", "8F", "RK"][Math.floor(random() * 4)]}${Math.floor(random() * 1e8).toString(36).toUpperCase()}`,
      paidOn,
      receivedBy: CURRENT_USER,
      note: amount < fee ? "Part payment — balance next month" : "",
    });
  }
  return payments;
}

/** Month-by-month ledger: fee, paid, due and status. */
export function buildTuitionLedger(student: Student, payments: TuitionPayment[], settings: FeeSettings): TuitionLedger {
  const today = localToday();
  const current = today.slice(0, 7);
  const baseFee = monthlyFeeFor(student.className);
  const fee = Math.round(baseFee * (1 - settings.discountPercent / 100));

  const months: TuitionMonth[] = billedMonths(student).map((month) => {
    const monthPayments = payments.filter((p) => p.allocations.some((a) => a.month === month));
    const paid = monthPayments.reduce((sum, p) => sum + p.allocations.filter((a) => a.month === month).reduce((s, a) => s + a.amount, 0), 0);
    const dueDate = `${month}-${String(TUITION_DUE_DAY).padStart(2, "0")}`;
    const due = Math.max(0, fee - paid);
    const status: TuitionMonth["status"] =
      fee === 0 ? "waived" : due === 0 ? "paid" : paid > 0 ? "partial" : month > current ? "upcoming" : today <= dueDate ? "due" : "overdue";
    return { month, label: monthLabel(month), dueDate, fee, paid, due, status, payments: monthPayments };
  });

  const outstanding = months.filter((m) => m.month <= current).reduce((sum, m) => sum + m.due, 0);
  return {
    baseFee,
    settings,
    months,
    payments: [...payments].sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.receiptNo.localeCompare(a.receiptNo)),
    paidTotal: payments.reduce((sum, p) => sum + p.total, 0),
    outstanding,
    sessionTotal: months.reduce((sum, m) => sum + m.fee, 0),
    nextDue: months.find((m) => m.due > 0),
  };
}
