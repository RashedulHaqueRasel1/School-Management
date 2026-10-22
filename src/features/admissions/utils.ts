import { PAYMENT_METHODS, SCHOOL_NAME, STATUS_CONFIG } from "./constants";
import type {
  Admission,
  AdmissionFilters,
  AdmissionInput,
  AdmissionStatus,
  Payment,
  PaymentStatus,
} from "./types/types";

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Dhaka",
});

/** "2026-10-21" → "21 Oct 2026" (UTC, so server and client render the same). */
export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTaka(amount: number) {
  return `৳ ${amount.toLocaleString("en-US")}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ageFrom(isoDate: string) {
  const dob = new Date(`${isoDate}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  if (now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ------------------------------------------------------------------ */
/* URLs                                                                */
/* ------------------------------------------------------------------ */

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * URL slug: student name + application number, e.g. "ayesha-rahman-1042".
 * The number keeps two students with the same name on separate pages.
 */
export function slugFor(a: Pick<Admission, "id" | "studentName">) {
  return `${slugify(a.studentName) || "student"}-${a.id.split("-").pop()}`;
}

/** Printable money receipt (opens outside the dashboard layout). */
export function receiptHref(receiptNo: string, autoPrint = false) {
  return `/receipts/${receiptNo}${autoPrint ? "?print=1" : ""}`;
}

export function admissionHref(a: Pick<Admission, "id" | "studentName">) {
  return `/admissions/${slugFor(a)}`;
}

/* ------------------------------------------------------------------ */
/* Derived data                                                        */
/* ------------------------------------------------------------------ */

/** The person who receives SMS / email updates. */
export function contactOf(a: Pick<Admission, "primaryContact" | "father" | "mother" | "localGuardian">) {
  if (a.primaryContact === "father") return { name: a.father.name, relation: "Father", phone: a.father.phone, email: a.father.email };
  if (a.primaryContact === "mother") return { name: a.mother.name, relation: "Mother", phone: a.mother.phone, email: a.mother.email };
  return { ...a.localGuardian, relation: a.localGuardian.relation || "Guardian" };
}

/**
 * Payment history is permanent (financial audit trail), so an application that
 * has received any payment can never be deleted.
 */
export function canDelete(a: Pick<Admission, "payments">) {
  return a.payments.length === 0;
}

/**
 * Once the first payment is recorded the applicant is enrolled as a student and
 * the admission decision is final — the status can never be changed again.
 */
export function isEnrolled(a: Pick<Admission, "payments">) {
  return a.payments.length > 0;
}

export const isStatusLocked = isEnrolled;

/** Date the applicant became a student (first payment). */
export function enrolledOn(a: Pick<Admission, "payments">) {
  return a.payments.reduce<string | null>((min, p) => (!min || p.paidOn < min ? p.paidOn : min), null);
}

export function paidAmount(a: Pick<Admission, "payments">) {
  return a.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function dueAmount(a: Pick<Admission, "payments" | "admissionFee">) {
  return Math.max(0, a.admissionFee - paidAmount(a));
}

export function paymentStatusOf(a: Pick<Admission, "payments" | "admissionFee">): PaymentStatus {
  const paid = paidAmount(a);
  if (paid <= 0) return "unpaid";
  return paid >= a.admissionFee ? "paid" : "partial";
}

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, { label: string; tone: "success" | "warning" | "neutral" }> = {
  paid: { label: "Paid", tone: "success" },
  partial: { label: "Partial", tone: "warning" },
  unpaid: { label: "Unpaid", tone: "neutral" },
};

/* ------------------------------------------------------------------ */
/* Guardian message templates                                          */
/* ------------------------------------------------------------------ */

/** Default SMS / email text for a status change. The admin can edit it before sending. */
export function buildStatusMessage(status: AdmissionStatus, a: Admission, reason: string) {
  const guardian = contactOf(a).name || "Guardian";
  const who = `${a.studentName} (${a.id})`;
  const why = reason.trim() ? ` Reason: ${reason.trim().replace(/\.?$/, ".")}` : "";
  const sign = ` — ${SCHOOL_NAME}`;

  switch (status) {
    case "in_review":
      return `Dear ${guardian}, the admission application of ${who} for ${a.applyingClass} is now under review. We will inform you about the next steps soon.${sign}`;
    case "approved":
      return `Congratulations! The admission of ${who} for ${a.applyingClass} has been APPROVED. Please pay the admission fee of ${formatTaka(dueAmount(a))} to confirm the seat.${sign}`;
    case "waitlisted":
      return `Dear ${guardian}, the application of ${who} for ${a.applyingClass} has been placed on the WAITING LIST.${why} We will notify you as soon as a seat is available.${sign}`;
    case "rejected":
      return `Dear ${guardian}, we regret to inform you that the application of ${who} for ${a.applyingClass} could not be accepted.${why}${sign}`;
    default:
      return `Dear ${guardian}, the application of ${who} has been moved back to pending. We will update you shortly.${sign}`;
  }
}

export function buildPaymentMessage(a: Admission, payment: Pick<Payment, "amount" | "method" | "receiptNo">, dueAfter: number) {
  const due = dueAfter > 0 ? ` Remaining due: ${formatTaka(dueAfter)}.` : " Admission fee is fully paid.";
  return `Payment received: ${formatTaka(payment.amount)} for ${a.studentName} (${a.id}) via ${PAYMENT_METHODS[payment.method].label}. Receipt ${payment.receiptNo}.${due} Thank you. — ${SCHOOL_NAME}`;
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number) {
  return n < 20 ? ONES[n]! : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function belowThousand(n: number) {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

/** 15250 → "Fifteen Thousand Two Hundred Fifty Taka Only" (Bangladeshi lakh/crore system). */
export function amountInWords(amount: number) {
  let n = Math.floor(amount);
  if (n <= 0) return "Zero Taka Only";
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const parts = [
    crore ? `${belowThousand(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    n ? belowThousand(n) : "",
  ];
  return `${parts.filter(Boolean).join(" ")} Taka Only`;
}

/** Standard SMS is 160 GSM characters per part (153 when split). */
export function smsSegments(text: string) {
  return text.length <= 160 ? 1 : Math.ceil(text.length / 153);
}

/* ------------------------------------------------------------------ */
/* List filtering                                                      */
/* ------------------------------------------------------------------ */

export function filterAdmissions(list: Admission[], filters: AdmissionFilters) {
  const query = filters.search.trim().toLowerCase();

  const result = list.filter((a) => {
    if (filters.status !== "all" && a.status !== filters.status) return false;
    if (filters.applyingClass !== "all" && a.applyingClass !== filters.applyingClass) return false;
    if (filters.gender !== "all" && a.gender !== filters.gender) return false;
    if (filters.fee !== "all" && paymentStatusOf(a) !== filters.fee) return false;
    if (!query) return true;
    const contact = contactOf(a);
    return [a.studentName, a.id, a.father.name, a.mother.name, contact.name, contact.phone, contact.email, a.applyingClass].some(
      (field) => field.toLowerCase().includes(query),
    );
  });

  return result.sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return a.appliedOn.localeCompare(b.appliedOn) || a.id.localeCompare(b.id);
      case "name-asc":
        return a.studentName.localeCompare(b.studentName);
      case "name-desc":
        return b.studentName.localeCompare(a.studentName);
      default:
        return b.appliedOn.localeCompare(a.appliedOn) || b.id.localeCompare(a.id);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type FormErrors = Record<string, string>;

const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(phone: string) {
  return phone.replace(/[\s-]/g, "").replace(/^\+?88/, "");
}

/** Only the essentials are required; everything else is validated if filled in. */
export function validateAdmission(v: AdmissionInput): FormErrors {
  const e: FormErrors = {};
  const phone = (key: string, value: string, required: boolean) => {
    if (!value.trim()) {
      if (required) e[key] = "Mobile number is required — status updates are sent here.";
    } else if (!PHONE_RE.test(normalizePhone(value))) e[key] = "Enter a valid 11-digit BD mobile number.";
  };
  const email = (key: string, value: string) => {
    if (value.trim() && !EMAIL_RE.test(value.trim())) e[key] = "Enter a valid email address.";
  };

  if (v.studentName.trim().length < 3) e.studentName = "Enter the student's full name.";
  if (!v.dateOfBirth) e.dateOfBirth = "Date of birth is required.";
  else if (v.dateOfBirth >= todayIso()) e.dateOfBirth = "Date of birth must be in the past.";
  if (!v.applyingClass) e.applyingClass = "Select the class.";

  if (v.father.name.trim().length < 3) e["father.name"] = "Enter the father's name.";
  if (v.mother.name.trim().length < 3) e["mother.name"] = "Enter the mother's name.";
  phone("father.phone", v.father.phone, v.primaryContact === "father");
  phone("mother.phone", v.mother.phone, v.primaryContact === "mother");
  email("father.email", v.father.email);
  email("mother.email", v.mother.email);

  if (v.primaryContact === "guardian") {
    if (v.localGuardian.name.trim().length < 3) e["localGuardian.name"] = "Enter the guardian's name.";
    if (!v.localGuardian.relation.trim()) e["localGuardian.relation"] = "Relation is required.";
    phone("localGuardian.phone", v.localGuardian.phone, true);
    email("localGuardian.email", v.localGuardian.email);
  }

  if (v.presentAddress.trim().length < 5) e.presentAddress = "Present address is required.";
  if (!Number.isFinite(v.admissionFee) || v.admissionFee < 0) e.admissionFee = "Enter a valid amount.";
  return e;
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function exportAdmissionsCsv(list: Admission[]) {
  const header = ["ID", "Student", "Gender", "Date of Birth", "Class", "Father", "Mother", "Contact", "Phone", "Email", "Applied On", "Status", "Fee", "Paid", "Due"];
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = list.map((a) => {
    const c = contactOf(a);
    return [a.id, a.studentName, a.gender, a.dateOfBirth, a.applyingClass, a.father.name, a.mother.name, c.name, c.phone, c.email, a.appliedOn, STATUS_CONFIG[a.status].label, a.admissionFee, paidAmount(a), dueAmount(a)]
      .map(escape)
      .join(",");
  });
  const blob = new Blob([[header.map(escape).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `admissions-${todayIso()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
