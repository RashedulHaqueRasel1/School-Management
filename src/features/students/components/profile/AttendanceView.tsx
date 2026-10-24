"use client";

import { useState } from "react";
import { CalendarPlus, PenLine, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import { localToday } from "../../demoData/profile-data";
import { useStudent } from "../../hooks/use-student";
import { useStudentAdminStore } from "../../store/student-admin.store";
import { EditAttendanceDialog } from "./admin/EditAttendanceDialog";
import { NewLeaveDialog } from "./admin/LeaveDialogs";
import { WeekendCard, WeekendDialog } from "./admin/WeekendDialog";
import { AttendanceCalendar } from "./AttendanceCalendar";
import { ATTENDANCE_STYLE, MONTHS, formatDuration, inMonth, summarize } from "./attendance-utils";

const STATUS_TONE = { present: "success", late: "warning", absent: "danger", leave: "violet", holiday: "info", weekend: "neutral" } as const;

export function AttendanceView({ slug }: { slug: string }) {
  const { student, profile, weekend } = useStudent(slug);
  const today = localToday();
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [weekendOpen, setWeekendOpen] = useState(false);
  const setWeekend = useStudentAdminStore((s) => s.setWeekend);
  const corrections = useStudentAdminStore((s) => (student ? s.attendance[student.id] : undefined));
  const setAttendance = useStudentAdminStore((s) => s.setAttendance);
  if (!student || !profile) return null;
  const isCorrected = (date: string) => Boolean(corrections?.[date]);

  const days = profile.attendance;
  const session = summarize(days);
  const monthLog = inMonth(days, year, month)
    .filter((d) => d.status !== "weekend")
    .reverse();
  const missed = days.filter((d) => d.status === "absent" || d.status === "leave").reverse();

  // Month-by-month breakdown for the session so far.
  const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7)))).map((key) => {
    const [y, m] = key.split("-").map(Number) as [number, number];
    return { key, label: MONTHS[m - 1]!.slice(0, 3), ...summarize(inMonth(days, y, m - 1)) };
  });

  const tiles = [
    { label: "Attendance rate", value: `${session.rate}%`, className: "text-indigo-600" },
    { label: "School days", value: session.schoolDays },
    { label: "Present", value: session.present, className: "text-emerald-600" },
    { label: "Late", value: session.late, className: "text-amber-600" },
    { label: "Leave", value: session.leave, className: "text-violet-600" },
    { label: "Absent", value: session.absent, className: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          Click any day on the calendar or in the log to correct it. Corrections are marked <Badge tone="info">Edited</Badge> and logged.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAdding(true)}>
            <CalendarPlus className="h-4 w-4" />
            Add leave
          </Button>
          <Button onClick={() => setEditing(today)}>
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
        shift={profile.shift}
        enrolledOn={student.enrolledOn}
        month={month}
        year={year}
        onChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
        onDayClick={setEditing}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Monthly trend */}
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Month by month</h2>
          <p className="mt-0.5 text-xs text-fg-muted">Share of school days per status. Click a month to open it above.</p>
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
                  title={`${m.label}: ${m.rate}% · ${m.present} present, ${m.late} late, ${m.leave} leave, ${m.absent} absent`}
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
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-fg-muted">
            {(["present", "late", "leave", "absent"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", ATTENDANCE_STYLE[s].dot)} />
                {ATTENDANCE_STYLE[s].label}
              </span>
            ))}
          </div>
        </Card>

        {/* Absences & leave */}
        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Absences & leave</h2>
          <p className="mt-0.5 text-xs text-fg-muted">{missed.length} day(s) this session</p>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
            {missed.map((d) => (
              <li key={d.date} className="flex items-center justify-between gap-3 rounded-xl bg-subtle px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-fg">{formatDate(d.date)}</p>
                  <p className="text-xs text-fg-muted">{d.note ?? "No reason given"}</p>
                </div>
                <Badge tone={STATUS_TONE[d.status]}>{ATTENDANCE_STYLE[d.status].label}</Badge>
              </li>
            ))}
            {missed.length === 0 && <li className="py-6 text-center text-sm text-fg-muted">Perfect attendance 🎉</li>}
          </ul>
        </Card>
      </div>

      {/* Daily log */}
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">
            Daily log · {MONTHS[month]} {year}
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">Check-in and check-out times recorded at the school gate.</p>
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
          name={student.name}
          onSave={(value, detail) => setAttendance(student.id, editing, value, detail)}
          date={editing}
          current={days.find((d) => d.date === editing)}
          shift={profile.shift}
          corrected={isCorrected(editing)}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && <NewLeaveDialog student={student} onClose={() => setAdding(false)} />}
      {weekendOpen && <WeekendDialog name={student.name} plan={weekend} onSave={(plan, action, detail) => setWeekend(student.id, plan, action, detail)} onClose={() => setWeekendOpen(false)} />}
    </div>
  );
}
