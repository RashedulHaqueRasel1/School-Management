"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, BookOpen, CalendarCheck, CalendarPlus, Clock, School, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { AttendanceCalendar } from "@/features/students/components/profile/AttendanceCalendar";
import { summarize } from "@/features/students/components/profile/attendance-utils";
import { TodayCard } from "@/features/students/components/profile/TodayCard";
import { isOffDay, localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { DAY_NAMES, MAX_PERIODS_PER_WEEK, TEACHER_LEAVE_LABEL, periodTime } from "../../demoData/mock-data";
import { useTeacher } from "../../hooks/use-teacher";
import { teacherHref } from "../../utils";

export function TeacherOverviewView({ slug }: { slug: string }) {
  const { teacher, weekend, attendance, attendanceFrom, shift, leaves, leaveUsage, assignments, routine, classTeacherOf, salary } = useTeacher(slug);
  const today = localToday();
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  if (!teacher || !attendance || !shift || !leaves || !leaveUsage || !assignments || !routine || !salary) return null;

  const session = summarize(attendance);
  const weekly = assignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const todayClasses = routine.filter((s) => s.day === weekday).sort((a, b) => a.period - b.period);
  const pending = leaves.filter((l) => l.status === "pending");
  const upcoming = leaves.filter((l) => l.status === "approved" && l.to >= today);
  const casual = leaveUsage.find((u) => u.type === "casual");

  const stats = [
    { label: "Attendance rate", value: `${session.rate}%`, hint: `${session.late} late · ${session.absent} absent`, icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Weekly load", value: `${weekly}`, hint: `of ${MAX_PERIODS_PER_WEEK} periods · ${assignments.length} classes`, icon: BookOpen, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Casual leave left", value: casual ? `${casual.left}` : "—", hint: casual ? `of ${casual.quota} days this year` : "", icon: CalendarPlus, accent: "bg-violet-50 text-violet-600" },
    {
      label: "Net salary",
      value: formatTaka(salary.net),
      hint: salary.pending > 0 ? `${formatTaka(salary.pending)} due` : "All paid up",
      icon: Wallet,
      accent: salary.pending > 0 ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Card className="flex flex-col gap-3 border-amber-200/70 bg-amber-50 p-4 sm:flex-row sm:items-center sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <BellRing className="h-5 w-5" />
          </span>
          <p className="flex-1 text-sm text-amber-800 dark:text-amber-700">
            <span className="font-semibold">
              {pending.length} leave request{pending.length > 1 ? "s" : ""} waiting for your approval
            </span>{" "}
            — {TEACHER_LEAVE_LABEL[pending[0]!.type].toLowerCase()} from {formatDate(pending[0]!.from)}.
          </p>
          <Link href={teacherHref(teacher, "leave")} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-800 hover:underline dark:text-amber-700">
            Review now <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <TodayCard days={attendance} shift={shift} weekend={weekend} />
        <AttendanceCalendar
          days={attendance}
          shift={shift}
          enrolledOn={attendanceFrom!}
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon, accent }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Today&apos;s classes</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                {DAY_NAMES[weekday]} · {teacher.shift} shift
              </p>
            </div>
            <Link href={teacherHref(teacher, "classes")} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Full routine <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {todayClasses.length === 0 ? (
            <p className="rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">{weekend && isOffDay(today, weekend) ? "Day off — no classes today." : "No classes scheduled today."}</p>
          ) : (
            <ol className="space-y-2.5">
              {todayClasses.map((s) => (
                <li key={`${s.day}-${s.period}`} className="flex items-center gap-4 rounded-xl border border-line px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <span className="text-[9px] font-semibold uppercase leading-none">Prd</span>
                    <span className="text-sm font-bold leading-tight">{s.period}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{s.assignment.subject}</p>
                    <p className="text-xs text-fg-muted">
                      {s.assignment.className} · Section {s.assignment.section}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs tabular-nums text-fg-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {periodTime(teacher.shift, s.period)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <School className="h-4 w-4 text-fg-muted" />
              Class teacher of
            </h2>
            {classTeacherOf && classTeacherOf.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {classTeacherOf.map((c) => (
                  <li key={`${c.className}-${c.section}`}>
                    <Badge tone="info">
                      {c.className} · Section {c.section}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">Not a class teacher this session.</p>
            )}
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Upcoming leave</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">No approved leave ahead.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {upcoming.map((l) => (
                  <li key={l.id} className="rounded-xl bg-subtle px-3 py-2.5">
                    <p className="text-sm font-medium text-fg">
                      {formatDate(l.from)}
                      {l.to !== l.from && ` → ${formatDate(l.to)}`}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {TEACHER_LEAVE_LABEL[l.type]}
                      {l.substitute && ` · substitute: ${l.substitute}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
