import type { Gender, PaymentMethod } from "@/features/admissions/types/types";

export type Student = {
  id: string;
  name: string;
  photo: string | null;
  gender: Gender;
  /** ISO date (YYYY-MM-DD) */
  dateOfBirth: string;
  bloodGroup: string;
  className: string;
  section: string;
  roll: number;
  /** "Bangla" | "English" or a custom medium set by an admin. */
  version: string;
  /** "Morning" | "Day" or a custom shift name. */
  shift: string;
  guardianName: string;
  guardianRelation: string;
  phone: string;
  email: string;
  address: string;
  /** ISO date the student joined the school. */
  enrolledOn: string;
  /**
   * "admission" = joined through this session's admission (first fee payment);
   * "existing" = already studying at the school.
   */
  source: "admission" | "existing";
  /** Link back to the admission application (admission students only). */
  admissionHref?: string;
  admissionId?: string;
  /** Outstanding admission fee. */
  feeDue: number;
  /** "left" once a Transfer Certificate has been issued (record archived). */
  status?: "active" | "left";
};

export type StudentSort = "class" | "name" | "newest";

export type StudentFilters = {
  search: string;
  className: string;
  section: string;
  gender: Gender | "all";
  /** "left" shows archived students (TC issued); every other value shows current students only. */
  source: Student["source"] | "all" | "left";
  sort: StudentSort;
};

/* ------------------------------------------------------------------ */
/* Student profile (attendance, academics, guardians)                  */
/* ------------------------------------------------------------------ */

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "holiday" | "weekend";

export type AttendanceDay = {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  status: AttendanceStatus;
  /** "08:14 AM" */
  checkIn?: string;
  checkOut?: string;
  /** Minutes on campus. */
  minutes?: number;
  /** Holiday name / leave reason. */
  note?: string;
};

export type Shift = {
  name: string;
  /** Minutes from midnight. */
  start: number;
  end: number;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  designation: string;
  phone: string;
  email: string;
};

export type SubjectInfo = {
  code: string;
  name: string;
  teacher: Teacher;
  periodsPerWeek: number;
  /** Added by an admin (extra / optional course). Not part of past exam results. */
  custom?: boolean;
};

/** Admin change to a curriculum subject's teacher or periods. */
export type SubjectEdit = { teacher?: Teacher; periodsPerWeek?: number };

export type SubjectResult = {
  code: string;
  subject: string;
  fullMarks: number;
  obtained: number;
  /** Highest mark in the class for this subject. */
  highest: number;
  grade: string;
  gp: number;
};

export type ExamResult = {
  id: string;
  name: string;
  /** ISO date */
  heldOn: string;
  status: "published" | "upcoming" | "not-taken";
  results: SubjectResult[];
  total: number;
  outOf: number;
  gpa: number;
  grade: string;
  position: number;
  classSize: number;
  remarks: string;
};

export type GuardianInfo = {
  role: "Father" | "Mother" | "Local guardian";
  name: string;
  relation: string;
  occupation: string;
  phone: string;
  email: string;
  nid: string;
  isPrimary: boolean;
};

export type StudentProfile = {
  shift: Shift;
  /** Academic session, e.g. "2026–27". */
  session: string;
  attendance: AttendanceDay[];
  classTeacher: Teacher;
  subjects: SubjectInfo[];
  exams: ExamResult[];
  guardians: GuardianInfo[];
  religion: string;
  nationality: string;
  birthCertificateNo: string;
  studentNameBn: string;
  permanentAddress: string;
  medicalNotes: string;
};

/* ------------------------------------------------------------------ */
/* Admin controls (leave workflow, edits, account)                     */
/* ------------------------------------------------------------------ */

export type LeaveType = "sick" | "casual" | "family" | "other";

/** teacher → admin → approved | rejected */
export type LeaveStage = "teacher" | "admin" | "approved" | "rejected";

export type LeaveDecision = {
  by: string;
  role: "Class teacher" | "Admin";
  /** ISO date-time */
  at: string;
  approved: boolean;
  note: string;
};

