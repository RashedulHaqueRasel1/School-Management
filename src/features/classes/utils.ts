import type { ClassSection } from "./types/types";

export type SectionTab = "students" | "subjects" | "routine" | "attendance" | "settings";

export const sectionHref = (s: Pick<ClassSection, "slug">, tab?: SectionTab) => `/classes/${s.slug}${tab ? `/${tab}` : ""}`;

export function exportSectionsCsv(list: ClassSection[]) {
  const header = ["Class", "Section", "Room", "Shift", "Version", "Students", "Capacity", "Boys", "Girls", "Class teacher"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = list.map((s) =>
    [s.className, s.section, s.settings.room, s.settings.shift, s.settings.version, s.students.length, s.settings.capacity, s.students.filter((x) => x.gender === "Male").length, s.students.filter((x) => x.gender === "Female").length, s.classTeacher.name]
      .map(esc)
      .join(","),
  );
  const blob = new Blob([[header.map(esc).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `class-sections-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
