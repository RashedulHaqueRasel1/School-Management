"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Award, CalendarCheck, Clock, History, Mail, Phone, UserRound, Wallet } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDateTime, formatTaka } from "@/features/admissions/utils";
import { summarize } from "@/features/students/components/profile/attendance-utils";
import { localToday, weekdayOf } from "@/features/students/demoData/profile-data";
import { studentHref } from "@/features/students/utils";
import { DAY_NAMES, periodTime } from "@/features/teachers/demoData/mock-data";
import { cn } from "@/lib/utils";

import { useSection } from "../../hooks/use-section";
import { sectionHref } from "../../utils";

export function SectionOverviewView({ slug }: { slug: string }) {
  const { section, members, grid, audit } = useSection(slug);
  if (!section || !members || !grid || !audit) return null;

  const today = localToday();
  const thisMonth = today.slice(0, 7);
  const rows = members.map((m) => {
    const month = summarize(m.profile.attendance.filter((d) => d.date.startsWith(thisMonth)));
    const latest = m.profile.exams.filter((e) => e.status === "published").at(-1);
    return { ...m, rate: month.rate, schoolDays: month.schoolDays, gpa: latest?.gpa, due: m.ledger.outstanding };
  });
  const withDays = rows.filter((r) => r.schoolDays > 0);
  const avgRate = withDays.length ? Math.round(withDays.reduce((s, r) => s + r.rate, 0) / withDays.length) : 0;
  const withGpa = rows.filter((r) => r.gpa !== undefined);
  const avgGpa = withGpa.length ? withGpa.reduce((s, r) => s + r.gpa!, 0) / withGpa.length : 0;
  const dues = rows.reduce((s, r) => s + r.due, 0);
  const attention = rows.filter((r) => (r.schoolDays > 0 && r.rate < 85) || r.due > 0).sort((a, b) => a.rate - b.rate);
  const weekday = weekdayOf(today);
  const todayPeriods = grid.filter((c) => c.day === weekday);

  const tiles = [
    { label: "Attendance this month", value: `${avgRate}%`, hint: "Average of all students", icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Average GPA", value: avgGpa ? avgGpa.toFixed(2) : "—", hint: "Latest published exam", icon: Award, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Tuition dues", value: formatTaka(dues), hint: `${rows.filter((r) => r.due > 0).length} student(s) owe`, icon: Wallet, accent: dues ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600" },
    { label: "Need attention", value: String(attention.length), hint: "Low attendance or dues", icon: AlertTriangle, accent: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, hint, icon: Icon, accent }) => (
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Today&apos;s routine</h2>
              <p className="text-xs text-fg-muted">
                {DAY_NAMES[weekday]} · {section.settings.shift} shift
              </p>
            </div>
            <Link href={sectionHref(section, "routine")} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Full routine <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {todayPeriods.length === 0 ? (
            <p className="rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">Weekly holiday — no classes today.</p>
          ) : (
            <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {todayPeriods.map((c) => (
                <li key={c.slot} className={cn("flex items-center gap-3 rounded-xl border px-3.5 py-2.5", c.cell ? "border-line" : "border-dashed border-line")}>
                  <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <span className="text-[8px] font-semibold uppercase leading-none">Prd</span>
                    <span className="text-sm font-bold leading-tight">{c.period}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{c.cell?.subject ?? "Free period"}</p>
                    <p className="truncate text-xs text-fg-muted">{c.cell?.teacherName ?? "—"}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] tabular-nums text-fg-subtle">
                    <Clock className="h-3 w-3" />
                    {periodTime(section.settings.shift, c.period).split(" – ")[0]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <UserRound className="h-4 w-4 text-fg-muted" />
            Class teacher
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <Avatar name={section.classTeacher.name} size="lg" className="h-12 w-12" />
            <div className="min-w-0">
              <p className="font-semibold text-fg">{section.classTeacher.name}</p>
              <p className="text-xs text-fg-muted">
                {section.classTeacher.designation} · {section.classTeacher.subject}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <a href={`tel:${section.classTeacher.phone}`} className="flex items-center gap-2 text-fg-secondary hover:text-indigo-600">
              <Phone className="h-4 w-4 text-fg-subtle" />
              {section.classTeacher.phone}
            </a>
            <a href={`mailto:${section.classTeacher.email}`} className="flex items-center gap-2 truncate text-fg-secondary hover:text-indigo-600">
              <Mail className="h-4 w-4 text-fg-subtle" />
              {section.classTeacher.email}
            </a>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Students needing attention</h2>
          <p className="text-xs text-fg-muted">Attendance below 85% this month, or tuition due.</p>
          {attention.length === 0 ? (
            <p className="mt-4 rounded-xl bg-emerald-50 py-6 text-center text-sm text-emerald-700">Everyone is on track 🎉</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {attention.slice(0, 6).map((r) => (
                <li key={r.student.id}>
                  <Link href={studentHref(r.student)} className="flex items-center gap-3 py-2.5 transition hover:bg-subtle/50">
                    <StudentAvatar name={r.student.name} photo={r.student.photo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{r.student.name}</p>
                      <p className="text-xs text-fg-muted">Roll {r.student.roll}</p>
                    </div>
                    {r.schoolDays > 0 && r.rate < 85 && <Badge tone="warning">{r.rate}% attendance</Badge>}
                    {r.due > 0 && <Badge tone="danger">{formatTaka(r.due)} due</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <History className="h-4 w-4 text-fg-muted" />
            Recent changes
          </h2>
          {audit.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No changes yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {audit.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-medium text-fg">{a.action}</p>
                  {a.detail && <p className="truncate text-xs text-fg-secondary">{a.detail}</p>}
                  <p className="text-[11px] text-fg-subtle">{formatDateTime(a.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
