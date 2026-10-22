import { CLASS_OPTIONS } from "@/features/admissions/constants";
import type { Admission } from "@/features/admissions/types/types";
import { admissionHref, contactOf, dueAmount, enrolledOn, isEnrolled, slugify } from "@/features/admissions/utils";

import type { Student, StudentFilters } from "./types/types";

export const SECTIONS = ["A", "B"];

/** URL slug: name + ID number, e.g. "tanvir-hasan-1041" (unique even for same names). */
export function studentSlug(s: Pick<Student, "id" | "name">) {
  return `${slugify(s.name) || "student"}-${s.id.split("-").pop()}`;
}

export type StudentTab = "attendance" | "leave" | "academics" | "fees" | "guardians" | "profile" | "account";

export function studentHref(s: Pick<Student, "id" | "name">, tab?: StudentTab) {
  return `/students/${studentSlug(s)}${tab ? `/${tab}` : ""}`;
}

export const DEFAULT_STUDENT_FILTERS: StudentFilters = {
  search: "",
  className: "all",
  section: "all",
  gender: "all",
  source: "all",
  sort: "class",
};

const classOrder = (className: string) => CLASS_OPTIONS.indexOf(className);

/** Paid applicant → student record (the admission stays the source of truth). */
function fromAdmission(a: Admission): Omit<Student, "roll" | "section"> {
  const contact = contactOf(a);
  return {
    id: `STU-2026-${a.id.split("-").pop()}`,
    name: a.studentName,
    photo: a.photo,
    gender: a.gender,
    dateOfBirth: a.dateOfBirth,
    bloodGroup: a.bloodGroup,
    className: a.applyingClass,
    version: a.version,
    shift: a.shift,
    guardianName: contact.name,
    guardianRelation: contact.relation,
    phone: contact.phone,
    email: contact.email,
    address: a.presentAddress,
    enrolledOn: enrolledOn(a) ?? a.appliedOn,
    source: "admission",
    admissionHref: admissionHref(a),
    admissionId: a.id,
    feeDue: dueAmount(a),
  };
}

/**
 * Existing students + every applicant with at least one payment.
 * Rolls are numbered per class & section; new students go to the smaller
 * section of their class and get the next roll number, in enrolment order.
 * BACKEND: this happens server-side when the first payment is recorded.
 */
export function buildStudents(existing: Omit<Student, "roll">[], admissions: Admission[]): Student[] {
  const counts = new Map<string, number>();
  const nextRoll = (className: string, section: string) => {
    const key = `${className}|${section}`;
    const roll = (counts.get(key) ?? 0) + 1;
    counts.set(key, roll);
    return roll;
  };

  const current = [...existing]
    .sort((a, b) => classOrder(a.className) - classOrder(b.className) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
    .map((s) => ({ ...s, roll: nextRoll(s.className, s.section) }));

  const admitted = admissions
    .filter(isEnrolled)
    .map(fromAdmission)
    .sort((a, b) => a.enrolledOn.localeCompare(b.enrolledOn) || a.id.localeCompare(b.id))
    .map((s) => {
      const section = SECTIONS.reduce((best, sec) =>
        (counts.get(`${s.className}|${sec}`) ?? 0) < (counts.get(`${s.className}|${best}`) ?? 0) ? sec : best,
      );
      return { ...s, section, roll: nextRoll(s.className, section) };
    });

  return [...current, ...admitted];
}

export function filterStudents(list: Student[], f: StudentFilters) {
  const query = f.search.trim().toLowerCase();
  const result = list.filter((s) => {
    if (f.className !== "all" && s.className !== f.className) return false;
    if (f.section !== "all" && s.section !== f.section) return false;
    if (f.gender !== "all" && s.gender !== f.gender) return false;
    // Students with a TC are archived: only the "left" view shows them.
    if (f.source === "left") {
      if (s.status !== "left") return false;
    } else {
      if (s.status === "left") return false;
      if (f.source !== "all" && s.source !== f.source) return false;
    }
    if (!query) return true;
    return [s.name, s.id, s.guardianName, s.phone, s.admissionId ?? ""].some((v) => v.toLowerCase().includes(query));
  });

  return result.sort((a, b) => {
    if (f.sort === "name") return a.name.localeCompare(b.name);
    if (f.sort === "newest") return b.enrolledOn.localeCompare(a.enrolledOn) || b.id.localeCompare(a.id);
    return classOrder(a.className) - classOrder(b.className) || a.section.localeCompare(b.section) || a.roll - b.roll;
  });
}

export function exportStudentsCsv(list: Student[]) {
  const header = ["Student ID", "Name", "Gender", "Date of Birth", "Class", "Section", "Roll", "Guardian", "Relation", "Phone", "Email", "Enrolled On", "Source", "Fee Due"];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = list.map((s) =>
    [s.id, s.name, s.gender, s.dateOfBirth, s.className, s.section, s.roll, s.guardianName, s.guardianRelation, s.phone, s.email, s.enrolledOn, s.source === "admission" ? "New admission" : "Existing", s.feeDue]
      .map(escape)
      .join(","),
  );
  const blob = new Blob([[header.map(escape).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
