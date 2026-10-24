"use client";

import { uid } from "@/features/admissions/utils";
import { subjectsFor } from "@/features/students/demoData/profile-data";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { Student, Teacher as StudentTeacher } from "@/features/students/types/types";
import { seedAssignments } from "@/features/teachers/demoData/mock-data";
import { useTeacherAdminStore } from "@/features/teachers/store/teacher-admin.store";
import type { Teacher } from "@/features/teachers/types/types";

import { sectionLabel } from "../demoData/mock-data";
import { useClassAdminStore } from "../store/class-admin.store";
import type { ClassSection } from "../types/types";
import { sameSubject } from "./use-section";
import { toStudentTeacher } from "./use-classes";

/**
 * Section changes are written where the data lives: students (section, roll,
 * class teacher, subject teacher) and teachers (class assignments), so every
 * profile stays in sync. Each change is also logged on the section.
 */
export function useSectionActions() {
  const updateDetails = useStudentAdminStore((s) => s.updateDetails);
  const editSubject = useStudentAdminStore((s) => s.editSubject);
  const teacherAssignments = useTeacherAdminStore((s) => s.assignments);
  const setAssignments = useTeacherAdminStore((s) => s.setAssignments);
  const log = useClassAdminStore((s) => s.log);
  const saveSettings = useClassAdminStore((s) => s.saveSettings);

  return {
    /** BACKEND: POST /sections/:id/students/move  { studentIds, toSectionId } */
    move(students: Student[], from: ClassSection, to: ClassSection) {
      let roll = Math.max(0, ...to.students.map((s) => s.roll));
      for (const s of students) {
        roll += 1;
        updateDetails(s.id, { className: to.className, section: to.section, roll, classTeacher: to.classTeacher }, `Moved to ${sectionLabel(to.className, to.section)} · roll ${roll}`, "academic");
      }
      const names = students.map((s) => s.name).join(", ");
      log(from.key, "students", `${students.length} student(s) moved out`, `→ ${sectionLabel(to.className, to.section)}: ${names}`);
      log(to.key, "students", `${students.length} student(s) moved in`, `from ${sectionLabel(from.className, from.section)}: ${names}`);
    },

    /** Roll 1…n by name (A–Z) or keep the current order. BACKEND: PUT /sections/:id/rolls */
    renumber(section: ClassSection, order: "name" | "current") {
      const list = order === "name" ? [...section.students].sort((a, b) => a.name.localeCompare(b.name)) : section.students;
      list.forEach((s, i) => {
        if (s.roll !== i + 1) updateDetails(s.id, { roll: i + 1 }, `Roll changed ${s.roll} → ${i + 1}`, "academic");
      });
      log(section.key, "students", "Roll numbers re-assigned", order === "name" ? "Alphabetical order" : "Closed gaps, same order");
    },

    /** Change one student's roll (swaps with whoever holds it). */
    setRoll(section: ClassSection, student: Student, roll: number) {
      const holder = section.students.find((s) => s.roll === roll && s.id !== student.id);
      if (holder) updateDetails(holder.id, { roll: student.roll }, `Roll changed ${roll} → ${student.roll} (swap)`, "academic");
      updateDetails(student.id, { roll }, `Roll changed ${student.roll} → ${roll}`, "academic");
      log(section.key, "students", "Roll number changed", `${student.name}: ${student.roll} → ${roll}${holder ? ` (swapped with ${holder.name})` : ""}`);
    },

    /** BACKEND: PATCH /sections/:id { classTeacherId } — also updates every student's class teacher. */
    setClassTeacher(section: ClassSection, teacher: Teacher) {
      saveSettings(section.key, { classTeacherId: teacher.id }, "Class teacher changed", `${section.classTeacher.name} → ${teacher.name}`);
      const asStudentTeacher: StudentTeacher = toStudentTeacher(teacher);
      for (const s of section.students) updateDetails(s.id, { classTeacher: asStudentTeacher }, `Class teacher → ${teacher.name}`, "academic");
    },

    /**
     * Give a subject in this section to a teacher (removes it from the previous
     * teacher). BACKEND: PUT /sections/:id/subjects/:subject { teacherId, periodsPerWeek }
     */
    assignSubject(section: ClassSection, subject: string, periodsPerWeek: number, teacher: Teacher, previous: Teacher[]) {
      const current = (t: Teacher) => teacherAssignments[t.id] ?? seedAssignments(t);
      const matches = (a: { className: string; section: string; subject: string }) => a.className === section.className && a.section === section.section && sameSubject(a.subject, subject);
      for (const old of previous) {
        if (old.id === teacher.id) continue;
        setAssignments(old.id, current(old).filter((a) => !matches(a)), "Class unassigned", `${subject} · ${section.className} ${section.section} → ${teacher.name}`);
      }
      const mine = current(teacher);
      const existing = mine.find(matches);
      const next = existing
        ? mine.map((a) => (a === existing ? { ...a, periodsPerWeek } : a))
        : [...mine, { id: `${teacher.id}-${uid().slice(0, 6)}`, className: section.className, section: section.section, subject, periodsPerWeek }];
      setAssignments(teacher.id, next, existing ? "Class assignment changed" : "Class assigned", `${subject} · ${section.className} ${section.section} · ${periodsPerWeek} period(s)/week`);
      // Students see the new subject teacher (religion subjects differ per student, so they're left to the student profile).
      if (!subject.includes("Religion") && !subject.includes("Islam")) {
        for (const s of section.students) {
          const info = subjectsFor(section.className, "Islam").find((x) => sameSubject(x.name, subject));
          if (info) editSubject(s.id, info, { teacher: toStudentTeacher(teacher) });
        }
      }
      log(section.key, "subjects", `${subject} teacher set`, `${previous.filter((p) => p.id !== teacher.id).map((p) => p.name).join(", ") || "Unassigned"} → ${teacher.name} · ${periodsPerWeek}/week`);
    },

  };
}