export type LeaveRequest = {
  id: string;
  studentId: string;
  type: LeaveType;
  /** ISO dates, inclusive */
  from: string;
  to: string;
  reason: string;
  attachment?: string;
  /** ISO date-time */
  submittedAt: string;
  /** "Student portal" or the admin who filed it on the student's behalf. */
  submittedBy: string;
  stage: LeaveStage;
  teacherDecision?: LeaveDecision;
  adminDecision?: LeaveDecision;
};

/** Manual correction of one day's attendance by an admin. */
export type AttendanceOverride = {
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
};

/** Fields an admin can edit on a student. */
export type StudentDetailsPatch = Partial<
  Pick<
    Student,
    | "name"
    | "gender"
    | "dateOfBirth"
    | "bloodGroup"
    | "className"
    | "section"
    | "roll"
    | "version"
    | "shift"
    | "enrolledOn"
    | "address"
    | "guardianName"
    | "guardianRelation"
    | "phone"
    | "email"
  >
> &
  Partial<Pick<StudentProfile, "religion" | "nationality" | "birthCertificateNo" | "studentNameBn" | "permanentAddress" | "medicalNotes" | "session" | "classTeacher">> & {
    /** Custom shift timing, minutes from midnight. */
    shiftStart?: number;
    shiftEnd?: number;
  };

export type AuditCategory = "attendance" | "leave" | "academic" | "results" | "guardian" | "personal" | "account" | "fees" | "transfer";

export type AuditEntry = {
  id: string;
  studentId: string;
  category: AuditCategory;
  action: string;
  detail?: string;
  /** ISO date-time */
  at: string;
  by: string;
};

/**
 * Portal access:
 *  - suspended: temporary, ends automatically on `suspendedUntil`
 *  - blocked:   indefinite, until an admin unblocks
 *  - disabled:  account switched off (e.g. duplicate, left school)
 */
export type AccountStatus = "active" | "suspended" | "blocked" | "disabled";

/** Student portal login. Passwords are never stored — only reset metadata. */
export type StudentAccount = {
  username: string;
  status: AccountStatus;
  /** Reason for the current suspension / block / disable. */
  statusReason?: string;
  /** ISO date — last day of a suspension (inclusive). */
  suspendedUntil?: string;
  /** ISO date-time the status last changed. */
  statusChangedAt?: string;
  /** ISO date-time */
  lastLoginAt: string;
  passwordChangedAt: string;
  mustChangePassword: boolean;
};

/* ------------------------------------------------------------------ */
/* Tuition fees                                                        */
/* ------------------------------------------------------------------ */

export type TuitionPayment = {
  id: string;
  receiptNo: string;
  /** One payment can cover several months. */
  allocations: { month: string; amount: number }[];
  total: number;
  method: PaymentMethod;
  transactionId: string;
  /** ISO date */
  paidOn: string;
  receivedBy: string;
  note: string;
};

export type TuitionMonthStatus = "paid" | "partial" | "due" | "overdue" | "upcoming" | "waived";

export type TuitionMonth = {
  /** "2026-03" */
  month: string;
  label: string;
  /** ISO date the month's fee is due. */
  dueDate: string;
  /** Fee after discount. */
  fee: number;
  paid: number;
  due: number;
  status: TuitionMonthStatus;
  payments: TuitionPayment[];
};

export type FeeSettings = {
  /** 0–100 */
  discountPercent: number;
  discountReason: string;
};

export type TuitionLedger = {
  baseFee: number;
  settings: FeeSettings;
  months: TuitionMonth[];
  payments: TuitionPayment[];
  paidTotal: number;
  /** Unpaid amount for months already due (incl. the current month). */
  outstanding: number;
  sessionTotal: number;
  nextDue?: TuitionMonth;
};

/* ------------------------------------------------------------------ */
/* Transfer certificate                                                */
/* ------------------------------------------------------------------ */

export type TransferRecord = {
  tcNo: string;
  /** ISO date */
  issuedOn: string;
  leavingDate: string;
  reason: string;
  destinationSchool: string;
  conduct: string;
  /** Class completed / attending when leaving. */
  lastClass: string;
  remarks: string;
  /** Unpaid amount when the TC was issued. */
  duesAtIssue: number;
  duesWaived: boolean;
  issuedBy: string;
};
