export type ExamType = "Term" | "Half Yearly" | "Annual" | "Class test" | "Model test";

/** Derived from the dates (+ admin actions). */
export type ExamStatus = "scheduled" | "ongoing" | "completed" | "published" | "cancelled";

/** Admin-editable exam settings. */
export type ExamSettings = {
  name: string;
  type: ExamType;
  /** First exam day (ISO). The schedule runs on school days from here. */
  startDate: string;
  classes: string[];
  /** Minutes from midnight. */
  startTime: number;
  fullMarks: number;
  passMarks: number;
  /** Shown on admit cards. */
  instructions: string;
};

export type Exam = ExamSettings & {
  /** "first-term" — the same id student results use. */
  id: string;
  slug: string;
  /** Created by an admin (no generated results). */
  custom: boolean;
  cancelled?: { reason: string; at: string };
  publishedAt?: string;
};

/** One paper of the exam routine. */
export type Paper = {
  id: string;
  className: string;
  subject: string;
  /** ISO date */
  date: string;
  /** Minutes from midnight. */
  start: number;
  /** Minutes. */
  duration: number;
};

export type ExamRoom = { id: string; name: string; capacity: number; invigilatorId?: string };

export type ExamAuditCategory = "settings" | "schedule" | "seating" | "admit" | "results";

export type ExamAudit = { id: string; examId: string; category: ExamAuditCategory; action: string; detail?: string; at: string; by: string };

export type ExamFilters = { search: string; status: ExamStatus | "all"; className: string };
