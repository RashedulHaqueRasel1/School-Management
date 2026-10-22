import { CLASS_OPTIONS, CURRENT_USER } from "@/features/admissions/constants";
import { SHIFTS, TEACHERS, addDaysIso, classTeacherFor, hash, localToday, minutesToTime, seeded } from "@/features/students/demoData/profile-data";

import type {
  RoutineSlot,
  SalaryLedger,
  SalaryPayment,
  SalarySettings,
  Teacher,
  TeacherLeave,
  TeachingAssignment,
} from "../types/types";

/*
 * Demo staff data. The 17 teachers are the same people (same IDs) the student
 * module shows as class / subject teachers. Everything else is generated
 * deterministically per teacher. TODO (backend phase): GET /teachers …
 */

export const DESIGNATIONS = ["Head Teacher", "Assistant Head Teacher", "Senior Teacher", "Assistant Teacher", "Guest Teacher"];
export const DEPARTMENTS = ["Science", "Humanities", "Languages", "Religion & Ethics", "Early Childhood", "ICT"];
export const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Part-time", "Guest"] as const;

/** Teaching days (Friday is the weekly holiday) and periods per day. */
export const ROUTINE_DAYS = [6, 0, 1, 2, 3, 4];
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PERIODS_PER_DAY = 6;
export const PERIOD_MINUTES = 45;
export const MAX_PERIODS_PER_WEEK = 30;

const FEMALE = new Set(["Mahmuda Akter", "Shirin Sultana", "Nasrin Jahan", "Farhana Rahman", "Rumana Afroz", "Nusrat Jahan"]);

const DEPARTMENT_OF: Record<string, string> = {
  Bangla: "Languages",
  English: "Languages",
  Mathematics: "Science",
  Science: "Science",
  Physics: "Science",
  Chemistry: "Science",
  Biology: "Science",
  "Higher Mathematics": "Science",
  "Agriculture Studies": "Science",
  "Bangladesh & Global Studies": "Humanities",
  ICT: "ICT",
  "Islam & Moral Education": "Religion & Ethics",
  "Hindu Religion & Moral Education": "Religion & Ethics",
  "Buddhist Religion & Moral Education": "Religion & Ethics",
  "Christian Religion & Moral Education": "Religion & Ethics",
  "Early Childhood": "Early Childhood",
  "Arts & Crafts": "Early Childhood",
};

const DEGREE_OF = (subject: string) =>
  ["Physics", "Chemistry", "Biology", "Mathematics", "Higher Mathematics", "Science", "Agriculture Studies"].includes(subject)
    ? `M.Sc. in ${subject === "Science" ? "Chemistry" : subject}`
    : subject === "ICT"
      ? "B.Sc. in Computer Science & Engineering"
      : subject.includes("Religion") || subject.includes("Islam")
        ? "Kamil (M.A. equivalent)"
        : subject === "Early Childhood" || subject === "Arts & Crafts"
          ? "M.Ed. in Early Childhood Education"
          : `M.A. in ${subject === "Bangladesh & Global Studies" ? "History" : subject}`;

const UNIVERSITIES = ["University of Dhaka", "Jahangirnagar University", "Rajshahi University", "National University", "Chittagong University", "BRAC University"];
const AREAS = ["Dhanmondi", "Mirpur", "Uttara", "Mohammadpur", "Lalmatia", "Shyamoli", "Bashundhara"];
const BLOOD = ["A+", "B+", "O+", "AB+", "O-", "B-", "A-"];

