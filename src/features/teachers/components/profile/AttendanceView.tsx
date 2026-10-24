"use client";

import { useState } from "react";
import { CalendarPlus, PenLine, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/features/admissions/utils";
import { AttendanceCalendar } from "@/features/students/components/profile/AttendanceCalendar";
import { ATTENDANCE_STYLE, MONTHS, formatDuration, inMonth, summarize } from "@/features/students/components/profile/attendance-utils";
import { EditAttendanceDialog } from "@/features/students/components/profile/admin/EditAttendanceDialog";
import { WeekendCard, WeekendDialog } from "@/features/students/components/profile/admin/WeekendDialog";
import { localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { useTeacher } from "../../hooks/use-teacher";
import { useTeacherAdminStore } from "../../store/teacher-admin.store";
import { NewTeacherLeaveDialog } from "./admin/LeaveDialogs";

const STATUS_TONE = { present: "success", late: "warning", absent: "danger", leave: "violet", holiday: "info", weekend: "neutral" } as const;

export function TeacherAttendanceView({ slug }: { slug: string }) {
  const { teacher, teachers, attendance: days, attendanceFrom, shift, corrections, leaveUsage, weekend } = useTeacher(slug);
  const setAttendance = useTeacherAdminStore((s) => s.setAttendance);
  const today = localToday();
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [weekendOpen, setWeekendOpen] = useState(false);
  const setWeekend = useTeacherAdminStore((s) => s.setWeekend);
  if (!teacher || !days || !shift || !leaveUsage || !weekend) return null;
  const isCorrected = (date: string) => Boolean(corrections?.[date]);

  // This academic year only, for the summary.
  const thisYear = days.filter((d) => d.date.startsWith(today.slice(0, 4)));
  const summary = summarize(thisYear);
  const monthLog = inMonth(days, year, month)
    .filter((d) => d.status !== "weekend")
    .reverse();
  const months = Array.from(new Set(thisYear.map((d) => d.date.slice(0, 7)))).map((key) => {
    const [y, m] = key.split("-").map(Number) as [number, number];
    return { key, label: MONTHS[m - 1]!.slice(0, 3), ...summarize(inMonth(days, y, m - 1)) };
  });
  const lateDays = thisYear.filter((d) => d.status === "late").reverse();

  const tiles = [
    { label: `Attendance ${today.slice(0, 4)}`, value: `${summary.rate}%`, className: "text-indigo-600" },
    { label: "Working days", value: summary.schoolDays },
    { label: "Present", value: summary.present, className: "text-emerald-600" },
    { label: "Late", value: summary.late, className: "text-amber-600" },
    { label: "Leave", value: summary.leave, className: "text-violet-600" },
    { label: "Absent", value: summary.absent, className: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          Staff check in 20 min before classes. Click any day to correct it — corrections are marked <Badge tone="info">Edited</Badge> and logged.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAdding(true)} disabled={teacher.status === "left"}>
            <CalendarPlus className="h-4 w-4" />
            Add leave
          </Button>
          <Button onClick={() => setEditing(today)} disabled={teacher.status === "left"}>
            <UserCheck className="h-4 w-4" />
            Mark today
          </Button>
        </div>
      </div>

      <Card className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
        {tiles.map((t) => (
          <div key={t.label} className="px-5 py-4">
            <p className="text-xs font-medium text-fg-muted">{t.label}</p>
            <p className={cn("mt-1 text-2xl font-bold tabular-nums text-fg", t.className)}>{t.value}</p>
          </div>
        ))}
      </Card>

      <WeekendCard plan={weekend} onManage={() => setWeekendOpen(true)} />

      <AttendanceCalendar
        days={days}
        shift={shift}
        enrolledOn={attendanceFrom!}
        month={month}
        year={year}
        onChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
        onDayClick={setEditing}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Month by month</h2>
          <p className="mt-0.5 text-xs text-fg-muted">Share of working days per status. Click a month to open it above.</p>
          <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
            {months.map((m) => {
              const segments = [
                { value: m.present, className: "bg-emerald-500" },
                { value: m.late, className: "bg-amber-400" },
                { value: m.leave, className: "bg-violet-500" },
                { value: m.absent, className: "bg-rose-500" },
              ];
              const active = m.key === `${year}-${String(month + 1).padStart(2, "0")}`;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setYear(Number(m.key.slice(0, 4)));
                    setMonth(Number(m.key.slice(5, 7)) - 1);
                  }}
                  title={`${m.label}: ${m.rate}%`}
                  className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[11px] font-semibold tabular-nums text-fg-muted">{m.schoolDays ? `${Math.round(m.rate)}%` : "—"}</span>
                  <span className={cn("flex w-full max-w-10 flex-1 flex-col-reverse overflow-hidden rounded-lg bg-soft transition", active && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-surface")}>
                    {segments.map((seg, i) => (
                      <span key={i} className={seg.className} style={{ height: `${m.schoolDays ? (seg.value / m.schoolDays) * 100 : 0}%` }} />
                    ))}
                  </span>
                  <span className={cn("text-xs font-medium", active ? "text-indigo-600" : "text-fg-muted")}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Late arrivals</h2>
          <p className="mt-0.5 text-xs text-fg-muted">{lateDays.length} day(s) this year</p>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
            {lateDays.map((d) => (
              <li key={d.date} className="flex items-center justify-between gap-3 rounded-xl bg-subtle px-3 py-2.5">
                <p className="text-sm font-medium text-fg">{formatDate(d.date)}</p>
                <span className="text-xs tabular-nums text-amber-600">{d.checkIn}</span>
              </li>
            ))}
            {lateDays.length === 0 && <li className="py-6 text-center text-sm text-fg-muted">Always on time 🎉</li>}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">
            Daily log · {MONTHS[month]} {year}
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">Check-in and check-out from the staff biometric device.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="py-3 pl-5 pr-3 sm:pl-6">Date</th>
                <th className="px-3 py-3">Day</th>
                <th className="px-3 py-3">Check-in</th>
                <th className="px-3 py-3">Check-out</th>
                <th className="px-3 py-3">Hours</th>
                <th className="px-3 py-3">Status</th>
                <th className="w-16 py-3 pl-3 pr-5 sm:pr-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {monthLog.map((d) => (
                <tr key={d.date}>
                  <td className="py-3 pl-5 pr-3 font-medium text-fg sm:pl-6">{formatDate(d.date)}</td>
                  <td className="px-3 py-3 text-fg-muted">{new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}</td>
                  <td className="px-3 py-3 tabular-nums text-fg-secondary">{d.checkIn ?? "—"}</td>
                  <td className="px-3 py-3 tabular-nums text-fg-secondary">{d.checkOut ?? (d.checkIn ? "On campus" : "—")}</td>
                  <td className="px-3 py-3 tabular-nums text-fg-secondary">{d.minutes ? formatDuration(d.minutes) : "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge tone={STATUS_TONE[d.status]} dot>
                        {d.status === "holiday" || d.status === "leave" ? (d.note ?? ATTENDANCE_STYLE[d.status].label) : ATTENDANCE_STYLE[d.status].label}
                      </Badge>
                      {isCorrected(d.date) && <Badge tone="info">Edited</Badge>}
                    </div>
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                    {d.date <= today && (
                      <button
                        type="button"
                        onClick={() => setEditing(d.date)}
                        aria-label={`Edit attendance for ${formatDate(d.date)}`}
                        className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600"
                      >
                        <PenLine className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {monthLog.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-fg-muted">
                    No records for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <EditAttendanceDialog
          key={editing}
          name={teacher.name}
          date={editing}
          current={days.find((d) => d.date === editing)}
          shift={shift}
          corrected={isCorrected(editing)}
          onSave={(value, detail) => setAttendance(teacher.id, editing, value, detail)}
          onClose={() => setEditing(null)}
        />
      )}
      {weekendOpen && <WeekendDialog name={teacher.name} plan={weekend} onSave={(plan, action, detail) => setWeekend(teacher.id, plan, action, detail)} onClose={() => setWeekendOpen(false)} />}
      {adding && <NewTeacherLeaveDialog teacher={teacher} teachers={teachers} usage={leaveUsage} onClose={() => setAdding(false)} />}
    </div>
  );
}
