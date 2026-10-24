import type { ExamSummary } from "@/features/examinations/hooks/use-exams";
import { RELIGION_SUBJECTS, gradeFor } from "@/features/students/demoData/profile-data";
import type { Student, StudentProfile } from "@/features/students/types/types";

export type MarksStore = Record<string, Record<string, Record<string, number>>>;

/** One subject a student sat. Religion papers share one column. */
export type SheetSubject = { code: string; name: string; column: string; fullMarks: number; passMarks: number };

export type SheetRow = {
  student: Student;
  subjects: SheetSubject[];
  /** column → obtained (undefined = not entered). */
  marks: Record<string, number | undefined>;
  entered: number;
  complete: boolean;
  total: number;
  outOf: number;
  gpa: number;
  grade: string;
  /** Subjects (columns) below pass marks. */
  failed: string[];
  /** Rank in the class by GPA then total (complete rows only). */
  position?: number;
};

export const RELIGION_COLUMN = "Religion";
export const columnOf = (name: string) => (RELIGION_SUBJECTS.includes(name) ? RELIGION_COLUMN : name);

export function gradeForGpa(gpa: number) {
  if (gpa >= 5) return "A+";
  if (gpa >= 4) return "A";
  if (gpa >= 3.5) return "A-";
  if (gpa >= 3) return "B";
  if (gpa >= 2) return "C";
  if (gpa >= 1) return "D";
  return "F";
}

export function remarksFor(gpa: number) {
  if (gpa >= 4.5) return "Excellent performance — keep it up!";
  if (gpa >= 4) return "Very good. Consistent effort across subjects.";
  if (gpa >= 3.5) return "Good. Can improve with regular practice.";
  if (gpa >= 3) return "Satisfactory. Needs more attention in weaker subjects.";
  if (gpa > 0) return "Needs improvement — guardian meeting recommended.";
  return "Did not pass every subject — remedial classes and a guardian meeting are required.";
}

/** Subject grade (fails below the exam's pass marks). */
export function subjectGrade(obtained: number, s: Pick<SheetSubject, "fullMarks" | "passMarks">) {
  if (obtained < s.passMarks) return { grade: "F", gp: 0 };
  return gradeFor((obtained / s.fullMarks) * 100);
}

/** Exams that can have results: running, held or published (not cancelled / upcoming). */
export const hasResults = (e: ExamSummary) => e.status === "ongoing" || e.status === "completed" || e.status === "published";

/**
 * Result rows for one class in one exam. Demo exams read the generated results
 * on the student profile (which already include admin corrections); exams created
 * by admins only have the marks entered in the Results module.
 */
export function buildSheet(exam: ExamSummary, className: string, profiles: Map<string, { student: Student; profile: StudentProfile }>, marks: MarksStore, customCodes: (studentId: string) => Set<string>): SheetRow[] {
  const sitting = exam.candidates.filter((s) => s.className === className && s.enrolledOn <= (exam.days[0] ?? exam.startDate));
  const rows = sitting.flatMap((student): SheetRow[] => {
    const profile = profiles.get(student.id)?.profile;
    if (!profile) return [];
    const result = profile.exams.find((e) => e.id === exam.id && e.status === "published");
    const subjects: SheetSubject[] = result
      ? result.results.map((r) => ({ code: r.code, name: r.subject, column: columnOf(r.subject), fullMarks: r.fullMarks, passMarks: Math.round(r.fullMarks * 0.33) }))
      : profile.subjects
          .filter((s) => !customCodes(student.id).has(s.code))
          .map((s) => ({ code: s.code, name: s.name, column: columnOf(s.name), fullMarks: exam.fullMarks, passMarks: exam.passMarks }));
    const entered = marks[student.id]?.[exam.id] ?? {};
    const values: Record<string, number | undefined> = {};
    for (const s of subjects) values[s.column] = result ? result.results.find((r) => r.code === s.code)?.obtained : entered[s.code];

    const filled = subjects.filter((s) => values[s.column] !== undefined);
    const grades = filled.map((s) => ({ s, ...subjectGrade(values[s.column]!, s) }));
    const failed = grades.filter((g) => g.gp === 0).map((g) => g.s.column);
    const complete = filled.length === subjects.length && subjects.length > 0;
    const gpa = !complete || failed.length ? 0 : Math.round((grades.reduce((sum, g) => sum + g.gp, 0) / grades.length) * 100) / 100;
    return [
      {
        student,
        subjects,
        marks: values,
        entered: filled.length,
        complete,
        total: filled.reduce((sum, s) => sum + values[s.column]!, 0),
        outOf: subjects.reduce((sum, s) => sum + s.fullMarks, 0),
        gpa,
        grade: complete ? gradeForGpa(gpa) : "—",
        failed,
      },
    ];
  });

  const ranked = rows.filter((r) => r.complete).sort((a, b) => b.gpa - a.gpa || b.total - a.total);
  for (const r of ranked) r.position = 1 + ranked.filter((o) => o.gpa > r.gpa || (o.gpa === r.gpa && o.total > r.total)).length;
  return rows.sort((a, b) => a.student.section.localeCompare(b.student.section) || a.student.roll - b.student.roll);
}

/** Column order for a sheet (union of every student's subjects, curriculum order). */
export function columnsOf(rows: SheetRow[]) {
  const cols: string[] = [];
  for (const r of rows) for (const s of r.subjects) if (!cols.includes(s.column)) cols.push(s.column);
  return cols;
}

export function summarize(rows: SheetRow[]) {
  const done = rows.filter((r) => r.complete);
  const passed = done.filter((r) => r.failed.length === 0);
  const papers = rows.reduce((s, r) => s + r.subjects.length, 0);
  return {
    students: rows.length,
    complete: done.length,
    entered: rows.reduce((s, r) => s + r.entered, 0),
    papers,
    progress: papers ? Math.round((rows.reduce((s, r) => s + r.entered, 0) / papers) * 100) : 0,
    avgGpa: done.length ? done.reduce((s, r) => s + r.gpa, 0) / done.length : 0,
    passRate: done.length ? Math.round((passed.length / done.length) * 100) : 0,
    aPlus: done.filter((r) => r.grade === "A+").length,
    failed: done.length - passed.length,
  };
}

export function downloadCsv(rows: (string | number)[][], fileName: string) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