export const demoTeachers: Teacher[] = TEACHERS.map((t, i) => {
  const random = seeded(hash(`${t.id}:hr`));
  const joinedYear = 2008 + Math.floor(random() * 16);
  const female = FEMALE.has(t.name);
  return {
    id: t.id,
    photo: null,
    name: t.name,
    gender: female ? "Female" : "Male",
    dateOfBirth: `${1970 + Math.floor(random() * 25)}-${String(1 + Math.floor(random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(random() * 27)).padStart(2, "0")}`,
    bloodGroup: BLOOD[i % BLOOD.length]!,
    religion: t.subject.startsWith("Hindu") ? "Hinduism" : t.subject.startsWith("Buddhist") ? "Buddhism" : t.subject.startsWith("Christian") ? "Christianity" : "Islam",
    nid: String(1990000000 + Math.floor(random() * 899999999)),
    phone: t.phone,
    email: t.email,
    presentAddress: `Flat ${1 + (i % 6)}B, House ${10 + i}, Road ${3 + (i % 8)}, ${AREAS[i % AREAS.length]}, Dhaka`,
    permanentAddress: `Village ${["Kalia", "Sonapur", "Rampur", "Charghat"][i % 4]}, ${["Cumilla", "Bogura", "Sylhet", "Rajshahi"][i % 4]}`,
    emergencyContact: { name: female ? "Mohammad Karim" : "Rehana Begum", relation: female ? "Husband" : "Wife", phone: `01${7 + (i % 3)}${String(40000000 + i * 391827).slice(0, 8)}` },
    designation: t.designation,
    department: DEPARTMENT_OF[t.subject] ?? "Humanities",
    employmentType: i === 15 || i === 16 ? "Contract" : "Permanent",
    joinedOn: `${joinedYear}-${String(1 + (i % 12)).padStart(2, "0")}-01`,
    shift: i % 4 === 3 ? "Day" : "Morning",
    subjects: [t.subject],
    qualification: { degree: DEGREE_OF(t.subject), institution: UNIVERSITIES[i % UNIVERSITIES.length]!, year: String(joinedYear - 1 - (i % 3)) },
    priorExperience: i % 5,
    bankAccount: `DBBL · 1061${String(1000000 + i * 734).slice(0, 7)}`,
    documents: [
      { id: `tdoc-${t.id}-1`, name: "appointment-letter.pdf", size: 182_000, type: "application/pdf" },
      { id: `tdoc-${t.id}-2`, name: "academic-certificates.pdf", size: 1_240_000, type: "application/pdf" },
      { id: `tdoc-${t.id}-3`, name: "nid-copy.jpg", size: 420_000, type: "image/jpeg" },
    ],
  };
});

const DEMO_IDS = new Set(demoTeachers.map((t) => t.id));

/** Seeded history (classes, leave, past salary) exists only for demo staff — new teachers start clean. */
export const isDemoTeacher = (id: string) => DEMO_IDS.has(id);

/* ------------------------------------------------------------------ */
/* Classes & routine                                                   */
/* ------------------------------------------------------------------ */

function classesFor(subject: string) {
  if (["Early Childhood", "Arts & Crafts"].includes(subject)) return ["Play", "Nursery", "KG"];
  if (["Physics", "Chemistry", "Biology", "Higher Mathematics", "Agriculture Studies"].includes(subject)) return ["Class 9", "Class 10"];
  if (subject === "ICT") return ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  if (["Science", "Bangladesh & Global Studies"].includes(subject)) return ["Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"];
  return CLASS_OPTIONS.filter((c) => c.startsWith("Class"));
}

