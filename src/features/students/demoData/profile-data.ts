import { ACADEMIC_SESSION } from "@/features/admissions/constants";
import type { Admission } from "@/features/admissions/types/types";

import type {
  AttendanceDay,
  AttendanceOverride,
  LeaveRequest,
  LeaveType,
  StudentDetailsPatch,
  SubjectEdit,
  AttendanceStatus,
  ExamResult,
  GuardianInfo,
  Shift,
  Student,
  StudentProfile,
  SubjectInfo,
  Teacher,
  WeekendPlan,
} from "../types/types";

/*
 * Deterministic demo data for the student profile. Every number comes from a
 * seeded random generator keyed by the student ID, so a student always shows
 * the same attendance and marks. Replace with API data later:
 *   GET /students/:id/attendance?month=  ·  GET /students/:id/results  ·  GET /classes/:class/subjects
 */

/* ------------------------------------------------------------------ */
/* Seeded random                                                       */
/* ------------------------------------------------------------------ */

export function hash(text: string) {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* School calendar                                                     */
/* ------------------------------------------------------------------ */

export const SESSION_START = "2026-01-01";

/** Weekly off days (0 = Sunday … 6 = Saturday). */
export const WEEKEND_DAYS = [5];

export const DEFAULT_WEEKEND: WeekendPlan = { days: WEEKEND_DAYS, swaps: [] };

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Why `date` is a day off for someone with this weekend plan, or null if it's a
 * working day. One-time swaps win over the weekly pattern. (Holidays are separate.)
 */
export function offDayNote(date: string, plan: WeekendPlan = DEFAULT_WEEKEND): string | null {
  const swappedOff = plan.swaps.find((s) => s.offOn === date);
  if (swappedOff) return `Swapped day off (works ${swappedOff.workOn.slice(8)}/${swappedOff.workOn.slice(5, 7)})`;
  if (plan.swaps.some((s) => s.workOn === date)) return null;
  return plan.days.includes(weekdayOf(date)) ? "Weekend" : null;
}

export const isOffDay = (date: string, plan?: WeekendPlan) => offDayNote(date, plan) !== null;

/** Standard shifts. Admins can also set a custom shift name and timing per student. */
export const SHIFTS: Record<string, Shift> = {
  Morning: { name: "Morning", start: 8 * 60, end: 13 * 60 + 30 },
  Day: { name: "Day", start: 12 * 60 + 30, end: 17 * 60 },
};

/** Arrival after start + this many minutes counts as late. */
export const LATE_AFTER_MINUTES = 10;

/** Demo public holidays for 2026 (dates approximate). */
export const HOLIDAYS: Record<string, string> = {
  "2026-02-21": "International Mother Language Day",
  "2026-03-19": "Eid-ul-Fitr holidays",
  "2026-03-20": "Eid-ul-Fitr",
  "2026-03-21": "Eid-ul-Fitr holidays",
  "2026-03-22": "Eid-ul-Fitr holidays",
  "2026-03-26": "Independence Day",
  "2026-04-14": "Pohela Boishakh",
  "2026-05-01": "May Day",
  "2026-05-26": "Eid-ul-Adha holidays",
  "2026-05-27": "Eid-ul-Adha",
  "2026-05-28": "Eid-ul-Adha holidays",
  "2026-06-25": "Ashura",
  "2026-09-04": "Janmashtami",
  "2026-10-20": "Durga Puja",
  "2026-10-21": "Bijoya Dashami",
  "2026-12-16": "Victory Day",
  "2026-12-25": "Christmas Day",
};

/** School holidays added on the Events & Holidays page (kept in sync by `HolidaySync`). */
const schoolHolidays: Record<string, string> = {};

export function setSchoolHolidays(map: Record<string, string>) {
  for (const key of Object.keys(schoolHolidays)) delete schoolHolidays[key];
  Object.assign(schoolHolidays, map);
}

/** Why `date` is a holiday (government list or a school holiday), or undefined. */
export const holidayName = (date: string): string | undefined => HOLIDAYS[date] ?? schoolHolidays[date];

export function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Local "today" as YYYY-MM-DD. */
export function localToday() {
  return new Date().toLocaleDateString("en-CA");
}

export function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

const LEAVE_REASONS = ["Sick leave", "Family programme", "Medical appointment", "Out of town"];

/**
 * Demo gate-scanner attendance from `startDate` to today for any person
 * (students and staff). Deterministic per `seedKey`.
 */
export function generateAttendance(seedKey: string, startDate: string, shift: Shift, weekend: WeekendPlan = DEFAULT_WEEKEND): AttendanceDay[] {
  const random = seeded(hash(seedKey));
  const today = localToday();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = startDate > SESSION_START ? startDate : SESSION_START;
  const days: AttendanceDay[] = [];

  for (let date = start; date <= today; date = addDaysIso(date, 1)) {
    const off = offDayNote(date, weekend);
    if (off) {
      days.push({ date, status: "weekend", note: off === "Weekend" ? undefined : off });
      continue;
    }
    const holiday = holidayName(date);
    if (holiday) {
      days.push({ date, status: "holiday", note: holiday });
      continue;
    }
    const isToday = date === today;
    if (isToday && nowMinutes < shift.start - 30) break; // school day hasn't started yet

    const roll = random();
    let status: AttendanceStatus = roll < 0.03 ? "absent" : roll < 0.055 ? "leave" : roll < 0.13 ? "late" : "present";
    if (isToday && status !== "present" && status !== "late") status = "present";

    if (status === "absent") {
      days.push({ date, status });
      continue;
    }
    if (status === "leave") {
      days.push({ date, status, note: LEAVE_REASONS[Math.floor(random() * LEAVE_REASONS.length)] });
      continue;
    }

    const inMinutes =
      status === "late"
        ? shift.start + LATE_AFTER_MINUTES + 1 + Math.floor(random() * 35)
        : shift.start - 20 + Math.floor(random() * (20 + LATE_AFTER_MINUTES));
    let outMinutes: number | undefined = shift.end - 5 + Math.floor(random() * 25);
    if (isToday && nowMinutes < outMinutes) outMinutes = undefined; // still on campus

    days.push({
      date,
      status,
      checkIn: minutesToTime(inMinutes),
      checkOut: outMinutes === undefined ? undefined : minutesToTime(outMinutes),
      minutes: outMinutes === undefined ? undefined : outMinutes - inMinutes,
    });
  }
  return days;
}

/* ------------------------------------------------------------------ */
/* Teachers & subjects                                                 */
/* ------------------------------------------------------------------ */

const TEACHER_ROWS: [string, string, string][] = [
  ["Mahmuda Akter", "Bangla", "Senior Teacher"],
  ["Rezaul Karim", "English", "Senior Teacher"],
  ["Abdul Mannan", "Mathematics", "Assistant Head Teacher"],
  ["Shirin Sultana", "Science", "Senior Teacher"],
  ["Kamrul Islam", "Physics", "Assistant Teacher"],
  ["Nasrin Jahan", "Chemistry", "Assistant Teacher"],
  ["Tanvir Ahmed", "Biology", "Assistant Teacher"],
  ["Farhana Rahman", "Bangladesh & Global Studies", "Senior Teacher"],
  ["Imran Hossain", "ICT", "Assistant Teacher"],
  ["Abdur Rahim", "Islam & Moral Education", "Senior Teacher"],
  ["Sukanta Das", "Hindu Religion & Moral Education", "Assistant Teacher"],
  ["Rumana Afroz", "Early Childhood", "Senior Teacher"],
  ["Shahidul Alam", "Higher Mathematics", "Assistant Teacher"],
  ["Nusrat Jahan", "Arts & Crafts", "Assistant Teacher"],
  ["Mizanur Rahman", "Agriculture Studies", "Assistant Teacher"],
  ["Bimal Barua", "Buddhist Religion & Moral Education", "Assistant Teacher"],
  ["Joseph Gomes", "Christian Religion & Moral Education", "Assistant Teacher"],
];

export const TEACHERS: Teacher[] = TEACHER_ROWS.map(([name, subject, designation], i) => ({
  id: `TCH-${String(i + 1).padStart(3, "0")}`,
  name,
  subject,
  designation,
  phone: `01${7 + (i % 3)}${String(30000000 + i * 482913).slice(0, 8)}`,
  email: `${name.toLowerCase().split(" ")[0]}.${name.toLowerCase().split(" ").slice(-1)[0]}@edumanage.school`,
}));

export const teacherFor = (subject: string) => TEACHERS.find((t) => t.subject === subject) ?? TEACHERS[11]!;

function religionSubject(religion: string) {
  return religion === "Hinduism" ? "Hindu Religion & Moral Education" : "Islam & Moral Education";
}

export function subjectNamesFor(className: string, religion: string): string[] {
  if (["Play", "Nursery", "KG"].includes(className)) return ["Bangla", "English", "Mathematics", "Arts & Crafts", "Early Childhood"];
  const grade = Number(className.replace(/\D/g, ""));
  if (grade <= 5) return ["Bangla", "English", "Mathematics", "Science", "Bangladesh & Global Studies", religionSubject(religion)];
  if (grade <= 8) return ["Bangla", "English", "Mathematics", "Science", "Bangladesh & Global Studies", "ICT", religionSubject(religion)];
  return ["Bangla", "English", "Mathematics", "Physics", "Chemistry", "Biology", "Higher Mathematics", "ICT", religionSubject(religion)];
}

export const SUBJECT_CODES: Record<string, string> = {
  Bangla: "BAN",
  English: "ENG",
  Mathematics: "MAT",
  Science: "SCI",
  "Bangladesh & Global Studies": "BGS",
  ICT: "ICT",
  "Islam & Moral Education": "ISL",
  "Hindu Religion & Moral Education": "HIN",
  Physics: "PHY",
  Chemistry: "CHE",
  Biology: "BIO",
  "Higher Mathematics": "HMA",
  "Arts & Crafts": "ART",
  "Early Childhood": "GKN",
  "Agriculture Studies": "AGR",
  "Buddhist Religion & Moral Education": "BUD",
  "Christian Religion & Moral Education": "CHR",
};

export const RELIGION_SUBJECTS = [
  "Islam & Moral Education",
  "Hindu Religion & Moral Education",
  "Buddhist Religion & Moral Education",
  "Christian Religion & Moral Education",
];
export const FOURTH_SUBJECTS = ["Higher Mathematics", "Agriculture Studies"];

/** Subjects an admin may swap a given subject for (empty = compulsory, not changeable). */
export function subjectAlternatives(subject: string) {
  if (RELIGION_SUBJECTS.includes(subject)) return RELIGION_SUBJECTS.filter((s) => s !== subject);
  if (FOURTH_SUBJECTS.includes(subject)) return FOURTH_SUBJECTS.filter((s) => s !== subject);
  return [];
}

export function subjectsFor(className: string, religion: string, swaps: Record<string, string> = {}): SubjectInfo[] {
  const grade = Number(className.replace(/\D/g, "")) || 0;
  return subjectNamesFor(className, religion).map((original, i) => ({ name: swaps[original] ?? original, i })).map(({ name, i }) => ({
    code: `${SUBJECT_CODES[name] ?? "GEN"}-${grade || "P"}${String(i + 1).padStart(2, "0")}`,
    name: name === "Early Childhood" ? "General Knowledge" : name,
    teacher: teacherFor(name),
    periodsPerWeek: ["Bangla", "English", "Mathematics"].includes(name) ? 6 : 4,
  }));
}

export function classTeacherFor(student: Pick<Student, "className" | "section">) {
  const index = Math.max(0, ["Play", "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].indexOf(student.className));
  if (index < 3) return TEACHERS[11]!;
  return TEACHERS[(index * 3 + (student.section === "B" ? 1 : 0)) % 10]!;
}

/* ------------------------------------------------------------------ */
/* Exams & results                                                     */
/* ------------------------------------------------------------------ */

export const EXAMS = [
  { id: "first-term", name: "First Term Exam", heldOn: "2026-04-20" },
  { id: "half-yearly", name: "Half Yearly Exam", heldOn: "2026-06-22" },
  { id: "second-term", name: "Second Term Exam", heldOn: "2026-09-14" },
  { id: "annual", name: "Annual Exam", heldOn: "2026-12-06" },
];

/** Bangladesh grading scale. */
export function gradeFor(percent: number) {
  if (percent >= 80) return { grade: "A+", gp: 5 };
  if (percent >= 70) return { grade: "A", gp: 4 };
  if (percent >= 60) return { grade: "A-", gp: 3.5 };
  if (percent >= 50) return { grade: "B", gp: 3 };
  if (percent >= 40) return { grade: "C", gp: 2 };
  if (percent >= 33) return { grade: "D", gp: 1 };
  return { grade: "F", gp: 0 };
}

function gradeForGpa(gpa: number) {
  if (gpa >= 5) return "A+";
  if (gpa >= 4) return "A";
  if (gpa >= 3.5) return "A-";
  if (gpa >= 3) return "B";
  if (gpa >= 2) return "C";
  if (gpa >= 1) return "D";
  return "F";
}

function generatedMarks(studentId: string, subjectCode: string, examIndex: number) {
  const ability = 46 + seeded(hash(studentId))() * 38;
  const subjectBias = seeded(hash(`${studentId}:${subjectCode}`))() * 18 - 9;
  const noise = seeded(hash(`${studentId}:${subjectCode}:${examIndex}`))() * 12 - 6;
  return Math.round(Math.min(99, Math.max(18, ability + subjectBias + noise + examIndex * 1.5)));
}

function remarksFor(gpa: number) {
  if (gpa >= 4.5) return "Excellent performance — keep it up!";
  if (gpa >= 4) return "Very good. Consistent effort across subjects.";
  if (gpa >= 3.5) return "Good. Can improve with regular practice.";
  if (gpa >= 3) return "Satisfactory. Needs more attention in weaker subjects.";
  return "Needs improvement — guardian meeting recommended.";
}

type MarksOverrides = Record<string, Record<string, Record<string, number>>>;

function buildExams(student: Student, subjects: SubjectInfo[], classmates: Student[], overrides: MarksOverrides = {}): ExamResult[] {
  const today = localToday();
  return EXAMS.map((exam, examIndex) => {
    // Admin-edited marks win over generated ones.
    const marksFor = (id: string, code: string, index: number) => overrides[id]?.[exam.id]?.[code] ?? generatedMarks(id, code, index);
    const base = { id: exam.id, name: exam.name, heldOn: exam.heldOn, results: [], total: 0, outOf: 0, gpa: 0, grade: "—", position: 0, classSize: 0, remarks: "" };
    if (exam.heldOn > today) return { ...base, status: "upcoming" as const };
    if (student.enrolledOn > exam.heldOn) return { ...base, status: "not-taken" as const };

    const takers = classmates.filter((c) => c.enrolledOn <= exam.heldOn);
    const totalOf = (id: string) => subjects.reduce((sum, s) => sum + marksFor(id, s.code, examIndex), 0);
    const myTotal = totalOf(student.id);

    const results = subjects.map((s) => {
      const obtained = marksFor(student.id, s.code, examIndex);
      const { grade, gp } = gradeFor(obtained);
      const highest = Math.max(...takers.map((c) => marksFor(c.id, s.code, examIndex)));
      return { code: s.code, subject: s.name, fullMarks: 100, obtained, highest, grade, gp };
    });
    const failed = results.some((r) => r.gp === 0);
    const gpa = failed ? 0 : Math.round((results.reduce((sum, r) => sum + r.gp, 0) / results.length) * 100) / 100;

    return {
      ...base,
      status: "published" as const,
      results,
      total: myTotal,
      outOf: subjects.length * 100,
      gpa,
      grade: gradeForGpa(gpa),
      position: 1 + takers.filter((c) => totalOf(c.id) > myTotal).length,
      classSize: takers.length,
      remarks: remarksFor(gpa),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Guardians                                                           */
/* ------------------------------------------------------------------ */

const MOTHERS = ["Rokeya Begum", "Salma Khatun", "Nasima Akter", "Shahnaz Parvin", "Rehana Sultana", "Jesmin Ara", "Hasina Begum", "Farida Yasmin", "Kohinoor Akter", "Dilruba Khanam"];
const FATHER_JOBS = ["Businessman", "Engineer", "Banker", "Govt. Officer", "Teacher", "Doctor", "Lawyer"];
const MOTHER_JOBS = ["Homemaker", "Teacher", "Banker", "Doctor", "Homemaker", "Entrepreneur"];

/* ------------------------------------------------------------------ */
/* Leave & attendance corrections                                      */
/* ------------------------------------------------------------------ */

export const LEAVE_TYPES: Record<LeaveType, string> = {
  sick: "Sick leave",
  casual: "Casual leave",
  family: "Family leave",
  other: "Other leave",
};

function toMinutes(time?: string) {
  const [, h, m, suffix] = /(\d+):(\d+) (AM|PM)/.exec(time ?? "") ?? [];
  return h ? ((Number(h) % 12) + (suffix === "PM" ? 12 : 0)) * 60 + Number(m) : undefined;
}

/** School days (no weekend / holiday) between two dates, inclusive — for this person's weekend plan. */
export function schoolDaysBetween(from: string, to: string, weekend?: WeekendPlan) {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDaysIso(d, 1)) {
    if (!isOffDay(d, weekend) && !holidayName(d)) days.push(d);
  }
  return days;
}

/** Approved leave becomes "leave" days; admin corrections override everything. */
export function applyAttendanceCorrections(
  days: AttendanceDay[],
  startDate: string,
  leaves: { from: string; to: string; label: string }[],
  overrides: Record<string, AttendanceOverride>,
  weekend?: WeekendPlan,
) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const leave of leaves) {
    for (const date of schoolDaysBetween(leave.from, leave.to, weekend)) {
      if (date >= startDate) byDate.set(date, { date, status: "leave", note: `${leave.label} (approved)` });
    }
  }
  for (const [date, o] of Object.entries(overrides)) {
    const inM = toMinutes(o.checkIn);
    const outM = toMinutes(o.checkOut);
    byDate.set(date, { date, ...o, minutes: inM !== undefined && outM !== undefined && outM > inM ? outM - inM : undefined });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Default guardians: from the admission form, or generated (siblings share parents via the phone number). */
export function guardiansFor(student: Student, admission?: Admission): GuardianInfo[] {
  if (admission) {
    const list: GuardianInfo[] = [
      { role: "Father", relation: "Father", ...admission.father, isPrimary: admission.primaryContact === "father" },
      { role: "Mother", relation: "Mother", ...admission.mother, isPrimary: admission.primaryContact === "mother" },
    ];
    if (admission.primaryContact === "guardian") {
      list.push({ role: "Local guardian", occupation: "", nid: "", ...admission.localGuardian, isPrimary: true });
    }
    return list;
  }
  const random = seeded(hash(`${student.phone}:family`));
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)]!;
  return [
    { role: "Father", relation: "Father", name: student.guardianName, occupation: pick(FATHER_JOBS), phone: student.phone, email: student.email, nid: "", isPrimary: true },
    {
      role: "Mother",
      relation: "Mother",
      name: pick(MOTHERS),
      occupation: pick(MOTHER_JOBS),
      phone: `01${7 + Math.floor(random() * 3)}${String(Math.floor(10000000 + random() * 89999999))}`,
      email: "",
      nid: "",
      isPrimary: false,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Public builder                                                      */
/* ------------------------------------------------------------------ */

/** Admin edits layered on top of the generated profile. */
export type ProfileOverrides = {
  details?: StudentDetailsPatch;
  /** All students' edited marks (needed for class highest / position). */
  marks?: MarksOverrides;
  subjectSwaps?: Record<string, string>;
  /** Extra subjects added by an admin (not in past exams). */
  customSubjects?: SubjectInfo[];
  /** Teacher / periods changes by subject code. */
  subjectEdits?: Record<string, SubjectEdit>;
  attendance?: Record<string, AttendanceOverride>;
  approvedLeaves?: LeaveRequest[];
  guardians?: GuardianInfo[];
  weekend?: WeekendPlan;
};

export function buildStudentProfile(student: Student, allStudents: Student[], admission?: Admission, overrides: ProfileOverrides = {}): StudentProfile {
  const d = overrides.details ?? {};
  const religion = d.religion ?? admission?.religion ?? (hash(student.id) % 9 === 4 ? "Hinduism" : "Islam");
  const preset = SHIFTS[student.shift] ?? SHIFTS.Morning!;
  const shift: Shift = { name: student.shift, start: d.shiftStart ?? preset.start, end: d.shiftEnd ?? preset.end };
  const edits = overrides.subjectEdits ?? {};
  const withEdits = (s: SubjectInfo): SubjectInfo => {
    const e = edits[s.code];
    return e ? { ...s, teacher: e.teacher ?? s.teacher, periodsPerWeek: e.periodsPerWeek ?? s.periodsPerWeek } : s;
  };
  const curriculum = subjectsFor(student.className, religion, overrides.subjectSwaps).map(withEdits);
  const subjects = [...curriculum, ...(overrides.customSubjects ?? []).map(withEdits)];
  const classmates = allStudents.filter((s) => s.className === student.className);

  return {
    shift,
    attendance: applyAttendanceCorrections(
      generateAttendance(`${student.id}:attendance`, student.enrolledOn, shift, overrides.weekend),
      student.enrolledOn,
      (overrides.approvedLeaves ?? []).map((l) => ({ from: l.from, to: l.to, label: LEAVE_TYPES[l.type] })),
      overrides.attendance ?? {},
      overrides.weekend,
    ),
    classTeacher: d.classTeacher ?? classTeacherFor(student),
    session: d.session ?? ACADEMIC_SESSION,
    subjects,
    // Results only cover the curriculum subjects that were examined.
    exams: buildExams(student, curriculum, classmates, overrides.marks),
    guardians: overrides.guardians ?? guardiansFor(student, admission),
    religion,
    nationality: d.nationality ?? admission?.nationality ?? "Bangladeshi",
    birthCertificateNo: d.birthCertificateNo ?? admission?.birthCertificateNo ?? `2015${String(2690000000000 + (hash(student.id) % 9999999)).slice(0, 13)}`,
    studentNameBn: d.studentNameBn ?? admission?.studentNameBn ?? "",
    permanentAddress: d.permanentAddress ?? admission?.permanentAddress ?? student.address,
    medicalNotes: d.medicalNotes ?? admission?.medicalNotes ?? "",
  };
}
