import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Hourglass,
  Search,
  Smartphone,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { BadgeTone } from "@/components/ui/badge";

import type { AdmissionFilters, AdmissionSort, AdmissionStatus, PaymentMethod } from "./types/types";

export const SCHOOL_NAME = "EduManage School";

/** Printed on receipts. Comes from Settings → School profile later. */
export const SCHOOL_INFO = {
  name: SCHOOL_NAME,
  address: "House 12, Road 7, Dhanmondi, Dhaka 1205",
  phone: "+880 1700-000000",
  email: "info@edumanage.school",
  website: "www.edumanage.school",
  eiin: "108765",
};
export const ACADEMIC_SESSION = "2026–27";

export const STATUS_CONFIG: Record<
  AdmissionStatus,
  { label: string; tone: BadgeTone; icon: LucideIcon; action: string; accent: string }
> = {
  pending: { label: "Pending", tone: "warning", icon: Clock, action: "Move to pending", accent: "bg-amber-50 text-amber-600" },
  in_review: { label: "In Review", tone: "info", icon: Search, action: "Start review", accent: "bg-indigo-50 text-indigo-600" },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2, action: "Approve", accent: "bg-emerald-50 text-emerald-600" },
  waitlisted: { label: "Waitlisted", tone: "violet", icon: Hourglass, action: "Move to waitlist", accent: "bg-violet-50 text-violet-600" },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle, action: "Reject", accent: "bg-rose-50 text-rose-600" },
};

export const STATUSES = Object.keys(STATUS_CONFIG) as AdmissionStatus[];

/** A written reason is mandatory for these decisions (it is sent to the guardian). */
export const REASON_REQUIRED: AdmissionStatus[] = ["rejected", "waitlisted"];

/** One-click reasons shown in the status dialog. */
export const QUICK_REASONS: Partial<Record<AdmissionStatus, string[]>> = {
  rejected: [
    "Did not pass the admission test",
    "Required documents are incomplete",
    "Age requirement for the class is not met",
    "No seats available in this class",
  ],
  waitlisted: [
    "Class capacity is currently full",
    "Waiting for admission test results",
    "Seat will be confirmed after current admissions close",
  ],
  in_review: [
    "Documents received — admission test will be scheduled",
    "Interview with guardian scheduled",
  ],
  approved: ["Passed the admission test", "All documents verified"],
};

export const CLASS_OPTIONS = [
  "Play",
  "Nursery",
  "KG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

export function defaultFeeFor(applyingClass: string) {
  if (["Play", "Nursery"].includes(applyingClass)) return 8000;
  if (applyingClass === "KG") return 9000;
  const grade = Number(applyingClass.replace(/\D/g, ""));
  return grade ? 10000 + grade * 500 : 10000;
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const RELIGIONS = ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"];

export const PAYMENT_METHODS: Record<
  PaymentMethod,
  { label: string; icon: LucideIcon; accent: string; needsReference: boolean; referenceLabel: string }
> = {
  cash: { label: "Cash", icon: Banknote, accent: "bg-emerald-50 text-emerald-600", needsReference: false, referenceLabel: "Reference" },
  bkash: { label: "bKash", icon: Smartphone, accent: "bg-pink-50 text-pink-600", needsReference: true, referenceLabel: "bKash TrxID" },
  nagad: { label: "Nagad", icon: Smartphone, accent: "bg-orange-50 text-orange-600", needsReference: true, referenceLabel: "Nagad TrxID" },
  rocket: { label: "Rocket", icon: Smartphone, accent: "bg-purple-50 text-purple-600", needsReference: true, referenceLabel: "Rocket TrxID" },
  bank: { label: "Bank", icon: Building2, accent: "bg-sky-50 text-sky-600", needsReference: true, referenceLabel: "Bank reference / slip no." },
  card: { label: "Card", icon: CreditCard, accent: "bg-indigo-50 text-indigo-600", needsReference: true, referenceLabel: "Card approval code" },
};

export const PAYMENT_METHOD_KEYS = Object.keys(PAYMENT_METHODS) as PaymentMethod[];

export const SORT_OPTIONS: { value: AdmissionSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
];

export const DEFAULT_FILTERS: AdmissionFilters = {
  search: "",
  status: "all",
  applyingClass: "all",
  gender: "all",
  fee: "all",
  sort: "newest",
};

/** Who is "signed in" in the demo. Comes from the session once auth exists. */
export const CURRENT_USER = "Admin User";
