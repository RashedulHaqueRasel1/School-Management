import { CURRENT_USER } from "@/features/admissions/constants";

import type { LeaveRequest, Student, Teacher } from "../types/types";
import { addDaysIso, hash, localToday, seeded } from "./profile-data";

/*
 * Demo leave requests submitted from the student portal. Each student gets one
 * already-approved request, one approved by the class teacher and waiting for
 * the admin, and one still waiting for the class teacher. Dates are relative to
 * today so the queue always looks current.
 * TODO (backend phase): GET /students/:id/leave-requests
 */
export function seedLeaveRequests(student: Student, teacher: Teacher): LeaveRequest[] {
  const random = seeded(hash(`${student.id}:leave`));
  const today = localToday();
  const number = student.id.split("-").pop();
  const at = (date: string, hour: number) => `${date}T${String(hour - 6).padStart(2, "0")}:15:00Z`;
  const requests: LeaveRequest[] = [];

  const past = addDaysIso(today, -9 - Math.floor(random() * 20));
  if (past > student.enrolledOn) {
    requests.push({
      id: `LV-${number}-1`,
      studentId: student.id,
      type: "sick",
      from: past,
      to: addDaysIso(past, 1),
      reason: "Fever and cold — the doctor advised two days of rest at home.",
      attachment: "medical-certificate.pdf",
      submittedAt: at(addDaysIso(past, -1), 20),
      submittedBy: "Student portal",
      stage: "approved",
      teacherDecision: { by: teacher.name, role: "Class teacher", at: at(addDaysIso(past, -1), 21), approved: true, note: "Guardian called the school as well. Recommended." },
      adminDecision: { by: CURRENT_USER, role: "Admin", at: at(past, 9), approved: true, note: "" },
    });
  }

  const soon = addDaysIso(today, 3 + Math.floor(random() * 4));
  requests.push({
    id: `LV-${number}-2`,
    studentId: student.id,
    type: "family",
    from: soon,
    to: addDaysIso(soon, 1),
    reason: "Attending my cousin's wedding in Cumilla with my family.",
    submittedAt: at(addDaysIso(today, -1), 19),
    submittedBy: "Student portal",
    stage: "admin",
    teacherDecision: { by: teacher.name, role: "Class teacher", at: at(today, 8), approved: true, note: "Good attendance record — recommended for approval." },
  });

  const later = addDaysIso(today, 11 + Math.floor(random() * 6));
  requests.push({
    id: `LV-${number}-3`,
    studentId: student.id,
    type: "casual",
    from: later,
    to: later,
    reason: "Dental appointment in the morning; will join after if possible.",
    submittedAt: at(today, 7),
    submittedBy: "Student portal",
    stage: "teacher",
  });

  return requests;
}
