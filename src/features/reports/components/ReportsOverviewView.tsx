"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, BriefcaseBusiness, CalendarCheck, ClipboardCheck, GraduationCap, TrendingUp, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatTaka } from "@/features/admissions/utils";
import { classOrder } from "@/features/classes/demoData/mock-data";
import { cn } from "@/lib/utils";

import { useReportData } from "../hooks/use-report-data";
import { MONTH_SHORT, attendanceRate, monthsToDate, pct } from "../utils";

export function Tiles({ tiles }: { tiles: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
      {tiles.map(({ label, value, hint, icon: Icon, accent }) => (
        <Card key={label} className="flex items-center gap-4 p-5 print:shadow-none">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl print:[print-color-adjust:exact]", accent)}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg-muted">{label}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-fg">{value}</p>
            <p className="truncate text-xs text-fg-subtle">{hint}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-[92px] animate-pulse rounded-2xl bg-soft" />
      <div className="h-80 animate-pulse rounded-2xl bg-soft" />
    </div>
  );
}

const rateText = (r: number, good = 90, ok = 75) => (r >= good ? "text-emerald-600" : r >= ok ? "text-amber-600" : "text-rose-600");

/**
 * The school at a glance: enrollment, attendance, results, fees, admissions and
 * staff — with what needs attention. BACKEND: GET /reports/overview?session=
 */
export function ReportsOverviewView() {
  const { hydrated, today, students, learners, accounts, staff, admissions } = useReportData();
  if (!hydrated) return <Loading />;

  const month = today.slice(0, 7);
  const months = monthsToDate(today);
  const allDays = learners.flatMap((l) => l.profile.attendance);
  const byMonth = months.map((m) => {
    const att = attendanceRate(allDays.filter((d) => d.date.startsWith(m)), today);
    const fees = accounts.flatMap((a) => a.ledger.months.filter((x) => x.month === m));
    return { month: m, attendance: att.school ? att.rate : null, fees: pct(fees.reduce((s, x) => s + x.paid, 0), fees.reduce((s, x) => s + x.fee, 0)) };
  });
  const thisMonth = byMonth.find((m) => m.month === month)!;
  const studentRates = learners.map((l) => ({ ...l, att: attendanceRate(l.profile.attendance.filter((d) => d.date.startsWith(month)), today) }));
  const latestExam = learners.flatMap((l) => l.profile.exams.filter((e) => e.status === "published")).sort((a, b) => b.heldOn.localeCompare(a.heldOn))[0];
  const examRows = latestExam ? learners.map((l) => l.profile.exams.find((e) => e.id === latestExam.id && e.status === "published")).filter((e) => e !== undefined) : [];
  const avgGpa = examRows.length ? examRows.reduce((s, e) => s + e.gpa, 0) / examRows.length : 0;
  const staffRate = attendanceRate(staff.flatMap((s) => s.days.filter((d) => d.date.startsWith(month))), today);
  const boys = students.filter((s) => s.gender === "Male").length;

  const tiles = [
    { label: "Students", value: String(students.length), hint: `${boys} boys · ${students.length - boys} girls`, icon: GraduationCap, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Attendance this month", value: `${thisMonth.attendance ?? 0}%`, hint: `Staff ${staffRate.rate}%`, icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
    { label: "This month's fees paid", value: `${thisMonth.fees}%`, hint: `${formatTaka(accounts.reduce((s, a) => s + a.overdue, 0))} overdue`, icon: Wallet, accent: "bg-amber-50 text-amber-600" },
    { label: latestExam ? `${latestExam.name} GPA` : "Latest exam", value: latestExam ? avgGpa.toFixed(2) : "—", hint: latestExam ? `Pass rate ${pct(examRows.filter((e) => e.gpa > 0).length, examRows.length)}%` : "No results yet", icon: TrendingUp, accent: "bg-rose-50 text-rose-600" },
  ];

  const classes = [...new Set(students.map((s) => s.className))].sort((a, b) => classOrder(a) - classOrder(b));
  const maxClass = Math.max(1, ...classes.map((c) => students.filter((s) => s.className === c).length));

  const funnel = [
    ["Applied", admissions.length, "bg-slate-400"],
    ["In review", admissions.filter((a) => a.status === "pending" || a.status === "in_review").length, "bg-sky-500"],
    ["Approved", admissions.filter((a) => a.status === "approved").length, "bg-indigo-500"],
    ["Enrolled (fee paid)", admissions.filter((a) => a.payments.length > 0).length, "bg-emerald-500"],
    ["Waitlisted / rejected", admissions.filter((a) => a.status === "waitlisted" || a.status === "rejected").length, "bg-rose-400"],
  ] as const;

  const attention: { label: string; count: number; hint: string; href: string; icon: LucideIcon }[] = [
    { label: "Attendance below 75%", count: studentRates.filter((s) => s.att.school >= 5 && s.att.rate < 75).length, hint: "Students, this month", href: "/attendance/reports", icon: CalendarCheck },
    { label: "Tuition 2+ months overdue", count: accounts.filter((a) => a.overdueMonths >= 2).length, hint: "Admit cards are withheld", href: "/fees/dues", icon: Wallet },
    { label: latestExam ? `Failed ${latestExam.name}` : "Failed latest exam", count: examRows.filter((e) => e.gpa === 0).length, hint: "At least one subject below pass", href: "/results", icon: ClipboardCheck },
    { label: "Applications to review", count: admissions.filter((a) => a.status === "pending" || a.status === "in_review").length, hint: "Admissions", href: "/admissions", icon: UserPlus },
    { label: "Staff attendance below 85%", count: staff.filter((s) => { const r = attendanceRate(s.days.filter((d) => d.date.startsWith(month)), today); return r.school >= 5 && r.rate < 85; }).length, hint: "Teachers, this month", href: "/attendance/staff", icon: BriefcaseBusiness },
    { label: "Salary pending", count: staff.filter((s) => s.salary.pending > 0).length, hint: formatTaka(staff.reduce((s, x) => s + x.salary.pending, 0)), href: "/teachers", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <Tiles tiles={tiles} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 print:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2 print:col-span-2 print:shadow-none">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Attendance & fee collection</h2>
              <p className="text-xs text-fg-muted">Each month of {today.slice(0, 4)}, students.</p>
            </div>
            <div className="flex gap-3 text-[11px] font-medium text-fg-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Attendance
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Fees paid
              </span>
            </div>
          </div>
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <div className="flex h-52 min-w-[520px] items-end gap-3">
              {byMonth.map((m) => (
                <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="flex w-full flex-1 items-end justify-center gap-1">
                    {(
                      [
                        [m.attendance ?? 0, "bg-emerald-500", "Attendance"],
                        [m.fees, "bg-amber-400", "Fees paid"],
                      ] as const
                    ).map(([v, cls, label]) => (
                      <div key={label} className="flex h-full w-3.5 items-end rounded-md bg-soft sm:w-5" title={`${MONTH_SHORT[Number(m.month.slice(5)) - 1]} · ${label} ${v}%`}>
                        <div className={cn("w-full rounded-md print:[print-color-adjust:exact]", cls)} style={{ height: `${v}%` }} />
                      </div>
                    ))}
                  </div>
                  <span className={cn("text-[11px] font-medium", m.month === month ? "text-indigo-600" : "text-fg-subtle")}>{MONTH_SHORT[Number(m.month.slice(5)) - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 print:shadow-none">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <AlertTriangle className="h-4 w-4 text-fg-muted" />
            Needs attention
          </h2>
          <ul className="mt-3 space-y-1">
            {attention.map(({ label, count, hint, href, icon: Icon }) => (
              <li key={label}>
                <Link href={href} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-subtle">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", count ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{label}</span>
                    <span className="block truncate text-xs text-fg-muted">{hint}</span>
                  </span>
                  <span className={cn("text-lg font-bold tabular-nums", count ? "text-rose-600" : "text-emerald-600")}>{count}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-fg-subtle print:hidden" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 print:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2 print:col-span-2 print:shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Enrollment by class</h2>
              <p className="text-xs text-fg-muted">Boys and girls, with this month&apos;s attendance.</p>
            </div>
            <div className="flex gap-3 text-[11px] font-medium text-fg-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Boys
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-pink-400" /> Girls
              </span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {classes.map((c) => {
              const list = students.filter((s) => s.className === c);
              const b = list.filter((s) => s.gender === "Male").length;
              const att = attendanceRate(studentRates.filter((s) => s.student.className === c).flatMap((s) => s.profile.attendance.filter((d) => d.date.startsWith(month))), today);
              return (
                <li key={c} className="grid grid-cols-[72px_1fr_44px_52px] items-center gap-3 text-sm">
                  <span className="truncate font-medium text-fg">{c}</span>
                  <div className="flex h-3 overflow-hidden rounded-full bg-soft" style={{ width: `${Math.max(8, (list.length / maxClass) * 100)}%` }}>
                    <div className="bg-sky-500 print:[print-color-adjust:exact]" style={{ width: `${pct(b, list.length)}%` }} />
                    <div className="flex-1 bg-pink-400 print:[print-color-adjust:exact]" />
                  </div>
                  <span className="text-right tabular-nums text-fg-secondary">{list.length}</span>
                  <span className={cn("text-right text-xs font-semibold tabular-nums", att.school ? rateText(att.rate) : "text-fg-subtle")}>{att.school ? `${Math.round(att.rate)}%` : "—"}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6 print:shadow-none">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <UserPlus className="h-4 w-4 text-fg-muted" />
            Admissions {today.slice(0, 4)}
          </h2>
          <p className="text-xs text-fg-muted">From application to enrolment.</p>
          <ul className="mt-4 space-y-3">
            {funnel.map(([label, n, cls]) => (
              <li key={label}>
                <div className="flex justify-between text-sm">
                  <span className="text-fg-secondary">{label}</span>
                  <span className="font-semibold tabular-nums text-fg">{n}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-soft">
                  <div className={cn("h-full rounded-full print:[print-color-adjust:exact]", cls)} style={{ width: `${pct(n, Math.max(1, funnel[0][1]))}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-subtle px-3 py-2 text-xs text-fg-muted">
            Conversion: <b className="text-fg">{pct(funnel[3][1], Math.max(1, funnel[0][1]))}%</b> of applicants enrolled.
          </p>
        </Card>
      </div>
    </div>
  );
}
