import type { DocumentFile, Gender, PaymentMethod } from "@/features/admissions/types/types";
import type { AttendanceDay, AttendanceOverride, Shift, StudentAccount } from "@/features/students/types/types";

export type EmploymentType = "Permanent" | "Contract" | "Part-time" | "Guest";

export type Teacher = {
  /** "TCH-001" */
  id: string;
  photo: string | null;
  name: string;
  gender: Gender;
  /** ISO date */
  dateOfBirth: string;
  bloodGroup: string;
  religion: string;
  nid: string;
  phone: string;
  email: string;
  presentAddress: string;
  permanentAddress: string;
  emergencyContact: { name: string; relation: string; phone: string };

  designation: string;
  department: string;
  employmentType: EmploymentType;
  /** ISO date */
  joinedOn: string;
  /** "Morning" | "Day" or custom */
  shift: string;
  /** Subjects the teacher is qualified to teach. */
  subjects: string[];
  qualification: { degree: string; institution: string; year: string };
  /** Years of experience before joining. */
  priorExperience: number;
  bankAccount: string;
  documents: DocumentFile[];
  /** Derived: "left" after resignation / termination is recorded. */
  status?: "active" | "left";
};

export type TeacherInput = Omit<Teacher, "id" | "status">;

export type TeachingAssignment = {
  id: string;
  className: string;
  section: string;
  subject: string;
  periodsPerWeek: number;
};

export type RoutineSlot = {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** 1-based period number */
  period: number;
  assignment: TeachingAssignment;
};

export type TeacherLeaveType = "casual" | "sick" | "earned" | "maternity" | "other";

export type TeacherLeave = {
  id: string;
  teacherId: string;
  type: TeacherLeaveType;
  from: string;
  to: string;
  reason: string;
  attachment?: string;
  /** ISO date-time */
  submittedAt: string;
  submittedBy: string;
  status: "pending" | "approved" | "rejected";
  decision?: { by: string; at: string; note: string };
  /** Teacher covering the classes while on leave. */
  substitute?: string;
};

export type SalarySettings = {
  basic: number;
  houseRentPercent: number;
  medical: number;
  transport: number;
  /** Provident fund, % of basic */
  pfPercent: number;
  /** Income tax, % of gross */
  taxPercent: number;
};

export type SalaryPayment = {
  id: string;
  slipNo: string;
  /** "2026-03" */
  month: string;
  basic: number;
  allowances: number;
  deductions: number;
  bonus: number;
  net: number;
  method: PaymentMethod;
  reference: string;
  /** ISO date */
  paidOn: string;
  paidBy: string;
  note: string;
};

export type SalaryMonth = {
  month: string;
  label: string;
  gross: number;
  deductions: number;
  net: number;
  status: "paid" | "pending" | "upcoming";
  payment?: SalaryPayment;
};

export type SalaryLedger = {
  settings: SalarySettings;
  gross: number;
  deductions: number;
  net: number;
  months: SalaryMonth[];
  payments: SalaryPayment[];
  paidThisYear: number;
  pending: number;
};

export type ReleaseType = "Resignation" | "Termination" | "Retirement" | "Contract ended";

export type ReleaseRecord = {
  certNo: string;
  type: ReleaseType;
  lastWorkingDay: string;
  reason: string;
  noticeServed: boolean;
  /** Unpaid salary settled on release. */
  settlement: number;
  handoverNote: string;
  conduct: string;
  issuedOn: string;
  issuedBy: string;
};

export type TeacherAuditCategory = "profile" | "attendance" | "leave" | "classes" | "salary" | "account" | "release";

export type TeacherAudit = {
  id: string;
  teacherId: string;
  category: TeacherAuditCategory;
  action: string;
  detail?: string;
  at: string;
  by: string;
};

export type { AttendanceDay, AttendanceOverride, Shift, StudentAccount as PortalAccount };

export type TeacherFilters = {
  search: string;
  department: string;
  designation: string;
  employmentType: EmploymentType | "all";
  /** active | on-leave | left */
  view: "active" | "on-leave" | "left";
  sort: "name" | "newest" | "id";
};
