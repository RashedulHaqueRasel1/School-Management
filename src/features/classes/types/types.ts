import type { Student, Teacher as StudentTeacher } from "@/features/students/types/types";

export type ClassLevel = "Pre-primary" | "Primary" | "Secondary" | "Other";

/** Admin-editable settings of one class section. */
export type SectionSettings = {
  room: string;
  capacity: number;
  shift: string;
  version: string;
  /** Overrides the default class teacher. */
  classTeacherId?: string;
  note?: string;
};

export type ClassSection = {
  /** "Class 6::A" */
  key: string;
  /** "class-6-a" */
  slug: string;
  className: string;
  section: string;
  level: ClassLevel;
  settings: SectionSettings;
  /** Current (not left) students, by roll. */
  students: Student[];
  classTeacher: StudentTeacher;
  /** Created by an admin (not one of the standard A / B sections). */
  custom: boolean;
  archived: boolean;
};

/** One routine period; null = free period. */
export type RoutineCell = { subject: string; teacherId: string; teacherName: string } | null;

export type ClassAuditCategory = "settings" | "students" | "subjects" | "routine" | "attendance";

export type ClassAudit = {
  id: string;
  sectionKey: string;
  category: ClassAuditCategory;
  action: string;
  detail?: string;
  at: string;
  by: string;
};

export type ClassFilters = {
  search: string;
  level: ClassLevel | "all";
  shift: string;
  view: "active" | "archived";
};
