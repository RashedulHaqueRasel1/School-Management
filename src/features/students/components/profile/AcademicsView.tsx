"use client";

import { useState } from "react";
import { ArrowLeftRight, Award, BookOpen, BookPlus, CalendarClock, Mail, PenLine, Phone, Target, Trash2, Trophy, UserRound } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { InfoCard } from "@/components/shared/InfoCard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { subjectAlternatives } from "../../demoData/profile-data";
import { useStudent } from "../../hooks/use-student";
import { useStudentAdminStore } from "../../store/student-admin.store";
import type { SubjectInfo } from "../../types/types";
import { ChangeSubjectDialog, EditMarksDialog, SubjectDialog } from "./admin/AcademicDialogs";
import { gradeTone } from "./grade-utils";

export function AcademicsView({ slug }: { slug: string }) {
  const { student, profile } = useStudent(slug);
  const published = profile?.exams.filter((e) => e.status === "published") ?? [];
  const [examId, setExamId] = useState(published.at(-1)?.id);
  const [dialog, setDialog] = useState<"marks" | "subject" | null>(null);
  const [subjectDialog, setSubjectDialog] = useState<SubjectInfo | "new" | null>(null);
  const [removing, setRemoving] = useState<SubjectInfo | null>(null);
  const removeCustomSubject = useStudentAdminStore((s) => s.removeCustomSubject);
  const swaps = useStudentAdminStore((s) => (student ? s.subjectSwaps[student.id] : undefined));
  const editedExams = useStudentAdminStore((s) => (student ? s.marks[student.id] : undefined));
  if (!student || !profile) return null;
  const canChangeSubject = profile.subjects.some((s) => subjectAlternatives(s.name).length > 0);

  const exam = published.find((e) => e.id === examId) ?? published.at(-1);
  const teacherOf = (code: string) => profile.subjects.find((s) => s.code === code)?.teacher;

  return (
    <div className="space-y-6">
      {/* Exam picker */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex min-w-max gap-2">
          {profile.exams.map((e) => {
            const selectable = e.status === "published";
            const active = exam?.id === e.id;
            return (
              <button
                key={e.id}
                type="button"
                disabled={!selectable}
                onClick={() => setExamId(e.id)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-left transition",
                  active ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20" : "border-line-strong bg-surface hover:bg-subtle",
                  !selectable && "cursor-not-allowed opacity-60 hover:bg-surface",
                )}
              >
                <p className="text-sm font-semibold text-fg">{e.name}</p>
                <p className="text-xs text-fg-muted">
                  {e.status === "published" ? `GPA ${e.gpa.toFixed(2)} · ${formatDate(e.heldOn)}` : e.status === "upcoming" ? `Upcoming · ${formatDate(e.heldOn)}` : "Before enrolment"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {exam ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="relative overflow-hidden bg-linear-to-br from-indigo-500 to-violet-600 p-5 text-white">
              <Award className="absolute -right-3 -top-3 h-24 w-24 text-white/10" />
              <p className="text-sm text-indigo-100">GPA</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{exam.gpa.toFixed(2)}</p>
              <p className="mt-1 text-sm font-semibold">Grade {exam.grade}</p>
            </Card>
            <SummaryCard icon={Target} label="Total marks" value={`${exam.total} / ${exam.outOf}`} hint={`${Math.round((exam.total / exam.outOf) * 100)}% overall`} />
            <SummaryCard icon={Trophy} label="Position in class" value={`${exam.position}`} hint={`out of ${exam.classSize} students`} />
            <SummaryCard icon={CalendarClock} label="Remarks" value={exam.grade === "F" ? "Failed" : "Passed"} hint={exam.remarks} />
          </div>

          {/* Marks table */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5 sm:px-6 sm:pt-6">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-fg">{exam.name} — subject-wise marks</h2>
                <p className="mt-0.5 text-xs text-fg-muted">The marker on each bar shows the highest mark in the class.</p>
              </div>
              <div className="flex items-center gap-2">
                {editedExams?.[exam.id] && <Badge tone="info">Edited by admin</Badge>}
                <Button size="sm" variant="outline" onClick={() => setDialog("marks")}>
                  <PenLine className="h-3.5 w-3.5" />
                  Edit marks
                </Button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    <th className="py-3 pl-5 pr-3 sm:pl-6">Subject</th>
                    <th className="px-3 py-3">Teacher</th>
                    <th className="w-[30%] px-3 py-3">Marks</th>
                    <th className="px-3 py-3 text-center">Highest</th>
                    <th className="px-3 py-3 text-center">Grade</th>
                    <th className="py-3 pl-3 pr-5 text-center sm:pr-6">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {exam.results.map((r) => {
                    const teacher = teacherOf(r.code);
                    return (
                      <tr key={r.code}>
                        <td className="py-3.5 pl-5 pr-3 sm:pl-6">
                          <p className="font-semibold text-fg">{r.subject}</p>
                          <p className="font-mono text-[11px] text-fg-subtle">{r.code}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          {teacher && (
                            <div className="flex items-center gap-2">
                              <Avatar name={teacher.name} size="sm" />
                              <span className="text-fg-secondary">{teacher.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-2.5 flex-1 rounded-full bg-soft">
                              <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500" style={{ width: `${(r.obtained / r.fullMarks) * 100}%` }} />
                              <span
                                className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-fg/60"
                                style={{ left: `${(r.highest / r.fullMarks) * 100}%` }}
                                title={`Class highest: ${r.highest}`}
                              />
                            </div>
                            <span className="w-14 text-right font-semibold tabular-nums text-fg">
                              {r.obtained}
                              <span className="font-normal text-fg-subtle">/{r.fullMarks}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center tabular-nums text-fg-muted">{r.highest}</td>
                        <td className="px-3 py-3.5 text-center">
                          <Badge tone={gradeTone(r.grade)} className="w-9 justify-center">
                            {r.grade}
                          </Badge>
                        </td>
                        <td className="py-3.5 pl-3 pr-5 text-center font-semibold tabular-nums text-fg sm:pr-6">{r.gp.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* GPA progress */}
          {published.length > 1 && (
            <Card className="p-5 sm:p-6">
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">GPA progress this session</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {published.map((e, i) => {
                  const prev = published[i - 1];
                  const diff = prev ? e.gpa - prev.gpa : 0;
                  return (
                    <div key={e.id} className="rounded-2xl border border-line p-4">
                      <p className="text-xs text-fg-muted">{e.name}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <p className="text-2xl font-bold tabular-nums text-fg">{e.gpa.toFixed(2)}</p>
                        {prev && (
                          <span className={cn("text-xs font-semibold", diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-fg-muted")}>
                            {diff > 0 ? "▲" : diff < 0 ? "▼" : "•"} {Math.abs(diff).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-soft">
                        <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500" style={{ width: `${(e.gpa / 5) * 100}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-fg-subtle">
                        Position {e.position}/{e.classSize}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No results yet"
            description={`${student.name} joined on ${formatDate(student.enrolledOn)}, after this session's exams. The first result will be the ${
              profile.exams.find((e) => e.status === "upcoming")?.name ?? "next exam"
            }.`}
          />
        </Card>
      )}

      {/* Subjects & teachers */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <InfoCard
          icon={BookOpen}
          title="Subjects & teachers"
          className="xl:col-span-2"
          action={
            <div className="flex gap-2">
              {canChangeSubject && (
                <Button size="sm" variant="outline" onClick={() => setDialog("subject")}>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Swap optional
                </Button>
              )}
              <Button size="sm" onClick={() => setSubjectDialog("new")}>
                <BookPlus className="h-3.5 w-3.5" />
                Add subject
              </Button>
            </div>
          }
        >
          <p className="-mt-1 mb-4 text-xs text-fg-muted">
            {profile.subjects.length} subjects · {profile.subjects.reduce((sum, x) => sum + x.periodsPerWeek, 0)} periods per week. Click the pencil to change a teacher or periods.
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {profile.subjects.map((s) => (
              <li key={s.code} className="group flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-line-strong">
                <Avatar name={s.teacher.name} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
                    <span className="truncate">{s.name}</span>
                    {s.custom ? (
                      <Badge tone="violet" className="text-[10px]">
                        Added
                      </Badge>
                    ) : (
                      subjectAlternatives(s.name).length > 0 && <Badge className="text-[10px]">Optional</Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-fg-muted">
                    {s.teacher.name}
                    {s.teacher.id.startsWith("custom-") && " (guest)"} · {s.periodsPerWeek} periods/week
                  </p>
                  <p className="font-mono text-[10px] text-fg-subtle">{s.code}</p>
                </div>
                <div className="flex shrink-0 items-center">
                  {s.teacher.phone && (
                    <a href={`tel:${s.teacher.phone}`} aria-label={`Call ${s.teacher.name}`} className="rounded-lg p-1.5 text-fg-subtle hover:bg-soft hover:text-indigo-600">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubjectDialog(s)}
                    aria-label={`Edit ${s.name}`}
                    className="rounded-lg p-1.5 text-fg-subtle hover:bg-soft hover:text-indigo-600"
                  >
                    <PenLine className="h-4 w-4" />
                  </button>
                  {s.custom && (
                    <button
                      type="button"
                      onClick={() => setRemoving(s)}
                      aria-label={`Remove ${s.name}`}
                      className="rounded-lg p-1.5 text-fg-subtle hover:bg-soft hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard icon={UserRound} title="Class teacher (guide)">
          <div className="flex flex-col items-center text-center">
            <Avatar name={profile.classTeacher.name} size="lg" className="h-16 w-16 text-lg" />
            <p className="mt-3 font-semibold text-fg">{profile.classTeacher.name}</p>
            <p className="text-xs text-fg-muted">{profile.classTeacher.designation}</p>
            <Badge tone="info" className="mt-2">
              {student.className} · Section {student.section}
            </Badge>
            <p className="mt-4 text-xs leading-relaxed text-fg-muted">
              Guides the class, tracks attendance and conduct, and is the first point of contact for guardians.
            </p>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <a href={`tel:${profile.classTeacher.phone}`} className="flex items-center gap-2 rounded-xl bg-subtle px-3 py-2 text-fg-secondary hover:text-indigo-600">
                <Phone className="h-4 w-4" /> {profile.classTeacher.phone}
              </a>
              <a href={`mailto:${profile.classTeacher.email}`} className="flex items-center gap-2 truncate rounded-xl bg-subtle px-3 py-2 text-fg-secondary hover:text-indigo-600">
                <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{profile.classTeacher.email}</span>
              </a>
            </div>
          </div>
        </InfoCard>
      </div>
      {dialog === "marks" && exam && <EditMarksDialog key={exam.id} student={student} exam={exam} onClose={() => setDialog(null)} />}
      {subjectDialog && (
        <SubjectDialog
          key={subjectDialog === "new" ? "new" : subjectDialog.code}
          student={student}
          subjects={profile.subjects}
          subject={subjectDialog === "new" ? undefined : subjectDialog}
          onClose={() => setSubjectDialog(null)}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          removeCustomSubject(student.id, removing);
          toast("Subject removed", { description: removing.name, tone: "info" });
        }}
        title={`Remove ${removing?.name ?? "subject"}?`}
        description="The subject and its teacher assignment are removed from this student's list. Exam results are not affected."
        confirmLabel="Remove"
      />
      {dialog === "subject" && <ChangeSubjectDialog student={student} subjects={profile.subjects} swaps={swaps ?? {}} onClose={() => setDialog(null)} />}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, hint }: { icon: typeof Award; label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-fg">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs text-fg-subtle">{hint}</p>
    </Card>
  );
}
