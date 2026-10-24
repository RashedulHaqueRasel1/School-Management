"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, PenLine } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { teacherHref } from "@/features/teachers/utils";
import type { Teacher } from "@/features/teachers/types/types";

import { useSection } from "../../hooks/use-section";
import { AssignSubjectDialog } from "./admin/SectionDialogs";

export function SectionSubjectsView({ slug }: { slug: string }) {
  const { section, subjects, teachers } = useSection(slug);
  const [editing, setEditing] = useState<{ name: string; current: Teacher[]; periods: number } | null>(null);
  if (!section || !subjects) return null;

  const unassigned = subjects.filter((s) => s.teachers.length === 0 && !s.defaultTeacher && !s.name.includes("Religion") && !s.name.includes("Islam"));
  const weekly = subjects.reduce((sum, s) => sum + (s.teachers.reduce((t, a) => t + a.assignment.periodsPerWeek, 0) || 0), 0);

  return (
    <div className="space-y-6">
      {unassigned.length > 0 && (
        <Card className="flex items-start gap-3 border-amber-200/70 bg-amber-50 p-4 sm:px-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-700">
            <span className="font-semibold">{unassigned.length} subject(s) have no teacher:</span> {unassigned.map((s) => s.name).join(", ")}. Assign a teacher so the period appears in the routine.
          </p>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Subjects & teachers</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              National curriculum for {section.className} · {weekly} periods assigned to specific teachers. &quot;School default&quot; = the subject&apos;s default teacher (shown on student profiles) until you assign one.
            </p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="py-3 pl-5 pr-3 sm:pl-6">Subject</th>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Teacher</th>
                <th className="px-3 py-3">Periods / week</th>
                <th className="py-3 pl-3 pr-5 text-right sm:pr-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subjects.map((s) => {
                const periods = s.teachers.reduce((sum, a) => sum + a.assignment.periodsPerWeek, 0);
                const religion = s.name.includes("Religion") || s.name.includes("Islam");
                return (
                  <tr key={s.name}>
                    <td className="py-3 pl-5 pr-3 sm:pl-6">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-fg">{s.name}</span>
                        {s.custom && <Badge tone="violet">Extra</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-fg-muted">{s.code || "—"}</td>
                    <td className="px-3 py-3">
                      {s.teachers.length === 0 ? (
                        religion ? (
                          <Badge>Per student&apos;s religion</Badge>
                        ) : s.defaultTeacher ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={s.defaultTeacher.name} size="sm" />
                            <span className="text-fg-secondary">{s.defaultTeacher.name}</span>
                            <Badge>School default</Badge>
                          </span>
                        ) : (
                          <Badge tone="warning">Not assigned</Badge>
                        )
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {s.teachers.map(({ teacher }) => (
                            <Link key={teacher.id} href={teacherHref(teacher, "classes")} className="flex items-center gap-2 hover:text-indigo-600">
                              <Avatar name={teacher.name} size="sm" />
                              <span className="font-medium text-fg-secondary">{teacher.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-fg-secondary">
                      {periods || "—"}
                      {s.periodsPerWeek > 0 && periods !== s.periodsPerWeek && <span className="ml-1.5 text-xs text-fg-subtle">(curriculum {s.periodsPerWeek})</span>}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                      <Button size="sm" variant={s.teachers.length ? "ghost" : "outline"} onClick={() => setEditing({ name: s.name, current: s.teachers.map((t) => t.teacher), periods: periods || s.periodsPerWeek })}>
                        <PenLine className="h-3.5 w-3.5" />
                        {s.teachers.length ? "Change" : "Assign"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <AssignSubjectDialog section={section} subject={editing.name} current={editing.current} defaultPeriods={editing.periods} teachers={teachers} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
