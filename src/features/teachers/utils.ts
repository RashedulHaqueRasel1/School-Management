import { slugify } from "@/features/admissions/utils";

import type { Teacher, TeacherFilters } from "./types/types";

export type TeacherTab = "attendance" | "leave" | "classes" | "salary" | "profile" | "account" | "edit";

/** "mahmuda-akter-001" — name + staff number (unique even for same names). */
export function teacherSlug(t: Pick<Teacher, "id" | "name">) {
  return `${slugify(t.name) || "teacher"}-${t.id.split("-").pop()}`;
}

export function teacherHref(t: Pick<Teacher, "id" | "name">, tab?: TeacherTab) {
  return `/teachers/${teacherSlug(t)}${tab ? `/${tab}` : ""}`;
}

export const DEFAULT_TEACHER_FILTERS: TeacherFilters = {
  search: "",
  department: "all",
  designation: "all",
  employmentType: "all",
  view: "active",
  sort: "id",
};

export function yearsOfService(t: Pick<Teacher, "joinedOn">, today: string) {
  const years = Number(today.slice(0, 4)) - Number(t.joinedOn.slice(0, 4)) - (today.slice(5) < t.joinedOn.slice(5) ? 1 : 0);
  return Math.max(0, years);
}

export function filterTeachers(list: Teacher[], f: TeacherFilters, onLeave: Set<string>) {
  const q = f.search.trim().toLowerCase();
  return list
    .filter((t) => {
      if (f.view === "left" ? t.status !== "left" : t.status === "left") return false;
      if (f.view === "on-leave" && !onLeave.has(t.id)) return false;
      if (f.department !== "all" && t.department !== f.department) return false;
      if (f.designation !== "all" && t.designation !== f.designation) return false;
      if (f.employmentType !== "all" && t.employmentType !== f.employmentType) return false;
      if (!q) return true;
      return [t.name, t.id, t.phone, t.email, ...t.subjects].some((v) => v.toLowerCase().includes(q));
    })
    .sort((a, b) => (f.sort === "name" ? a.name.localeCompare(b.name) : f.sort === "newest" ? b.joinedOn.localeCompare(a.joinedOn) : a.id.localeCompare(b.id)));
}

export function exportTeachersCsv(list: Teacher[]) {
  const header = ["Staff ID", "Name", "Designation", "Department", "Employment", "Subjects", "Phone", "Email", "Joined On", "Shift", "Status"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = list.map((t) => [t.id, t.name, t.designation, t.department, t.employmentType, t.subjects.join("; "), t.phone, t.email, t.joinedOn, t.shift, t.status ?? "active"].map(esc).join(","));
  const blob = new Blob([[header.map(esc).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `teachers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** "12 years 3 months 14 days" between two ISO dates. */
export function serviceLength(from: string, to: string) {
  const [fy, fm, fd] = from.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = to.split("-").map(Number) as [number, number, number];
  let years = ty - fy;
  let months = tm - fm;
  let days = td - fd;
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(ty, tm - 1, 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return "Not joined yet";
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  return [years && part(years, "year"), months && part(months, "month"), part(days, "day")].filter(Boolean).join(" ");
}
