"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2, CheckCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";
import { sectionKey, sectionSlug } from "@/features/classes/demoData/mock-data";
import { ATTENDANCE_STYLE, adminMark } from "@/features/students/components/profile/attendance-utils";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import { studentHref } from "@/features/students/utils";
import { toast } from "@/store/toast.store";

import { countDay, dayOf, useSchoolAttendance, type StudentRow } from "../hooks/use-school-attendance";
import { DateBar } from "./DateBar";
import { CountStrip, LoadingBlocks, QuickMark, STATUS_TONE, SearchInput, StatusChips, StatusBar, isOff, type MarkStatus } from "./parts";

/**
 * Take / correct attendance for every student on one day, grouped by section.
 * Writes the same records as the student profile and the section register.
 * BACKEND: PUT /attendance/:date [{ studentId, status }]
 */
export function StudentRegisterView() {
  const { students, hydrated, today, date, setDate } = useSchoolAttendance();
  const setAttendance = useStudentAdminStore((s) => s.setAttendance);
  const corrections = useStudentAdminStore((s) => s.attendance);
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("all");
  const [status, setStatus] = useState("all");

  const classes = useMemo(() => [...new Set(students.map((r) => r.student.className))], [students]);
  const inClass = useMemo(() => students.filter((r) => className === "all" || r.student.className === className), [students, className]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inClass.filter((r) => {
      const d = dayOf(r.days, date);
      if (status === "unmarked" ? d : status !== "all" && d?.status !== status) return false;
      return !q || [r.student.name, r.student.id, String(r.student.roll)].some((v) => v.toLowerCase().includes(q));
    });
  }, [inClass, search, status, date]);

  if (!hydrated) return <LoadingBlocks />;

  const counts = countDay(inClass, date);
  const groups = new Map<string, StudentRow[]>();
  for (const r of visible) {
    const key = sectionKey(r.student.className, r.student.section);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const unmarked = visible.filter((r) => !dayOf(r.days, date));

  const mark = (r: StudentRow, s: MarkStatus) =>
    setAttendance(r.student.id, date, adminMark(s, r.shift, date), `${formatDate(date)} → ${ATTENDANCE_STYLE[s].label} (from school register)`);

  function markRestPresent() {
    for (const r of unmarked) mark(r, "present");
    toast("Marked present", { description: `${unmarked.length} student(s) · ${formatDate(date)}` });
  }

  return (
    <div className="space-y-6">
      <DateBar date={date} today={today} onChange={setDate}>
        <Button onClick={markRestPresent} disabled={unmarked.length === 0}>
          <CheckCheck className="h-4 w-4" />
          Mark rest present{unmarked.length ? ` (${unmarked.length})` : ""}
        </Button>
      </DateBar>

      <CountStrip counts={counts} />

      <Card className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
        <StatusChips value={status} onChange={setStatus} counts={counts} />
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, ID or roll..." />
          </div>
          <Select aria-label="Class" value={className} onChange={(e) => setClassName(e.target.value)} className="sm:w-40">
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {groups.size === 0 ? (
        <Card>
          <EmptyState icon={CalendarX2} title="No students found" description="Try another class, status or search." />
        </Card>
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([key, rows]) => {
            const first = rows[0]!.student;
            const c = countDay(rows, date);
            return (
              <Card key={key} className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-line bg-subtle/50 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Link href={`/classes/${sectionSlug(first.className, first.section)}/attendance`} className="font-semibold text-fg hover:text-indigo-600">
                      {first.className} · Section {first.section}
                    </Link>
                    <span className="text-xs text-fg-muted">{rows.length} shown</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs tabular-nums text-fg-muted">
                    <span>
                      <b className="text-emerald-600">{c.present + c.late}</b> in · <b className="text-rose-600">{c.absent}</b> absent{c.unmarked > 0 && <> · <b className="text-amber-600">{c.unmarked}</b> left</>}
                    </span>
                    <StatusBar counts={c} className="h-2 w-24" />
                  </div>
                </div>
                <div className="divide-y divide-line">
                  {rows.map((r) => {
                    const day = dayOf(r.days, date);
                    const edited = Boolean(corrections[r.student.id]?.[date]);
                    return (
                      <div key={r.student.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                        <Link href={studentHref(r.student, "attendance")} className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="w-8 text-center text-sm font-bold tabular-nums text-fg-subtle">{r.student.roll}</span>
                          <StudentAvatar name={r.student.name} photo={r.student.photo} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg hover:text-indigo-600">{r.student.name}</p>
                            <p className="text-xs text-fg-muted">{day?.checkIn ? `In ${day.checkIn}${day.checkOut ? ` · out ${day.checkOut}` : ""}` : (day?.note ?? "No record")}</p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 pl-11 sm:pl-0">
                          {day && (
                            <Badge tone={STATUS_TONE[day.status]} dot>
                              {ATTENDANCE_STYLE[day.status].label}
                            </Badge>
                          )}
                          {edited && <Badge tone="info">Edited</Badge>}
                          {isOff(day?.status) ? <span className="text-xs text-fg-subtle">Day off</span> : <QuickMark value={day?.status} onMark={(s) => mark(r, s)} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
