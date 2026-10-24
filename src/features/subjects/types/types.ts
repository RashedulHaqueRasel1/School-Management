import type { StudentProfile, Student } from "@/features/students/types/types";

export type SubjectType = "Core" | "Religion" | "Optional (4th)" | "Pre-primary" | "Elective";

/** Admin-editable subject settings. */
export type SubjectSettings = {
  /** Code prefix, e.g. "BAN" (full codes add class + order: BAN-601). */
  code: string;
  type: SubjectType;
  /** Classes the subject is taught in. */
  classes: string[];
  periodsPerWeek: number;
  fullMarks: number;
  passMarks: number;
  description: string;
};

export type Subject = SubjectSettings & {
  /** "bangla", "higher-mathematics" */
  slug: string;
  name: string;
  /** Added by an admin (not part of the national curriculum seed). */
  custom: boolean;
  archived: boolean;
};

export type TopicStatus = "completed" | "in-progress" | "upcoming";

export type SyllabusTopic = { id: string; title: string; status: TopicStatus; month?: string };

export type SubjectAuditCategory = "settings" | "teachers" | "syllabus" | "students";

export type SubjectAudit = { id: string; subject: string; category: SubjectAuditCategory; action: string; detail?: string; at: string; by: string };

export type SubjectFilters = { search: string; type: SubjectType | "all"; className: string; view: "active" | "archived" };

/** A student taking the subject, with their profile (for results). */
export type SubjectLearner = { student: Student; profile: StudentProfile };
