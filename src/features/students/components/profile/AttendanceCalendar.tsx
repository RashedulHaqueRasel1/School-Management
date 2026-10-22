"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { SESSION_START, localToday, minutesToTime } from "../../demoData/profile-data";
import type { AttendanceDay, Shift } from "../../types/types";
import { ATTENDANCE_STYLE, MONTHS, inMonth, summarize } from "./attendance-utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AttendanceCalendarProps = {
  days: AttendanceDay[];
  shift: Shift;
  enrolledOn: string;
  /** 0-based month */
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  /** Admin: click a past/today school day to correct it. */
  onDayClick?: (date: string) => void;
};

/** Monthly attendance calendar with summary counts. */
export function AttendanceCalendar({ days, shift, enrolledOn, month, year, onChange, onDayClick }: AttendanceCalendarProps) {
  const today = localToday();
  const startDate = enrolledOn > SESSION_START ? enrolledOn : SESSION_START;
  const min = { year: Number(startDate.slice(0, 4)), month: Number(startDate.slice(5, 7)) - 1 };
  const max = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 };
  const index = (y: number, m: number) => y * 12 + m;
  const canPrev = index(year, month) > index(min.year, min.month);
  const canNext = index(year, month) < index(max.year, max.month);
  const years = Array.from({ length: max.year - min.year + 1 }, (_, i) => min.year + i);

  const go = (delta: number) => {
    const next = index(year, month) + delta;
    onChange(next % 12, Math.floor(next / 12));
  };

  const byDate = new Map(days.map((d) => [d.date, d]));
  const monthDays = inMonth(days, year, month);
  const stats = summarize(monthDays);
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const counters = [
    { label: "School days", value: stats.schoolDays, dot: "bg-fg" },
    { label: "Present", value: stats.present, dot: ATTENDANCE_STYLE.present.dot },
    { label: "Late", value: stats.late, dot: ATTENDANCE_STYLE.late.dot },
    { label: "Leave", value: stats.leave, dot: ATTENDANCE_STYLE.leave.dot },
    { label: "Holidays", value: stats.holidays, dot: ATTENDANCE_STYLE.holiday.dot },
    { label: "Absent", value: stats.absent, dot: ATTENDANCE_STYLE.absent.dot },
  ];

  return (
    <Card className="p-5 sm:p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="rounded-xl border border-line-strong px-3 py-2 text-sm font-semibold text-fg">Attendance Overview</h2>
          <span className="flex items-center gap-2 rounded-xl border border-line-strong px-3 py-2 text-sm text-fg-secondary">
            <span className="font-semibold text-fg">Shift: {shift.name}</span>
            <span className="h-4 w-px bg-line-strong" />
            {minutesToTime(shift.start)} – {minutesToTime(shift.end)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} disabled={!canPrev} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong text-fg-secondary transition hover:bg-subtle disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Select aria-label="Month" value={month} onChange={(e) => onChange(Number(e.target.value), year)} className="w-36">
            {MONTHS.map((name, i) => (
              <option key={name} value={i} disabled={index(year, i) < index(min.year, min.month) || index(year, i) > index(max.year, max.month)}>
                {name}
              </option>
            ))}
          </Select>
          <Select aria-label="Year" value={year} onChange={(e) => onChange(month, Number(e.target.value))} className="w-24">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <button type="button" onClick={() => go(1)} disabled={!canNext} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong text-fg-secondary transition hover:bg-subtle disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Counters */}
      <div className="mt-5 grid grid-cols-3 gap-4 border-b border-line pb-5 sm:grid-cols-6">
        {counters.map((c) => (
          <div key={c.label}>
            <p className="flex items-center gap-2 text-xl font-bold tabular-nums text-fg">
              <span className={cn("h-2 w-2 rounded-full", c.dot)} />
              {c.value}
            </p>
            <p className="pl-4 text-xs text-fg-muted">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="hidden rounded-xl bg-subtle sm:block" />;
          const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const record = byDate.get(date);
          const style = record ? ATTENDANCE_STYLE[record.status] : null;
          const isToday = date === today;
          const beforeEnrolment = date < startDate;
          const title = record
            ? [style?.label, record.note, record.checkIn && `In ${record.checkIn}`, record.checkOut && `Out ${record.checkOut}`].filter(Boolean).join(" · ")
            : beforeEnrolment
              ? "Before enrolment"
              : undefined;

          const editable = Boolean(onDayClick) && !beforeEnrolment && date <= today && record?.status !== "weekend";
          const Cell = editable ? "button" : "div";
          return (
            <Cell
              key={date}
              title={editable ? `${title ?? "No record"} — click to edit` : title}
              {...(editable ? { type: "button" as const, onClick: () => onDayClick!(date) } : {})}
              className={cn(
                editable && "cursor-pointer hover:border-indigo-400 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-indigo-500",
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border p-1 text-center transition sm:min-h-16",
                isToday ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-line",
                beforeEnrolment && "opacity-40",
              )}
            >
              <span className={cn("text-sm font-semibold", isToday ? "text-indigo-600" : "text-fg")}>{day}</span>
              {style && (
                <>
                  <span className={cn("hidden w-full truncate rounded-md px-1 py-0.5 text-[10px] font-semibold sm:block", style.pill)}>{style.label}</span>
                  <span className={cn("h-1.5 w-1.5 rounded-full sm:hidden", style.dot)} />
                </>
              )}
            </Cell>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-fg-muted">
        {Object.values(ATTENDANCE_STYLE).map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", s.dot)} />
            {s.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

