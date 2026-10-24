"use client";

import Link from "next/link";
import { Award, BarChart3, Trophy, UserCheck } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { gradeTone } from "@/features/students/components/profile/grade-utils";
import { EXAMS } from "@/features/students/demoData/profile-data";
import { studentHref } from "@/features/students/utils";
import { teacherHref } from "@/features/teachers/utils";
import { cn } from "@/lib/utils";

import { useSubject } from "../../hooks/use-subject";
import { scoreTone } from "../../utils";

const GRADES = ["A+", "A", "A-", "B", "C", "D", "F"];
const GRADE_BAR: Record<string, string> = { "A+": "bg-emerald-500", A: "bg-emerald-400", "A-": "bg-teal-400", B: "bg-sky-400", C: "bg-amber-400", D: "bg-orange-400", F: "bg-rose-500" };

/** Every learner's result for this subject in one exam. */
export function examResults(learners: NonNullable<ReturnType<typeof useSubject>["subject"]>["learners"], subjectName: string, examId: string) {
  return learners.flatMap((l) => {
    const exam = l.profile.exams.find((e) => e.id === examId && e.status === "published");
    const r = exam?.results.find((x) => x.subject === subjectName);
    return r ? [{ student: l.student, result: r, pct: (r.obtained / r.fullMarks) * 100 }] : [];
  });
}

export function SubjectOverviewView({ slug }: { slug: string }) {
  const { subject } = useSubject(slug);
  if (!subject) return null;

  const trend = EXAMS.map((e) => {
    const rows = examResults(subject.learners, subject.name, e.id);
    return { exam: e, avg: rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : undefined, rows };
  });
  const latest = [...trend].reverse().find((t) => t.avg !== undefined);
  const rows = latest?.rows ?? [];
  const byClass = subject.classes
    .map((c) => {
      const list = rows.filter((r) => r.student.className === c);
      return { className: c, count: list.length, avg: list.length ? list.reduce((s, r) => s + r.pct, 0) / list.length : undefined };
    })
    .filter((c) => c.count > 0);
  const grades = GRADES.map((g) => ({ grade: g, count: rows.filter((r) => r.result.grade === g).length }));
  const top = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <BarChart3 className="h-4 w-4 text-fg-muted" />
            Class-wise average
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">{latest ? `${latest.exam.name} · ${rows.length} student(s)` : "No published results yet"}</p>
          {byClass.length === 0 ? (
            <p className="mt-6 rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">Results appear here once an exam is published.</p>
          ) : (
            <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
              {byClass.map((c) => (
                <div key={c.className} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${c.className}: ${c.avg!.toFixed(1)}% (${c.count} students)`}>
                  <span className={cn("text-[11px] font-semibold tabular-nums", scoreTone(c.avg!))}>{Math.round(c.avg!)}%</span>
                  <span className="flex w-full max-w-12 flex-1 flex-col justify-end overflow-hidden rounded-lg bg-soft">
                    <span className="rounded-lg bg-linear-to-t from-violet-500 to-fuchsia-400" style={{ height: `${c.avg}%` }} />
                  </span>
                  <span className="truncate text-xs font-medium text-fg-muted">{c.className.replace("Class ", "C-")}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <Award className="h-4 w-4 text-fg-muted" />
            Grade distribution
          </h2>
          <ul className="mt-5 space-y-2.5">
            {grades.map((g) => (
              <li key={g.grade} className="flex items-center gap-3 text-sm">
                <Badge tone={gradeTone(g.grade)} className="w-9 justify-center">
                  {g.grade}
                </Badge>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
                  <span className={cn("block h-full rounded-full", GRADE_BAR[g.grade])} style={{ width: `${rows.length ? (g.count / rows.length) * 100 : 0}%` }} />
                </span>
                <span className="w-6 text-right text-xs font-semibold tabular-nums text-fg-secondary">{g.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Exam trend</h2>
          <ul className="mt-4 space-y-3">
            {trend.map((t) => (
              <li key={t.exam.id} className="flex items-center justify-between gap-3 rounded-xl bg-subtle px-3.5 py-2.5">
                <span className="text-sm font-medium text-fg">{t.exam.name}</span>
                {t.avg === undefined ? <span className="text-xs text-fg-subtle">Not held / not published</span> : <span className={cn("text-sm font-bold tabular-nums", scoreTone(t.avg))}>{t.avg.toFixed(1)}%</span>}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <Trophy className="h-4 w-4 text-amber-500" />
            Top students
          </h2>
          {top.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No results yet.</p>
          ) : (
            <ol className="mt-4 space-y-2.5">
              {top.map((r, i) => (
                <li key={r.student.id}>
                  <Link href={studentHref(r.student, "academics")} className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-subtle">
                    <span className="w-5 text-center text-sm font-bold text-fg-subtle">{i + 1}</span>
                    <StudentAvatar name={r.student.name} photo={r.student.photo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{r.student.name}</p>
                      <p className="text-xs text-fg-muted">
                        {r.student.className} {r.student.section}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-fg">{r.result.obtained}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <UserCheck className="h-4 w-4 text-fg-muted" />
            Teachers
          </h2>
          {subject.teachers.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No teacher lists this subject. Add it on a teacher&apos;s profile, or assign anyone from Classes & Teachers.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {subject.teachers.map((t) => (
                <li key={t.id}>
                  <Link href={teacherHref(t, "classes")} className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-subtle">
                    <Avatar name={t.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{t.name}</p>
                      <p className="text-xs text-fg-muted">{t.designation}</p>
                    </div>
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
