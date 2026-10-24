"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, Clock, HeartPulse, Sun, XCircle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";
import { ATTENDANCE_STYLE, adminMark } from "@/features/students/components/profile/attendance-utils";
import { SHIFTS, localToday } from "@/features/students/demoData/profile-data";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { AttendanceStatus, Student } from "@/features/students/types/types";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useSection } from "../../hooks/use-section";
import { useClassAdminStore } from "../../store/class-admin.store";

const QUICK: { status: AttendanceStatus; label: string; icon: LucideIcon; on: string }[] = [
  { status: "present", label: "P", icon: Sun, on: "bg-emerald-500 text-white" },
  { status: "late", label: "L", icon: Clock, on: "bg-amber-500 text-white" },
  { status: "absent", label: "A", icon: XCircle, on: "bg-rose-500 text-white" },
  { status: "leave", label: "Lv", icon: HeartPulse, on: "bg-violet-500 text-white" },
];

const TONE = { present: "success", late: "warning", absent: "danger", leave: "violet", holiday: "info", weekend: "neutral" } as const;

/**
 * Take / correct attendance for the whole section on one day.
 * BACKEND: PUT /sections/:id/attendance/:date  [{ studentId, status }]
 */
export function SectionAttendanceView({ slug }: { slug: string }) {
  const { section, members } = useSection(slug);
  const setAttendance = useStudentAdminStore((s) => s.setAttendance);
  const corrections = useStudentAdminStore((s) => s.attendance);
  const log = useClassAdminStore((s) => s.log);
  const today = localToday();
  const [date, setDate] = useState(today);
  if (!section || !members) return null;

  const preset = SHIFTS[section.settings.shift] ?? SHIFTS.Morning!;
  const rows = members.map((m) => ({ ...m, day: m.profile.attendance.find((d) => d.date === date) }));
  const off = (r: (typeof rows)[number]) => r.day?.status === "weekend" || r.day?.status === "holiday";
  const counts = { present: 0, late: 0, absent: 0, leave: 0, unmarked: 0 };
  for (const r of rows) {
    if (off(r)) continue;
    if (!r.day) counts.unmarked += 1;
    else if (r.day.status in counts) counts[r.day.status as keyof typeof counts] += 1;
  }
  const allOff = rows.length > 0 && rows.every(off);

  const mark = (student: Student, status: AttendanceStatus) =>
    setAttendance(student.id, date, adminMark(status, preset, date), `${formatDate(date)} → ${ATTENDANCE_STYLE[status].label} (from ${section.className} ${section.section} register)`);

  function markAllPresent() {
    const targets = rows.filter((r) => !off(r) && !r.day);
    for (const r of targets) mark(r.student, "present");
    log(section!.key, "attendance", "Register: all present", `${formatDate(date)} · ${targets.length} student(s)`);
    toast("Marked present", { description: `${targets.length} student(s) · ${formatDate(date)}` });
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Attendance register</h2>
          <p className="text-xs text-fg-muted">Tap P / L / A / Lv for each student. Changes are saved on the student&apos;s attendance and logged.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-44" aria-label="Date" />
          <Button onClick={markAllPresent} disabled={counts.unmarked === 0 || allOff}>
            <CheckCheck className="h-4 w-4" />
            Mark rest present{counts.unmarked ? ` (${counts.unmarked})` : ""}
          </Button>
        </div>
      </Card>

      <Card className="grid grid-cols-2 divide-line sm:grid-cols-5 sm:divide-x">
        {(
          [
            ["Present", counts.present, "text-emerald-600"],
            ["Late", counts.late, "text-amber-600"],
            ["Absent", counts.absent, "text-rose-600"],
            ["Leave", counts.leave, "text-violet-600"],
            ["Not marked", counts.unmarked, "text-fg-muted"],
          ] as const
        ).map(([label, value, cls]) => (
          <div key={label} className="px-5 py-4">
            <p className="text-xs font-medium text-fg-muted">{label}</p>
            <p className={cn("mt-1 text-2xl font-bold tabular-nums", cls)}>{value}</p>
          </div>
        ))}
      </Card>

      {allOff ? (
        <Card className="py-12 text-center text-sm text-fg-muted">{formatDate(date)} is a day off for this section ({rows[0]?.day?.note ?? "weekend"}).</Card>
      ) : (
        <Card className="divide-y divide-line">
          {rows.map((r) => {
            const edited = Boolean(corrections[r.student.id]?.[date]);
            return (
              <div key={r.student.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <Link href={studentHref(r.student, "attendance")} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="w-8 text-center text-sm font-bold tabular-nums text-fg-subtle">{r.student.roll}</span>
                  <StudentAvatar name={r.student.name} photo={r.student.photo} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg hover:text-indigo-600">{r.student.name}</p>
                    <p className="text-xs text-fg-muted">{r.day?.checkIn ? `In ${r.day.checkIn}${r.day.checkOut ? ` · out ${r.day.checkOut}` : ""}` : (r.day?.note ?? "No record")}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {r.day && (
                    <Badge tone={TONE[r.day.status]} dot>
                      {ATTENDANCE_STYLE[r.day.status].label}
                    </Badge>
                  )}
                  {edited && <Badge tone="info">Edited</Badge>}
                  {off(r) ? (
                    <span className="text-xs text-fg-subtle">Day off</span>
                  ) : (
                    <div className="flex rounded-xl bg-soft p-1">
                      {QUICK.map((q) => (
                        <button
                          key={q.status}
                          type="button"
                          onClick={() => mark(r.student, q.status)}
                          aria-pressed={r.day?.status === q.status}
                          title={ATTENDANCE_STYLE[q.status].label}
                          className={cn(
                            "h-8 min-w-9 rounded-lg px-2 text-xs font-bold transition",
                            r.day?.status === q.status ? q.on : "text-fg-muted hover:bg-surface hover:text-fg",
                          )}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <p className="py-10 text-center text-sm text-fg-muted">No students in this section.</p>}
        </Card>
      )}
    </div>
  );
}
