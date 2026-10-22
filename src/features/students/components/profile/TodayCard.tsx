"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { formatDate } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import { HOLIDAYS, WEEKEND_DAYS, localToday, weekdayOf } from "../../demoData/profile-data";
import type { AttendanceDay, Shift } from "../../types/types";
import { ATTENDANCE_STYLE, formatDuration, timeToMinutes } from "./attendance-utils";

const RING = 2 * Math.PI * 44;

/** Live clock + today's punch in/out, with a "Recent check-ins" tab. */
export function TodayCard({ days, shift }: { days: AttendanceDay[]; shift: Shift }) {
  const [tab, setTab] = useState<"today" | "recent">("today");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayIso = localToday();
  const today = days.find((d) => d.date === todayIso);
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const inMinutes = today?.checkIn ? timeToMinutes(today.checkIn) : null;
  const worked = inMinutes === null ? 0 : (today?.minutes ?? Math.max(0, nowMinutes - inMinutes));
  const progress = Math.min(1, worked / (shift.end - shift.start));

  const offDay = WEEKEND_DAYS.includes(weekdayOf(todayIso)) ? "Weekend" : HOLIDAYS[todayIso];
  const status = today
    ? { label: ATTENDANCE_STYLE[today.status].label, className: STATUS_BAR[today.status] }
    : offDay
      ? { label: offDay, className: "bg-sky-500 text-white" }
      : { label: "Not checked in yet", className: "bg-soft text-fg-muted" };

  const recent = days.filter((d) => d.checkIn || d.status === "absent" || d.status === "leave").slice(-8).reverse();

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-soft p-1">
        {(
          [
            ["today", "Attendance"],
            ["recent", "Recent Check-ins"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn("rounded-lg py-2 text-sm font-semibold transition", tab === value ? "bg-surface text-indigo-600 shadow-sm" : "text-fg-muted hover:text-fg")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <div className="flex flex-1 flex-col">
          <div className="mt-5 text-center">
            <p className="text-3xl font-bold tracking-tight tabular-nums text-fg">
              {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="mt-1 text-sm text-fg-muted">{formatDate(todayIso)}</p>
          </div>

          <div className="relative mx-auto mt-5 h-36 w-36">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
              <defs>
                <linearGradient id="today-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" strokeWidth="9" className="stroke-soft" stroke="currentColor" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#today-ring)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${RING * progress} ${RING}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Today&apos;s hours</p>
              <p className="text-2xl font-bold tabular-nums text-fg">{formatDuration(worked)}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <PunchRow dot="bg-emerald-500" label="Punch In" value={today?.checkIn} />
            <PunchRow dot="bg-orange-500" label="Punch Out" value={today?.checkOut ?? (today?.checkIn ? "On campus" : undefined)} />
          </div>

          <p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Today&apos;s status</p>
          <p className={cn("mt-2 rounded-xl py-3 text-center text-sm font-bold uppercase tracking-wide", status.className)}>{status.label}</p>
        </div>
      ) : (
        <ul className="mt-4 flex-1 divide-y divide-line">
          {recent.map((d) => (
            <li key={d.date} className="flex items-center gap-3 py-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", ATTENDANCE_STYLE[d.status].dot)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{formatDate(d.date)}</p>
                <p className="text-xs text-fg-muted">
                  {new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })} · {ATTENDANCE_STYLE[d.status].label}
                </p>
              </div>
              <div className="text-right text-xs tabular-nums">
                <p className="font-semibold text-fg">{d.checkIn ?? "—"}</p>
                <p className="text-fg-muted">{d.checkOut ?? (d.checkIn ? "On campus" : d.note ?? "")}</p>
              </div>
            </li>
          ))}
          {recent.length === 0 && <li className="py-6 text-center text-sm text-fg-muted">No check-ins yet.</li>}
        </ul>
      )}
    </Card>
  );
}

const STATUS_BAR: Record<AttendanceDay["status"], string> = {
  present: "bg-emerald-600 text-white",
  late: "bg-amber-500 text-white",
  absent: "bg-rose-600 text-white",
  leave: "bg-violet-600 text-white",
  holiday: "bg-sky-500 text-white",
  weekend: "bg-soft text-fg-muted",
};

function PunchRow({ dot, label, value }: { dot: string; label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-subtle/60 px-4 py-3">
      <span className="flex items-center gap-2.5 text-sm text-fg-secondary">
        <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums text-fg">{value ?? "—"}</span>
    </div>
  );
}