/** Demo teaching load: 5–6 class-sections for the teacher's main subject. */
export function seedAssignments(teacher: Pick<Teacher, "id" | "subjects">): TeachingAssignment[] {
  const subject = teacher.subjects[0];
  if (!subject || !isDemoTeacher(teacher.id)) return [];
  const random = seeded(hash(`${teacher.id}:classes`));
  const pool = classesFor(subject).flatMap((c) => ["A", "B"].map((section) => ({ className: c, section })));
  const count = Math.min(pool.length, 5 + Math.floor(random() * 2));
  const picked: typeof pool = [];
  while (picked.length < count) {
    const item = pool[Math.floor(random() * pool.length)]!;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked
    .sort((a, b) => CLASS_OPTIONS.indexOf(a.className) - CLASS_OPTIONS.indexOf(b.className) || a.section.localeCompare(b.section))
    .map((p, i) => ({ id: `${teacher.id}-a${i}`, ...p, subject, periodsPerWeek: ["Bangla", "English", "Mathematics"].includes(subject) ? 5 : 4 }));
}

/** Class-sections where this teacher is the class teacher (same rule the student profile uses). */
export function classTeacherOf(teacherId: string) {
  return CLASS_OPTIONS.flatMap((className) => ["A", "B"].map((section) => ({ className, section }))).filter(
    (c) => classTeacherFor(c).id === teacherId,
  );
}

/** Spread the weekly periods of every assignment over the routine grid. */
export function buildRoutine(teacherId: string, assignments: TeachingAssignment[]): RoutineSlot[] {
  const random = seeded(hash(`${teacherId}:routine`));
  const slots: RoutineSlot[] = [];
  const taken = new Set<string>();
  for (const assignment of assignments) {
    let placed = 0;
    let dayIndex = Math.floor(random() * ROUTINE_DAYS.length);
    let guard = 0;
    while (placed < assignment.periodsPerWeek && guard < 200) {
      guard += 1;
      const day = ROUTINE_DAYS[dayIndex % ROUTINE_DAYS.length]!;
      const period = 1 + Math.floor(random() * PERIODS_PER_DAY);
      const key = `${day}-${period}`;
      dayIndex += 1;
      // One period of the same class per day, no double booking.
      if (taken.has(key) || slots.some((s) => s.day === day && s.assignment.id === assignment.id)) continue;
      taken.add(key);
      slots.push({ day, period, assignment });
      placed += 1;
    }
  }
  return slots;
}

/* ------------------------------------------------------------------ */
/* Leave                                                               */
/* ------------------------------------------------------------------ */

/** Yearly entitlement in days. */
export const LEAVE_QUOTA = { casual: 10, sick: 14, earned: 20, maternity: 120, other: 0 } as const;

export const TEACHER_LEAVE_LABEL: Record<keyof typeof LEAVE_QUOTA, string> = {
  casual: "Casual leave",
  sick: "Sick leave",
  earned: "Earned leave",
  maternity: "Maternity leave",
  other: "Other leave",
};

export function seedTeacherLeaves(teacher: Teacher): TeacherLeave[] {
  if (!isDemoTeacher(teacher.id)) return [];
  const random = seeded(hash(`${teacher.id}:leave`));
  const today = localToday();
  const number = teacher.id.split("-").pop();
  const past = addDaysIso(today, -20 - Math.floor(random() * 60));
  const soon = addDaysIso(today, 4 + Math.floor(random() * 8));
  const at = (date: string) => `${date}T03:30:00Z`;
  return [
    {
      id: `TL-${number}-1`,
      teacherId: teacher.id,
      type: "sick",
      from: past,
      to: addDaysIso(past, 1),
      reason: "Viral fever — doctor advised two days of rest.",
      attachment: "prescription.pdf",
      submittedAt: at(addDaysIso(past, -1)),
      submittedBy: "Teacher portal",
      status: "approved",
      decision: { by: CURRENT_USER, at: at(past), note: "Get well soon." },
      substitute: "Shahidul Alam",
    },
    {
      id: `TL-${number}-2`,
      teacherId: teacher.id,
      type: "casual",
      from: soon,
      to: addDaysIso(soon, Math.floor(random() * 2)),
      reason: "Family programme in the home district.",
      submittedAt: at(addDaysIso(today, -1)),
      submittedBy: "Teacher portal",
      status: "pending",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Salary                                                              */
/* ------------------------------------------------------------------ */

const BASIC_BY_DESIGNATION: Record<string, number> = {
  "Head Teacher": 65000,
  "Assistant Head Teacher": 52000,
  "Senior Teacher": 40000,
  "Assistant Teacher": 30000,
  "Guest Teacher": 15000,
};

export function defaultSalarySettings(teacher: Pick<Teacher, "designation" | "employmentType">): SalarySettings {
  const basic = BASIC_BY_DESIGNATION[teacher.designation] ?? 30000;
  const contract = teacher.employmentType !== "Permanent";
  return { basic, houseRentPercent: contract ? 0 : 50, medical: contract ? 0 : 1500, transport: 1000, pfPercent: contract ? 0 : 10, taxPercent: basic >= 40000 ? 5 : 0 };
}

export function salaryBreakdown(s: SalarySettings) {
  const allowances = Math.round((s.basic * s.houseRentPercent) / 100) + s.medical + s.transport;
  const gross = s.basic + allowances;
  const deductions = Math.round((s.basic * s.pfPercent) / 100) + Math.round((gross * s.taxPercent) / 100);
  return { allowances, gross, deductions, net: gross - deductions };
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthName(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function slipPrefix(teacherId: string) {
  return `PS-${teacherId.split("-").pop()}-`;
}

/** Salary for every month of the year from joining; past months are paid on the 2nd of the next month. */
export function seedSalaryPayments(teacher: Teacher, settings: SalarySettings): SalaryPayment[] {
  if (!isDemoTeacher(teacher.id)) return [];
  const current = monthKey(localToday());
  const start = teacher.joinedOn > "2026-01-01" ? monthKey(teacher.joinedOn) : "2026-01";
  const { allowances, deductions, net } = salaryBreakdown(settings);
  const payments: SalaryPayment[] = [];
  for (let m = start; m < current; m = nextMonth(m)) {
    payments.push({
      id: `sal-${teacher.id}-${m}`,
      slipNo: `${slipPrefix(teacher.id)}${m.replace("-", "")}`,
      month: m,
      basic: settings.basic,
      allowances,
      deductions,
      bonus: m === "2026-03" || m === "2026-05" ? settings.basic : 0, // Eid bonuses
      net: net + (m === "2026-03" || m === "2026-05" ? settings.basic : 0),
      method: "bank",
      reference: `BEFTN-${m.replace("-", "")}${teacher.id.split("-").pop()}`,
      paidOn: `${nextMonth(m)}-02`,
      paidBy: CURRENT_USER,
      note: m === "2026-03" ? "Includes Eid-ul-Fitr bonus" : m === "2026-05" ? "Includes Eid-ul-Adha bonus" : "",
    });
  }
  return payments;
}

export function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function buildSalaryLedger(teacher: Teacher, settings: SalarySettings, payments: SalaryPayment[]): SalaryLedger {
  const current = monthKey(localToday());
  const start = teacher.joinedOn > "2026-01-01" ? monthKey(teacher.joinedOn) : "2026-01";
  const { gross, deductions, net } = salaryBreakdown(settings);
  const months = [];
  for (let m = start; m <= "2026-12"; m = nextMonth(m)) {
    const payment = payments.find((p) => p.month === m);
    months.push({
      month: m,
      label: monthName(m),
      gross: payment ? payment.basic + payment.allowances : gross,
      deductions: payment ? payment.deductions : deductions,
      net: payment ? payment.net : net,
      // The running month is paid after it ends, so it is only "due" once it is over.
      status: payment ? ("paid" as const) : m < current ? ("pending" as const) : ("upcoming" as const),
      payment,
    });
  }
  return {
    settings,
    gross,
    deductions,
    net,
    months,
    payments: [...payments].sort((a, b) => b.month.localeCompare(a.month)),
    paidThisYear: payments.reduce((sum, p) => sum + p.net, 0),
    pending: months.filter((m) => m.status === "pending").reduce((sum, m) => sum + m.net, 0),
  };
}

/** "08:00 AM – 08:45 AM" for a period in the teacher's shift. */
export function periodTime(shiftName: string, period: number) {
  const start = (SHIFTS[shiftName] ?? SHIFTS.Morning!).start + (period - 1) * PERIOD_MINUTES;
  return `${minutesToTime(start)} – ${minutesToTime(start + PERIOD_MINUTES)}`;
}
