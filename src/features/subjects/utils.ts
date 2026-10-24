import type { SubjectType } from "./types/types";

export type SubjectTab = "classes" | "syllabus" | "results" | "settings";

export const subjectHref = (s: { slug: string }, tab?: SubjectTab) => `/subjects/${s.slug}${tab ? `/${tab}` : ""}`;

export const SUBJECT_TYPES: SubjectType[] = ["Core", "Religion", "Optional (4th)", "Pre-primary", "Elective"];

export const TYPE_TONE: Record<SubjectType, "info" | "violet" | "warning" | "success" | "neutral"> = {
  Core: "info",
  Religion: "violet",
  "Optional (4th)": "warning",
  "Pre-primary": "success",
  Elective: "neutral",
};

/** Accent for the subject's code tile. */
export const TYPE_ACCENT: Record<SubjectType, string> = {
  Core: "bg-indigo-50 text-indigo-700",
  Religion: "bg-violet-50 text-violet-700",
  "Optional (4th)": "bg-amber-50 text-amber-700",
  "Pre-primary": "bg-emerald-50 text-emerald-700",
  Elective: "bg-sky-50 text-sky-700",
};

export const scoreTone = (pct: number) => (pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-600");
