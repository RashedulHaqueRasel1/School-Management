"use client";

import { useState } from "react";
import { BriefcaseBusiness, CalendarCheck, ClipboardList, Download, FileSpreadsheet, GraduationCap, Receipt, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/features/admissions/constants";
import { classOrder } from "@/features/classes/demoData/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useReportData } from "../hooks/use-report-data";
import { MONTH_SHORT, attendanceRate, downloadCsv, monthsToDate } from "../utils";
import { Loading } from "./ReportsOverviewView";

type Opts = { month: string; className: string; exam: string };
type Option = keyof Opts;
type Report = { key: string; title: string; description: string; icon: LucideIcon; accent: string; options: Option[]; build: (o: Opts) => (string | number)[][] };

/**
 * Report centre: ready-made CSV exports from every module.
 * BACKEND: GET /reports/export/:report?month=&classId=&examId=  (CSV / XLSX)
 */
export function DownloadsView() {
  const { hydrated, today, students, learners, accounts, payments, staff, admissions } = useReportData();
  if (!hydrated) return <Loading />;

  const months = monthsToDate(today).reverse();
  const classes = [...new Set(students.map((s) => s.className))].sort((a, b) => classOrder(a) - classOrder(b));
  const exams = [...new Map(learners.flatMap((l) => l.profile.exams.filter((e) => e.status === "published")).map((e) => [e.id, e.name] as const)).entries()];
  const inClass = (c: string, cls: string) => cls === "all" || c === cls;
  const monthLabel = (m: string) => `${MONTH_SHORT[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;

  const reports: Report[] = [
    {
      key: "students",
      title: "Student list",
      description: "Every current student with class, roll, guardian and contact.",
      icon: GraduationCap,
      accent: "bg-indigo-50 text-indigo-600",
      options: ["className"],
      build: (o) => [
        ["Student ID", "Name", "Class", "Section", "Roll", "Gender", "Date of birth", "Version", "Shift", "Guardian", "Relation", "Phone", "Email", "Enrolled on"],
        ...students.filter((s) => inClass(s.className, o.className)).sort((a, b) => classOrder(a.className) - classOrder(b.className) || a.section.localeCompare(b.section) || a.roll - b.roll).map((s) => [s.id, s.name, s.className, s.section, s.roll, s.gender, s.dateOfBirth, s.version, s.shift, s.guardianName, s.guardianRelation, s.phone, s.email, s.enrolledOn]),
      ],
    },
    {
      key: "attendance",
      title: "Monthly attendance",
      description: "Present, late, absent and leave days per student, with the rate.",
      icon: CalendarCheck,
      accent: "bg-emerald-50 text-emerald-600",
      options: ["month", "className"],
      build: (o) => [
        ["Student ID", "Name", "Class", "Section", "Roll", "School days", "Present", "Late", "Absent", "Leave", "Rate %"],
        ...learners
          .filter((l) => inClass(l.student.className, o.className))
          .map((l) => {
            const days = l.profile.attendance.filter((d) => d.date.startsWith(o.month) && d.date <= today);
            const n = (s: string) => days.filter((d) => d.status === s).length;
            const r = attendanceRate(days, today);
            return [l.student.id, l.student.name, l.student.className, l.student.section, l.student.roll, r.school, n("present"), n("late"), n("absent"), n("leave"), r.rate];
          }),
      ],
    },
    {
      key: "staff-attendance",
      title: "Staff attendance",
      description: "Each teacher's attendance for the month.",
      icon: BriefcaseBusiness,
      accent: "bg-teal-50 text-teal-600",
      options: ["month"],
      build: (o) => [
        ["Staff ID", "Name", "Designation", "Department", "Working days", "Present", "Late", "Absent", "Leave", "Rate %"],
        ...staff.map((s) => {
          const days = s.days.filter((d) => d.date.startsWith(o.month) && d.date <= today);
          const n = (st: string) => days.filter((d) => d.status === st).length;
          const r = attendanceRate(days, today);
          return [s.teacher.id, s.teacher.name, s.teacher.designation, s.teacher.department, r.school, n("present"), n("late"), n("absent"), n("leave"), r.rate];
        }),
      ],
    },
    {
      key: "dues",
      title: "Fee dues",
      description: "Students with unpaid tuition — months, amounts and guardian phone.",
      icon: Wallet,
      accent: "bg-amber-50 text-amber-600",
      options: ["className"],
      build: (o) => [
        ["Student ID", "Name", "Class", "Section", "Roll", "Guardian", "Phone", "Unpaid months", "Overdue", "Due this month", "Last paid"],
        ...accounts
          .filter((a) => inClass(a.student.className, o.className) && a.overdue + a.dueNow > 0)
          .map((a) => [a.student.id, a.student.name, a.student.className, a.student.section, a.student.roll, a.student.guardianName, a.student.phone, a.ledger.months.filter((m) => m.due > 0 && m.month <= today.slice(0, 7)).map((m) => MONTH_SHORT[Number(m.month.slice(5)) - 1]).join(" "), a.overdue, a.dueNow, a.lastPaid ?? ""]),
      ],
    },
    {
      key: "payments",
      title: "Tuition collection",
      description: "Every tuition receipt of the month — method, reference, amount.",
      icon: Receipt,
      accent: "bg-sky-50 text-sky-600",
      options: ["month", "className"],
      build: (o) => [
        ["Receipt", "Date", "Student ID", "Name", "Class", "For months", "Method", "Reference", "Received by", "Amount"],
        ...payments.filter((p) => p.paidOn.startsWith(o.month) && inClass(p.student.className, o.className)).map((p) => [p.receiptNo, p.paidOn, p.student.id, p.student.name, p.student.className, p.allocations.map((a) => a.month).join(" "), PAYMENT_METHODS[p.method].label, p.transactionId, p.receivedBy, p.total]),
      ],
    },
    {
      key: "results",
      title: "Exam results",
      description: "GPA, grade, total and position for an exam.",
      icon: ClipboardList,
      accent: "bg-rose-50 text-rose-600",
      options: ["exam", "className"],
      build: (o) => [
        ["Student ID", "Name", "Class", "Section", "Roll", "Total", "Out of", "GPA", "Grade", "Position"],
        ...learners
          .filter((l) => inClass(l.student.className, o.className))
          .flatMap((l) => {
            const r = l.profile.exams.find((e) => e.id === o.exam && e.status === "published");
            return r ? [[l.student.id, l.student.name, l.student.className, l.student.section, l.student.roll, r.total, r.outOf, r.gpa, r.grade, r.position]] : [];
          }),
      ],
    },
    {
      key: "teachers",
      title: "Teacher list",
      description: "Every active teacher with designation, subjects and contact.",
      icon: Users,
      accent: "bg-violet-50 text-violet-600",
      options: [],
      build: () => [
        ["Staff ID", "Name", "Designation", "Department", "Employment", "Subjects", "Shift", "Phone", "Email", "Joined on"],
        ...staff.map(({ teacher: t }) => [t.id, t.name, t.designation, t.department, t.employmentType, t.subjects.join("; "), t.shift, t.phone, t.email, t.joinedOn]),
      ],
    },
    {
      key: "salary",
      title: "Salary register",
      description: "Gross, deductions and net pay per teacher for the month.",
      icon: FileSpreadsheet,
      accent: "bg-slate-100 text-slate-600",
      options: ["month"],
      build: (o) => [
        ["Staff ID", "Name", "Designation", "Gross", "Deductions", "Net", "Status", "Paid on", "Slip no."],
        ...staff.map((s) => {
          const m = s.salary.months.find((x) => x.month === o.month);
          return [s.teacher.id, s.teacher.name, s.teacher.designation, m?.gross ?? "", m?.deductions ?? "", m?.net ?? "", m?.status ?? "—", m?.payment?.paidOn ?? "", m?.payment?.slipNo ?? ""];
        }),
      ],
    },
    {
      key: "admissions",
      title: "Admission applications",
      description: "Applications of the session with status and fee paid.",
      icon: UserPlus,
      accent: "bg-pink-50 text-pink-600",
      options: ["className"],
      build: (o) => [
        ["Application ID", "Student", "Class", "Version", "Shift", "Applied on", "Status", "Admission fee", "Paid", "Source"],
        ...admissions.filter((a) => inClass(a.applyingClass, o.className)).map((a) => [a.id, a.studentName, a.applyingClass, a.version, a.shift, a.appliedOn, a.status, a.admissionFee, a.payments.reduce((s, p) => s + p.amount, 0), a.source]),
      ],
    },
  ];

  const defaults: Opts = { month: months[0]!, className: "all", exam: exams.at(-1)?.[0] ?? "" };
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((r) => (
        <ReportCard key={r.key} report={r} defaults={defaults} months={months} monthLabel={monthLabel} classes={classes} exams={exams} today={today} />
      ))}
    </div>
  );
}

function ReportCard({ report: r, defaults, months, monthLabel, classes, exams, today }: { report: Report; defaults: Opts; months: string[]; monthLabel: (m: string) => string; classes: string[]; exams: [string, string][]; today: string }) {
  const [o, setO] = useState<Opts>(defaults);
  const rows = r.build(o);
  const Icon = r.icon;
  const count = rows.length - 1;

  function download() {
    const suffix = [r.options.includes("month") && o.month, r.options.includes("exam") && o.exam, r.options.includes("className") && o.className !== "all" && o.className.toLowerCase().replace(/\s+/g, "-")].filter(Boolean).join("-");
    downloadCsv(rows, `${r.key}${suffix ? `-${suffix}` : ""}-${today}.csv`);
    toast("Report downloaded", { description: `${r.title} · ${count} row(s)`, tone: "info" });
  }

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", r.accent)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-fg">{r.title}</h2>
          <p className="text-xs text-fg-muted">{r.description}</p>
        </div>
      </div>
      {r.options.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {r.options.includes("month") && (
            <Select aria-label="Month" value={o.month} onChange={(e) => setO({ ...o, month: e.target.value })}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </Select>
          )}
          {r.options.includes("exam") && (
            <Select aria-label="Exam" value={o.exam} onChange={(e) => setO({ ...o, exam: e.target.value })}>
              {exams.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          )}
          {r.options.includes("className") && (
            <Select aria-label="Class" value={o.className} onChange={(e) => setO({ ...o, className: e.target.value })}>
              <option value="all">All classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-xs text-fg-muted">
          <b className="tabular-nums text-fg">{count}</b> row(s) · {rows[0]!.length} columns
        </span>
        <Button size="sm" variant="outline" onClick={download} disabled={count === 0}>
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>
    </Card>
  );
}
