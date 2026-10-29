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
import { ATTENDANCE_STYLE, adminMark } from "@/features/students/components/profile/attendance-utils";
import { useTeacherAdminStore } from "@/features/teachers/store/teacher-admin.store";
import { teacherHref } from "@/features/teachers/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { countDay, dayOf, useSchoolAttendance } from "../hooks/use-school-attendance";
import type { StaffRow } from "../hooks/use-staff-attendance";
import { DateBar } from "./DateBar";
import { CountStrip, LoadingBlocks, QuickMark, STATUS_TONE, SearchInput, StatusChips, isOff, type MarkStatus } from "./parts";

/**
 * Take / correct staff attendance for one day (same records as the teacher profile).
 * BACKEND: PUT /staff-attendance/:date [{ teacherId, status }]
 */
export function StaffRegisterView() {
  const { staff, hydrated, today, date, setDate } = useSchoolAttendance();
  const setAttendance = useTeacherAdminStore((s) => s.setAttendance);
  const corrections = useTeacherAdminStore((s) => s.attendance);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const departments = useMemo(() => [...new Set(staff.map((r) => r.teacher.department))].sort(), [staff]);
  const inDept = useMemo(
    () => staff.filter((r) => department === "all" || r.teacher.department === department).sort((a, b) => a.teacher.name.localeCompare(b.teacher.name)),
    [staff, department],
  );
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inDept.filter((r) => {
      const d = dayOf(r.days, date);
      if (status === "unmarked" ? d : status !== "all" && d?.status !== status) return false;
      return !q || [r.teacher.name, r.teacher.id, r.teacher.designation, ...r.teacher.subjects].some((v) => v.toLowerCase().includes(q));
    });
  }, [inDept, search, status, date]);

  if (!hydrated) return <LoadingBlocks />;

  const counts = countDay(inDept, date);
  const unmarked = visible.filter((r) => !dayOf(r.days, date));

  const save = (r: StaffRow, s: MarkStatus) =>
    setAttendance(r.teacher.id, date, adminMark(s, r.shift, date), `${formatDate(date)} → ${ATTENDANCE_STYLE[s].label} (from staff register)`);

  async function mark(r: StaffRow, s: MarkStatus) {
    const ok = await confirmAction({
      title: `Mark ${ATTENDANCE_STYLE[s].label.toLowerCase()}?`,
      description: `${r.teacher.name} · ${formatDate(date)}.`,
      confirmLabel: `Mark ${ATTENDANCE_STYLE[s].label.toLowerCase()}`,
      tone: s === "absent" ? "danger" : "primary",
      rememberKey: "register:staff",
    });
    if (ok) save(r, s);
  }

  async function markRestPresent() {
    if (!(await confirmAction({ title: "Mark the rest present?", description: `${unmarked.length} unmarked staff · ${formatDate(date)}.`, confirmLabel: "Mark present" }))) return;
    for (const r of unmarked) save(r, "present");
    toast("Marked present", { description: `${unmarked.length} staff · ${formatDate(date)}` });
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, ID, designation or subject..." />
          </div>
          <Select aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="sm:w-44">
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarX2} title="No staff found" description="Try another department, status or search." />
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {visible.map((r) => {
            const day = dayOf(r.days, date);
            const edited = Boolean(corrections[r.teacher.id]?.[date]);
            return (
              <div key={r.teacher.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <Link href={teacherHref(r.teacher, "attendance")} className="flex min-w-0 flex-1 items-center gap-3">
                  <StudentAvatar name={r.teacher.name} photo={r.teacher.photo} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg hover:text-indigo-600">{r.teacher.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {r.teacher.designation} · {r.teacher.department} · {r.teacher.shift}
                    </p>
                  </div>
                </Link>
                <p className="text-xs tabular-nums text-fg-muted sm:w-36 sm:text-right">{day?.checkIn ? `In ${day.checkIn}${day.checkOut ? ` · out ${day.checkOut}` : ""}` : (day?.note ?? "No record")}</p>
                <div className="flex items-center gap-2">
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
        </Card>
      )}
    </div>
  );
}
