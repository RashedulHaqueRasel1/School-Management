"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, CalendarCheck, CalendarDays, Download, GraduationCap, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";
import { sectionKey } from "@/features/classes/demoData/mock-data";
import { sectionHref } from "@/features/classes/utils";
import { MONTHS, summarize } from "@/features/students/components/profile/attendance-utils";
import { SESSION_START } from "@/features/students/demoData/profile-data";
import type { AttendanceDay } from "@/features/students/types/types";
import { studentHref } from "@/features/students/utils";
import { teacherHref } from "@/features/teachers/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { countDay, useSchoolAttendance } from "../hooks/use-school-attendance";
import { LoadingBlocks, RateBar, StatTiles, downloadCsv, rateText } from "./parts";

type Summary = ReturnType<typeof summarize>;
type Line = { key: string; name: string; sub: string; href: string; photo?: string | null; s: Summary };

const LOW = 85;

function total(list: Summary[]) {
  const t = { schoolDays: 0, present: 0, late: 0, absent: 0, leave: 0, holidays: 0, rate: 0 };
  for (const s of list) for (const k of ["schoolDays", "present", "late", "absent", "leave"] as const) t[k] += s[k];
  t.rate = t.schoolDays ? Math.round(((t.present + t.late) / t.schoolDays) * 1000) / 10 : 0;
  return t;
}

/**
 * Monthly attendance by section / student / staff, with CSV export.
 * BACKEND: GET /attendance/report?month=YYYY-MM&type=students|staff
 */
