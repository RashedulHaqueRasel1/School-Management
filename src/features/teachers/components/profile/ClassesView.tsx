"use client";

import { useState } from "react";
import { PenLine, Plus, RotateCcw, School, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { DAY_NAMES, MAX_PERIODS_PER_WEEK, PERIODS_PER_DAY, ROUTINE_DAYS, periodTime, seedAssignments } from "../../demoData/mock-data";
import { useTeacher } from "../../hooks/use-teacher";
import { useTeacherAdminStore } from "../../store/teacher-admin.store";
import type { TeachingAssignment } from "../../types/types";
import { AssignmentDialog } from "./admin/ClassDialogs";

const PALETTE = [
  "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
  "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  "bg-amber-50 text-amber-700 ring-amber-200/70",
  "bg-violet-50 text-violet-700 ring-violet-200/70",
  "bg-sky-50 text-sky-700 ring-sky-200/70",
  "bg-rose-50 text-rose-700 ring-rose-200/70",
];

export function ClassesView({ slug }: { slug: string }) {
  const { teacher, assignments, routine, classTeacherOf } = useTeacher(slug);
  const setAssignments = useTeacherAdminStore((s) => s.setAssignments);
  const customised = useTeacherAdminStore((s) => (teacher ? Boolean(s.assignments[teacher.id]) : false));
  const [editing, setEditing] = useState<TeachingAssignment | "new" | null>(null);
  const [removing, setRemoving] = useState<TeachingAssignment | null>(null);
  if (!teacher || !assignments || !routine) return null;

  const weekly = assignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
  const color = (id: string) => PALETTE[Math.max(0, assignments.findIndex((a) => a.id === id)) % PALETTE.length]!;
  const weekday = new Date(`${localToday()}T00:00:00Z`).getUTCDay();
  const left = teacher.status === "left";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Teaching assignments</h2>
              <p className="mt-0.5 text-xs text-fg-muted">Class-sections and subjects this teacher takes. Students of these sections see this teacher.</p>
            </div>
            <div className="flex gap-2">
              {customised && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignments(teacher.id, seedAssignments(teacher), "Assignments reset to default");
                    toast("Assignments reset");
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
              <Button size="sm" onClick={() => setEditing("new")} disabled={left}>
                <Plus className="h-3.5 w-3.5" />
                Assign class
              </Button>
            </div>
          </div>
          {assignments.length === 0 ? (
            <EmptyState icon={School} title="No classes assigned" description="Assign class-sections and subjects to build the weekly routine." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    <th className="py-3 pl-5 pr-3 sm:pl-6">Class</th>
                    <th className="px-3 py-3">Section</th>
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3">Periods / week</th>
                    <th className="w-24 py-3 pl-3 pr-5 sm:pr-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 pl-5 pr-3 font-medium text-fg sm:pl-6">{a.className}</td>
                      <td className="px-3 py-3 text-fg-secondary">{a.section}</td>
                      <td className="px-3 py-3">
                        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", color(a.id))}>{a.subject}</span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-fg-secondary">{a.periodsPerWeek}</td>
                      <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                        <button type="button" onClick={() => setEditing(a)} aria-label={`Edit ${a.subject} ${a.className}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600">
                          <PenLine className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setRemoving(a)} aria-label={`Remove ${a.subject} ${a.className}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Weekly workload</h2>
            <p className="mt-3 text-3xl font-bold tabular-nums text-fg">
              {weekly}
              <span className="text-base font-medium text-fg-muted"> / {MAX_PERIODS_PER_WEEK} periods</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
              <div
                className={cn("h-full rounded-full", weekly > MAX_PERIODS_PER_WEEK ? "bg-rose-500" : weekly > MAX_PERIODS_PER_WEEK * 0.8 ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${Math.min(100, (weekly / MAX_PERIODS_PER_WEEK) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-fg-muted">
              {weekly > MAX_PERIODS_PER_WEEK ? "Overloaded — consider moving a class to a colleague." : `${MAX_PERIODS_PER_WEEK - weekly} period(s) free for substitutions.`}
            </p>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Class teacher of</h2>
            {classTeacherOf && classTeacherOf.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {classTeacherOf.map((c) => (
                  <li key={`${c.className}-${c.section}`}>
                    <Badge tone="info">
                      {c.className} · {c.section}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">Not a class teacher this session.</p>
            )}
            <p className="mt-3 text-xs text-fg-subtle">Change a section&apos;s class teacher from the student profile → Academic details.</p>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Weekly routine</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {teacher.shift} shift · {PERIODS_PER_DAY} periods a day · Friday off. Built from the assignments above.
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] table-fixed text-sm">
            <thead>
              <tr className="border-y border-line bg-subtle/70 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="w-28 py-3 pl-5 text-left sm:pl-6">Day</th>
                {Array.from({ length: PERIODS_PER_DAY }, (_, i) => (
                  <th key={i} className="px-2 py-3 text-left">
                    Period {i + 1}
                    <span className="block text-[10px] font-medium normal-case tracking-normal text-fg-subtle">{periodTime(teacher.shift, i + 1)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROUTINE_DAYS.map((day) => (
                <tr key={day} className={cn(day === weekday && "bg-indigo-50/40")}>
                  <td className="py-2.5 pl-5 font-medium text-fg sm:pl-6">
                    {DAY_NAMES[day]}
                    {day === weekday && <span className="block text-[10px] font-semibold uppercase text-indigo-600">Today</span>}
                  </td>
                  {Array.from({ length: PERIODS_PER_DAY }, (_, i) => {
                    const slot = routine.find((s) => s.day === day && s.period === i + 1);
                    return (
                      <td key={i} className="px-2 py-2.5">
                        {slot ? (
                          <div className={cn("rounded-lg px-2.5 py-2 ring-1 ring-inset", color(slot.assignment.id))}>
                            <p className="truncate text-xs font-semibold">{slot.assignment.subject}</p>
                            <p className="truncate text-[11px] opacity-80">
                              {slot.assignment.className} · {slot.assignment.section}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-line px-2.5 py-2 text-center text-[11px] text-fg-subtle">Free</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <AssignmentDialog teacher={teacher} assignments={assignments} editing={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Remove this class?"
        description={removing ? `${removing.subject} · ${removing.className} ${removing.section} will be removed from ${teacher.name}'s routine.` : ""}
        confirmLabel="Remove"
        onConfirm={() => {
          if (!removing) return;
          setAssignments(
            teacher.id,
            assignments.filter((a) => a.id !== removing.id),
            "Class unassigned",
            `${removing.subject} · ${removing.className} ${removing.section}`,
          );
          toast("Class removed", { description: `${removing.subject} · ${removing.className} ${removing.section}` });
          setRemoving(null);
        }}
      />
    </div>
  );
}
