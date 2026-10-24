"use client";

import { useState } from "react";
import Link from "next/link";
import { PenLine, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AssignSubjectDialog } from "@/features/classes/components/profile/admin/SectionDialogs";
import { sectionLabel } from "@/features/classes/demoData/mock-data";
import { useSectionActions } from "@/features/classes/hooks/use-section-actions";
import { sectionHref } from "@/features/classes/utils";
import type { Teacher } from "@/features/teachers/types/types";
import { teacherHref } from "@/features/teachers/utils";
import { toast } from "@/store/toast.store";

import { teacherSubjectName } from "../../demoData/catalog";
import { useSubject, type SectionTeaching } from "../../hooks/use-subject";
import { useSubjectAdminStore } from "../../store/subject-admin.store";

export function SubjectClassesView({ slug }: { slug: string }) {
  const { subject, teaching, teachers } = useSubject(slug);
  const [editing, setEditing] = useState<SectionTeaching | null>(null);
  const [bulk, setBulk] = useState(false);
  const log = useSubjectAdminStore((s) => s.log);
  if (!subject || !teaching) return null;

  const religion = subject.type === "Religion";
  const assigned = teaching.filter((t) => t.assigned.length > 0).length;
  const none = teaching.filter((t) => t.assigned.length === 0 && !t.fallback).length;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Sections & teachers</h2>
          <p className="text-xs text-fg-muted">
            {teaching.length} section(s) · {assigned} with an assigned teacher · {teaching.length - assigned - none} on the school default · {none} without a teacher
          </p>
        </div>
        <Button onClick={() => setBulk(true)} disabled={teaching.length === 0}>
          <Users className="h-4 w-4" />
          Assign to a whole class
        </Button>
      </Card>

      {religion && (
        <Card className="p-4 text-sm text-fg-secondary sm:px-5">
          Religion classes run per religion — each student studies their own religion&apos;s subject. Assign this subject&apos;s teacher here; students of other religions are taught by their own religion teacher.
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="py-3 pl-5 pr-3">Section</th>
                <th className="px-3 py-3">Students</th>
                <th className="px-3 py-3">Teacher</th>
                <th className="px-3 py-3">Periods / week</th>
                <th className="py-3 pl-3 pr-5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teaching.map((t) => {
                const periods = t.assigned.reduce((s, a) => s + a.assignment.periodsPerWeek, 0);
                return (
                  <tr key={t.section.key}>
                    <td className="py-3 pl-5 pr-3">
                      <Link href={sectionHref(t.section, "subjects")} className="font-medium text-fg hover:text-indigo-600">
                        {sectionLabel(t.section.className, t.section.section)}
                      </Link>
                      <p className="text-xs text-fg-subtle">
                        {t.section.settings.room} · {t.section.settings.shift}
                      </p>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-fg-secondary">{t.learners}</td>
                    <td className="px-3 py-3">
                      {t.assigned.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {t.assigned.map(({ teacher }) => (
                            <Link key={teacher.id} href={teacherHref(teacher, "classes")} className="flex items-center gap-2 hover:text-indigo-600">
                              <Avatar name={teacher.name} size="sm" />
                              <span className="font-medium text-fg-secondary">{teacher.name}</span>
                            </Link>
                          ))}
                        </div>
                      ) : t.fallback ? (
                        <span className="flex items-center gap-2">
                          <Avatar name={t.fallback.name} size="sm" />
                          <span className="text-fg-secondary">{t.fallback.name}</span>
                          <Badge>School default</Badge>
                        </span>
                      ) : (
                        <Badge tone="warning">Not assigned</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-fg-secondary">{periods || subject.periodsPerWeek}</td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <Button size="sm" variant={t.assigned.length ? "ghost" : "outline"} onClick={() => setEditing(t)}>
                        <PenLine className="h-3.5 w-3.5" />
                        {t.assigned.length ? "Change" : "Assign"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {teaching.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-fg-muted">
                    No active sections in {subject.classes.join(", ")}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <AssignSubjectDialog
          section={editing.section}
          subject={subject.name}
          current={editing.assigned.map((a) => a.teacher)}
          defaultPeriods={editing.assigned.reduce((s, a) => s + a.assignment.periodsPerWeek, 0) || subject.periodsPerWeek}
          teachers={teachers}
          onClose={() => setEditing(null)}
          onSaved={(teacher, periods) => log(subject.name, "teachers", `Teacher set for ${editing.section.className} ${editing.section.section}`, `${teacher.name} · ${periods}/week`)}
        />
      )}
      {bulk && <BulkAssignDialog subjectName={subject.name} periodsDefault={subject.periodsPerWeek} teaching={teaching} teachers={teachers} onClose={() => setBulk(false)} />}
    </div>
  );
}

/** One teacher for every section of a class. BACKEND: PUT /subjects/:id/classes/:class/teacher */
function BulkAssignDialog({ subjectName, periodsDefault, teaching, teachers, onClose }: { subjectName: string; periodsDefault: number; teaching: SectionTeaching[]; teachers: Teacher[]; onClose: () => void }) {
  const actions = useSectionActions();
  const log = useSubjectAdminStore((s) => s.log);
  const classes = [...new Set(teaching.map((t) => t.section.className))];
  const [className, setClassName] = useState(classes[0] ?? "");
  const active = teachers.filter((t) => t.status !== "left");
  const qualified = active.filter((t) => t.subjects.includes(teacherSubjectName(subjectName)));
  const [teacherId, setTeacherId] = useState(qualified[0]?.id ?? active[0]?.id ?? "");
  const [periods, setPeriods] = useState(periodsDefault);
  const targets = teaching.filter((t) => t.section.className === className);
  const teacher = teachers.find((t) => t.id === teacherId);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Assign to a whole class"
      description={`${subjectName} · every section of the class`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!teacher || targets.length === 0}
            onClick={() => {
              if (!teacher) return;
              for (const t of targets) actions.assignSubject(t.section, subjectName, periods, teacher, t.assigned.map((a) => a.teacher));
              log(subjectName, "teachers", `Teacher set for ${className}`, `${teacher.name} · ${targets.length} section(s) · ${periods}/week`);
              toast("Teacher assigned", { description: `${subjectName} · ${className} (${targets.length} sections) → ${teacher.name}` });
              onClose();
            }}
          >
            Assign to {targets.length} section{targets.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <FieldGrid>
        <FormField label="Class">
          <Select value={className} onChange={(e) => setClassName(e.target.value)} className="h-11">
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Periods / week">
          <Input type="number" min={1} max={10} value={periods} onChange={(e) => setPeriods(e.target.valueAsNumber || 1)} />
        </FormField>
        <FormField label="Teacher" className="sm:col-span-2">
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
            {qualified.length > 0 && (
              <optgroup label={`Teaches ${subjectName}`}>
                {qualified.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.designation}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Other teachers">
              {active
                .filter((t) => !qualified.includes(t))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.subjects.join(", ")}
                  </option>
                ))}
            </optgroup>
          </Select>
        </FormField>
      </FieldGrid>
    </Dialog>
  );
}