export function MonthlyReportView() {
  const { students, staff, sections, hydrated, today } = useSchoolAttendance();
  const [picked, setPicked] = useState<string | null>(null);
  const [type, setType] = useState<"students" | "staff">("students");
  if (!hydrated) return <LoadingBlocks />;

  const month = picked ?? today.slice(0, 7);
  const months: string[] = [];
  for (let m = today.slice(0, 7); m >= SESSION_START.slice(0, 7); ) {
    months.push(m);
    const [y, mm] = m.split("-").map(Number) as [number, number];
    m = mm === 1 ? `${y - 1}-12` : `${y}-${String(mm - 1).padStart(2, "0")}`;
  }
  const label = (m: string) => `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
  const inMonth = (days: AttendanceDay[]) => summarize(days.filter((d) => d.date.startsWith(month)));

  const people = type === "students" ? students : staff;
  const lines: Line[] =
    type === "students"
      ? students.map((r) => ({ key: r.student.id, name: r.student.name, sub: `${r.student.className} ${r.student.section} · Roll ${r.student.roll}`, href: studentHref(r.student, "attendance"), photo: r.student.photo, s: inMonth(r.days) }))
      : staff.map((r) => ({ key: r.teacher.id, name: r.teacher.name, sub: `${r.teacher.designation} · ${r.teacher.department}`, href: teacherHref(r.teacher, "attendance"), photo: r.teacher.photo, s: inMonth(r.days) }));
  const sum = total(lines.map((l) => l.s));
  const low = lines.filter((l) => l.s.schoolDays > 0 && l.s.rate < LOW).sort((a, b) => a.s.rate - b.s.rate);

  // Daily rate for every school day of the month (up to today).
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)
    .filter((d) => d <= today)
    .map((d) => ({ date: d, c: countDay(people, d) }))
    .filter(({ c }) => c.off < c.total && c.total - c.off - c.unmarked > 0);

  const sectionRows = sections
    .filter((s) => !s.archived && s.students.length > 0)
    .map((s) => ({ section: s, s: total(students.filter((r) => sectionKey(r.student.className, r.student.section) === s.key).map((r) => inMonth(r.days))) }));

  function exportCsv() {
    const header = ["ID", "Name", type === "students" ? "Class" : "Designation", "School days", "Present", "Late", "Absent", "Leave", "Rate %"];
    downloadCsv([header, ...lines.map((l) => [l.key, l.name, l.sub, l.s.schoolDays, l.s.present, l.s.late, l.s.absent, l.s.leave, l.s.rate])], `${type}-attendance-${month}.csv`);
    toast("Export ready", { description: `${label(month)} · ${lines.length} ${type === "students" ? "students" : "staff"} downloaded as CSV.`, tone: "info" });
  }

  const tiles = [
    { label: "Average attendance", value: sum.schoolDays ? `${sum.rate}%` : "—", hint: `${type === "students" ? "Students" : "Staff"} · ${label(month)}`, icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
    { label: "School days", value: String(daily.length), hint: month === today.slice(0, 7) ? "So far this month" : "Days with a register", icon: CalendarDays, accent: "bg-sky-50 text-sky-600" },
    { label: "Absences", value: String(sum.absent), hint: `${sum.late} late · ${sum.leave} leave days`, icon: UserX, accent: "bg-rose-50 text-rose-600" },
    { label: `Below ${LOW}%`, value: String(low.length), hint: `of ${lines.length} ${type === "students" ? "students" : "staff"}`, icon: AlertTriangle, accent: low.length ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:px-5 lg:flex-row lg:items-center">
        <div className="flex gap-1 rounded-xl bg-soft p-1">
          {(
            [
              ["students", "Students", GraduationCap],
              ["staff", "Staff", BriefcaseBusiness],
            ] as const
          ).map(([v, text, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              aria-pressed={type === v}
              className={cn("flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition", type === v ? "bg-surface text-fg shadow-card" : "text-fg-muted hover:text-fg")}
            >
              <Icon className="h-4 w-4" />
              {text}
            </button>
          ))}
        </div>
        <p className="flex-1 text-sm text-fg-secondary">
          Report for <span className="font-semibold text-fg">{label(month)}</span>
        </p>
        <div className="flex gap-2">
          <Select aria-label="Month" value={month} onChange={(e) => setPicked(e.target.value)} className="w-44">
            {months.map((m) => (
              <option key={m} value={m}>
                {label(m)}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </Card>

      <StatTiles tiles={tiles} />

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">Daily attendance</h2>
        <p className="text-xs text-fg-muted">Present + late over everyone marked, per school day.</p>
        {daily.length === 0 ? (
          <p className="mt-4 rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">No school days recorded in {label(month)}.</p>
        ) : (
          <div className="mt-5 overflow-x-auto [scrollbar-width:thin]">
            <div className="flex h-44 min-w-max items-end gap-1.5 sm:min-w-0">
              {daily.map(({ date, c }) => (
                <div key={date} className="group relative flex h-full w-6 flex-col items-center justify-end gap-1.5 sm:w-auto sm:flex-1" title={`${formatDate(date)} · ${c.rate}% · ${c.absent} absent`}>
                  <span className={cn("text-[10px] font-semibold tabular-nums opacity-0 transition group-hover:opacity-100", rateText(c.rate))}>{Math.round(c.rate)}</span>
                  <div className="flex w-full max-w-8 flex-1 items-end rounded-md bg-soft">
                    <div className={cn("w-full rounded-md", c.rate >= 90 ? "bg-emerald-400" : c.rate >= 75 ? "bg-amber-400" : "bg-rose-400")} style={{ height: `${Math.max(4, c.rate)}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-fg-subtle">{Number(date.slice(8))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5 pb-3 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">{type === "students" ? "By section" : "By staff member"}</h2>
            <p className="text-xs text-fg-muted">{type === "students" ? "Open a section to see its register." : "Open a profile to see the calendar and leave."}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="px-5 py-2 sm:px-6">{type === "students" ? "Section" : "Name"}</th>
                  <th className="px-2 py-2 text-center">Present</th>
                  <th className="px-2 py-2 text-center">Late</th>
                  <th className="px-2 py-2 text-center">Absent</th>
                  <th className="px-2 py-2 text-center">Leave</th>
                  <th className="w-44 px-5 py-2 sm:px-6">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(type === "students"
                  ? sectionRows.map(({ section, s }) => ({ key: section.key, name: `${section.className} · ${section.section}`, sub: `${section.students.length} students · ${section.classTeacher.name}`, href: sectionHref(section, "attendance"), s }))
                  : [...lines].sort((a, b) => a.name.localeCompare(b.name))
                ).map((l) => (
                  <tr key={l.key} className="transition hover:bg-subtle/50">
                    <td className="px-5 py-2.5 sm:px-6">
                      <Link href={l.href} className="group block min-w-0">
                        <p className="truncate font-medium text-fg group-hover:text-indigo-600">{l.name}</p>
                        <p className="truncate text-xs text-fg-muted">{l.sub}</p>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-emerald-600">{l.s.present}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-amber-600">{l.s.late}</td>
                    <td className={cn("px-2 py-2.5 text-center tabular-nums", l.s.absent ? "font-semibold text-rose-600" : "text-fg-subtle")}>{l.s.absent}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-violet-600">{l.s.leave}</td>
                    <td className="px-5 py-2.5 sm:px-6">
                      <RateBar rate={l.s.rate} empty={l.s.schoolDays === 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <AlertTriangle className="h-4 w-4 text-fg-muted" />
                Below {LOW}%
              </h2>
              <p className="text-xs text-fg-muted">Lowest attendance first.</p>
            </div>
            <Badge tone={low.length ? "warning" : "success"}>{low.length}</Badge>
          </div>
          {low.length === 0 ? (
            <p className="mt-4 rounded-xl bg-emerald-50 py-8 text-center text-sm text-emerald-700">Everyone is on track 🎉</p>
          ) : (
            <ul className="mt-4 max-h-[520px] divide-y divide-line overflow-y-auto">
              {low.map((l) => (
                <li key={l.key}>
                  <Link href={l.href} className="flex items-center gap-3 py-2.5 transition hover:bg-subtle/50">
                    <StudentAvatar name={l.name} photo={l.photo ?? null} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{l.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {l.sub} · {l.s.absent} absent
                      </p>
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", rateText(l.s.rate))}>{l.s.rate}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
