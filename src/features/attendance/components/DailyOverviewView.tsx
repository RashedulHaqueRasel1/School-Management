"use client";

import Link from "next/link";
import { ArrowRight, BellRing, BriefcaseBusiness, CalendarCheck, CheckCircle2, ClipboardList, MessageSquareText, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";
import { sectionCode, sectionKey } from "@/features/classes/demoData/mock-data";
import { sectionHref } from "@/features/classes/utils";
import { ATTENDANCE_STYLE } from "@/features/students/components/profile/attendance-utils";
import { WEEKDAY_NAMES, addDaysIso, weekdayOf } from "@/features/students/demoData/profile-data";
import { studentHref } from "@/features/students/utils";
import { teacherHref } from "@/features/teachers/utils";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { countDay, dayOf, useSchoolAttendance, type DayCounts } from "../hooks/use-school-attendance";
import { useAttendanceStore } from "../store/attendance.store";
import { DateBar } from "./DateBar";
import { LoadingBlocks, RateBar, STATUS_TONE, StatTiles, StatusBar, rateText } from "./parts";

/**
 * School-wide snapshot of one day: rates, sections that still need a register,
 * absent students (with guardian SMS) and staff who are away.
 * BACKEND: GET /attendance/summary?date= · POST /attendance/absence-alerts { studentIds, date }
 */
export function DailyOverviewView() {
  const { students, staff, sections, hydrated, today, date, setDate } = useSchoolAttendance();
  const alerts = useAttendanceStore((s) => s.alerts);
  const markAlerted = useAttendanceStore((s) => s.markAlerted);
  if (!hydrated) return <LoadingBlocks heights={["h-[76px]", "h-[92px]", "h-64", "h-96"]} />;

  const sc = countDay(students, date);
  const tc = countDay(staff, date);
  const allOff = sc.total > 0 && sc.present + sc.late + sc.absent + sc.leave === 0 && sc.off > 0;

  // Last 7 school days ending on the selected date.
  const trend: { date: string; students: DayCounts; staff: DayCounts }[] = [];
  for (let d = date, i = 0; trend.length < 7 && i < 21; d = addDaysIso(d, -1), i++) {
    const c = countDay(students, d);
    // Skip days off (holidays can leave a few students without a record).
    if (d !== date && c.present + c.late + c.absent + c.leave === 0) continue;
    trend.unshift({ date: d, students: c, staff: countDay(staff, d) });
  }

  const bySection = sections
    .filter((s) => !s.archived && s.students.length > 0)
    .map((s) => {
      const rows = students.filter((r) => sectionKey(r.student.className, r.student.section) === s.key);
      return { section: s, counts: countDay(rows, date) };
    });
  const pending = bySection.filter((s) => s.counts.unmarked > 0 && s.counts.off < s.counts.total);

  const absent = students.filter((r) => dayOf(r.days, date)?.status === "absent");
  const alertKey = (id: string) => `${id}::${date}`;
  const toAlert = absent.filter((r) => !alerts[alertKey(r.student.id)]);
  const staffAway = staff
    .map((r) => ({ ...r, day: dayOf(r.days, date) }))
    .filter((r) => r.day && (r.day.status === "absent" || r.day.status === "late" || r.day.status === "leave"));

  async function sendAlerts() {
    if (!(await confirmAction({ title: "Send absence SMS?", description: `${toAlert.length} guardian(s) get an SMS about ${formatDate(date)}.`, confirmLabel: `Send ${toAlert.length} SMS` }))) return;
    markAlerted(toAlert.map((r) => alertKey(r.student.id)));
    toast("Absence SMS sent", { description: `${toAlert.length} guardian(s) · ${formatDate(date)}` });
  }

  const tiles = [
    { label: "Students present", value: allOff ? "—" : `${sc.rate}%`, hint: `${sc.present + sc.late} of ${sc.total - sc.off} · ${sc.late} late`, icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Absent students", value: String(sc.absent), hint: `${absent.length - toAlert.length} guardian(s) notified`, icon: UserX, accent: sc.absent ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600" },
    { label: "Staff present", value: tc.total - tc.off ? `${tc.rate}%` : "—", hint: `${tc.present + tc.late} of ${tc.total - tc.off} · ${tc.leave} on leave`, icon: BriefcaseBusiness, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Registers pending", value: String(pending.length), hint: `${sc.unmarked} student(s) not marked`, icon: ClipboardList, accent: pending.length ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <DateBar date={date} today={today} onChange={setDate}>
        <Link href="/classes" className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-b from-indigo-500 to-indigo-600 px-4 text-sm font-semibold text-white shadow-glow hover:from-indigo-500 hover:to-indigo-500">
          <ClipboardList className="h-4 w-4" />
          Section registers
        </Link>
      </DateBar>

      <StatTiles tiles={tiles} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Day breakdown</h2>
              <p className="text-xs text-fg-muted">
                {WEEKDAY_NAMES[weekdayOf(date)]}, {formatDate(date)}
              </p>
            </div>
            <Legend />
          </div>
          {allOff ? (
            <p className="rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">Day off for the whole school ({dayOf(students[0]?.days ?? [], date)?.note ?? "weekend"}).</p>
          ) : (
            <div className="space-y-5">
              <BreakdownRow label="Students" counts={sc} />
              <BreakdownRow label="Staff" counts={tc} />
            </div>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold text-fg-muted">Student attendance · last {trend.length} school days</p>
            <div className="flex h-36 items-end gap-2 sm:gap-3">
              {trend.map((t) => {
                const marked = t.students.total - t.students.off - t.students.unmarked;
                return (
                  <button key={t.date} type="button" onClick={() => setDate(t.date === today ? null : t.date)} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${formatDate(t.date)} · ${t.students.rate}%`}>
                    <span className={cn("text-[11px] font-semibold tabular-nums", marked ? rateText(t.students.rate) : "text-fg-subtle")}>{marked ? `${Math.round(t.students.rate)}%` : "—"}</span>
                    <div className="flex w-full max-w-12 flex-1 items-end rounded-lg bg-soft">
                      <div
                        className={cn("w-full rounded-lg transition group-hover:opacity-80", t.date === date ? "bg-linear-to-t from-indigo-600 to-indigo-400" : "bg-indigo-200 dark:bg-indigo-500/40")}
                        style={{ height: `${marked ? Math.max(6, t.students.rate) : 0}%` }}
                      />
                    </div>
                    <span className={cn("text-[11px] font-medium", t.date === date ? "text-indigo-600" : "text-fg-subtle")}>{WEEKDAY_NAMES[weekdayOf(t.date)]!.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <UserX className="h-4 w-4 text-fg-muted" />
                Absent students
              </h2>
              <p className="text-xs text-fg-muted">Guardians get an SMS once per day.</p>
            </div>
            <Badge tone={absent.length ? "danger" : "success"}>{absent.length}</Badge>
          </div>
          {absent.length === 0 ? (
            <p className="mt-4 rounded-xl bg-emerald-50 py-8 text-center text-sm text-emerald-700">No absences {date === today ? "today" : "on this day"} 🎉</p>
          ) : (
            <>
              <ul className="mt-4 max-h-80 flex-1 divide-y divide-line overflow-y-auto">
                {absent.map((r) => {
                  const sent = alerts[alertKey(r.student.id)];
                  return (
                    <li key={r.student.id}>
                      <Link href={studentHref(r.student, "attendance")} className="flex items-center gap-3 py-2.5 transition hover:bg-subtle/50">
                        <StudentAvatar name={r.student.name} photo={r.student.photo} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">{r.student.name}</p>
                          <p className="truncate text-xs text-fg-muted">
                            {r.student.className} {r.student.section} · Roll {r.student.roll}
                          </p>
                        </div>
                        {sent ? (
                          <Badge tone="success">
                            <CheckCircle2 className="h-3 w-3" />
                            SMS sent
                          </Badge>
                        ) : (
                          <span className="text-[11px] tabular-nums text-fg-subtle">{r.student.phone}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Button className="mt-4 w-full" onClick={sendAlerts} disabled={toAlert.length === 0}>
                {toAlert.length ? <BellRing className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
                {toAlert.length ? `Notify guardians (${toAlert.length})` : "All guardians notified"}
              </Button>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3 p-5 pb-3 sm:px-6">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Sections</h2>
              <p className="text-xs text-fg-muted">{pending.length ? `${pending.length} register(s) not complete yet — open one to take attendance.` : "Every register is complete."}</p>
            </div>
            <Link href="/attendance/reports" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Monthly report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="hidden grid-cols-[1.4fr_1fr_repeat(3,56px)_1.2fr] gap-3 border-y border-line bg-subtle/60 px-6 py-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle md:grid">
            <span>Section</span>
            <span>Class teacher</span>
            <span className="text-center">Here</span>
            <span className="text-center">Absent</span>
            <span className="text-center">Left</span>
            <span>Rate</span>
          </div>
          <ul className="divide-y divide-line">
            {bySection.map(({ section: s, counts: c }) => {
              const off = c.off === c.total;
              const marked = c.total - c.off - c.unmarked;
              return (
                <li key={s.key}>
                  <Link href={sectionHref(s, "attendance")} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-5 py-3 transition hover:bg-subtle/50 sm:px-6 md:grid-cols-[1.4fr_1fr_repeat(3,56px)_1.2fr]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-700">
                        {sectionCode(s.className, s.section)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg">
                          {s.className} · {s.section}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {c.total} students · {s.settings.shift}
                        </p>
                      </div>
                    </div>
                    <span className="hidden truncate text-sm text-fg-secondary md:block">{s.classTeacher.name}</span>
                    <span className="hidden text-center text-sm font-semibold tabular-nums text-emerald-600 md:block">{c.present + c.late}</span>
                    <span className={cn("hidden text-center text-sm font-semibold tabular-nums md:block", c.absent ? "text-rose-600" : "text-fg-subtle")}>{c.absent}</span>
                    <span className={cn("hidden text-center text-sm tabular-nums md:block", c.unmarked && !off ? "font-semibold text-amber-600" : "text-fg-subtle")}>{off ? "—" : c.unmarked}</span>
                    <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                      {off ? (
                        <Badge tone="neutral">Day off</Badge>
                      ) : marked === 0 ? (
                        <Badge tone="warning" dot>
                          Not taken
                        </Badge>
                      ) : (
                        <div className="w-full">
                          <RateBar rate={c.rate} />
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <BriefcaseBusiness className="h-4 w-4 text-fg-muted" />
                Staff away or late
              </h2>
              <p className="text-xs text-fg-muted">Absent, late or on leave.</p>
            </div>
            <Link href="/attendance/staff" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Register <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {staffAway.length === 0 ? (
            <p className="mt-4 rounded-xl bg-subtle py-8 text-center text-sm text-fg-muted">{tc.off === tc.total ? "Day off for staff." : "All staff on time."}</p>
          ) : (
            <ul className="mt-4 space-y-1">
              {staffAway.map((r) => (
                <li key={r.teacher.id}>
                  <Link href={teacherHref(r.teacher, "attendance")} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-subtle">
                    <StudentAvatar name={r.teacher.name} photo={r.teacher.photo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{r.teacher.name}</p>
                      <p className="truncate text-xs text-fg-muted">{r.day!.checkIn ? `In ${r.day!.checkIn}` : (r.day!.note ?? r.teacher.designation)}</p>
                    </div>
                    <Badge tone={STATUS_TONE[r.day!.status]} dot>
                      {ATTENDANCE_STYLE[r.day!.status].label}
                    </Badge>
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

function Legend() {
  return (
    <div className="hidden flex-wrap items-center gap-3 sm:flex">
      {(["present", "late", "absent", "leave"] as const).map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
          <span className={cn("h-2 w-2 rounded-full", ATTENDANCE_STYLE[s].dot)} />
          {ATTENDANCE_STYLE[s].label}
        </span>
      ))}
    </div>
  );
}

function BreakdownRow({ label, counts: c }: { label: string; counts: DayCounts }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-fg">{label}</p>
        <p className="text-xs tabular-nums text-fg-muted">
          <span className="font-semibold text-emerald-600">{c.present}</span> present · <span className="font-semibold text-amber-600">{c.late}</span> late · <span className="font-semibold text-rose-600">{c.absent}</span> absent ·{" "}
          <span className="font-semibold text-violet-600">{c.leave}</span> leave{c.unmarked > 0 && ` · ${c.unmarked} not marked`}
        </p>
      </div>
      <StatusBar counts={c} />
    </div>
  );
}
