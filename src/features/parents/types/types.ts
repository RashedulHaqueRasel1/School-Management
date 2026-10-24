import type { GuardianInfo, Student, StudentAccount } from "@/features/students/types/types";

export type GuardianRole = GuardianInfo["role"];

/** One child this guardian is linked to. */
export type ParentLink = {
  student: Student;
  role: GuardianRole;
  relation: string;
  isPrimary: boolean;
  /** The child's full guardian list (needed to edit / unlink). */
  guardians: GuardianInfo[];
};

/**
 * A parent / guardian, identified by mobile number. Built from the guardians
 * of every student, so siblings share one parent record.
 */
export type Parent = {
  /** Normalized mobile number — the identity. */
  key: string;
  /** "PG-345678" (last 6 digits of the mobile) */
  id: string;
  name: string;
  phone: string;
  email: string;
  occupation: string;
  nid: string;
  roles: GuardianRole[];
  links: ParentLink[];
  /** Address of the (first) child. */
  address: string;
  /** All linked children have left the school. */
  inactive: boolean;
};

export type ParentProfile = {
  address?: string;
  preferredChannel: "sms" | "email" | "both";
  language: "Bangla" | "English";
  notes?: string;
  /** Set when an admin added the guardian here — no demo history for them. */
  createdAt?: string;
};

export type MessageChannel = "sms" | "email" | "both";

export type MessageTemplate = "general" | "fee" | "meeting" | "absence" | "result" | "event";

export type ParentMessage = {
  id: string;
  parentKey: string;
  template: MessageTemplate;
  channel: MessageChannel;
  subject: string;
  body: string;
  /** Child the message is about, if any. */
  studentName?: string;
  sentAt: string;
  sentBy: string;
  /** Sent to many parents at once from the list page. */
  bulk?: boolean;
  status: "delivered" | "sent" | "failed";
};

export type MeetingMode = "In person" | "Phone call" | "Online";

export type ParentMeeting = {
  id: string;
  parentKey: string;
  studentId: string;
  studentName: string;
  /** ISO date + "HH:MM" */
  date: string;
  time: string;
  mode: MeetingMode;
  withWhom: string;
  agenda: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  outcome?: string;
  createdAt: string;
  createdBy: string;
};

export type ParentAuditCategory = "profile" | "children" | "message" | "meeting" | "account";

export type ParentAudit = {
  id: string;
  parentKey: string;
  category: ParentAuditCategory;
  action: string;
  detail?: string;
  at: string;
  by: string;
};

export type ParentFilters = {
  search: string;
  view: "all" | "father" | "mother" | "guardian" | "multi" | "inactive";
  className: string;
  portal: "all" | "active" | "restricted";
  sort: "name" | "children" | "class";
};

export type { StudentAccount as PortalAccount };
