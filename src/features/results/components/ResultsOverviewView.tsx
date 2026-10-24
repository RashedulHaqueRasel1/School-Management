"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Award, BookOpen, Download, EyeOff, Medal, PenLine, Percent, Send, TrendingUp, type LucideIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { useExamAdminStore } from "@/features/examinations/store/exam-admin.store";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useResults } from "../hooks/use-results";
import { columnsOf, downloadCsv, subjectGrade, summarize } from "../utils";

const GRADES = ["A+", "A", "A-", "B", "C", "D", "F"] as const;
export const GRADE_COLOR: Record<string, string> = {
  "A+": "bg-emerald-500",
  A: "bg-teal-500",
  "A-": "bg-sky-500",
  B: "bg-indigo-500",
  C: "bg-violet-500",
  D: "bg-amber-500",
  F: "bg-rose-500",
};

/**
 * Results summary for the selected exam (all classes or one).
 * BACKEND: GET /results/summary?examId=&classId= · POST /exams/:id/publish
 */
export function ResultsOverviewView() {
  const { exam, classes, className, sheets, setClass } = useResults();
  const publish = useExamAdminStore((s) => s.publish);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  if (!exam) return null;

  const scope = className ? [className] : classes;
  const rows = scope.flatMap((c) => sheets.get(c) ?? []);
  const all = summarize(classes.flatMap((c) => sheets.get(c) ?? []));
  const s = summarize(rows);
  const done = rows.filter((r) => r.complete);

  const subjectStats = columnsOf(rows).map((col) => {
    const values = rows.flatMap((r) => {
      const subject = r.subjects.find((x) => x.column === col);
      const v = r.marks[col];
      return subject && v !== undefined ? [{ pct: (v / subject.fullMarks) * 100, pass: subjectGrade(v, subject).gp > 0, v }] : [];
    });
    return {
      col,
      n: values.length,
      avg: values.length ? values.reduce((a, b) => a + b.pct, 0) / values.length : 0,
      pass: values.length ? Math.round((values.filter((v) => v.pass).length / values.length) * 100) : 0,
      highest: values.length ? Math.max(...values.map((v) => v.v)) : 0,
    };
  });
  const merit = done.filter((r) => r.failed.length === 0).sort((a, b) => b.gpa - a.gpa || b.total / b.outOf - a.total / a.outOf).slice(0, 8);
  const failing = done.filter((r) => r.failed.length > 0).sort((a, b) => b.failed.length - a.failed.length);

  const tiles: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Average GPA", value: done.length ? s.avgGpa.toFixed(2) : "—", hint: `${s.complete} of ${s.students} results complete`, icon: TrendingUp, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Pass rate", value: done.length ? `${s.passRate}%` : "—", hint: `${s.failed} failed in a subject`, icon: Percent, accent: "bg-emerald-50 text-emerald-600" },
    { label: "GPA 5.00 (A+)", value: String(s.aPlus), hint: done.length ? `${Math.round((s.aPlus / done.length) * 100)}% of students` : "—", icon: Award, accent: "bg-amber-50 text-amber-600" },
    { label: "Marks entered", value: `${s.progress}%`, hint: `${s.entered} of ${s.papers} papers`, icon: PenLine, accent: s.progress === 100 ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-600" },
  ];

  function exportCsv() {
    const cols = columnsOf(rows);
    downloadCsv(
      [
        ["Student ID", "Name", "Class", "Section", "Roll", ...cols, "Total", "Out of", "GPA", "Grade", "Position"],
        ...rows.map((r) => [r.student.id, r.student.name, r.student.className, r.student.section, r.student.roll, ...cols.map((c) => r.marks[c] ?? ""), r.total, r.outOf, r.complete ? r.gpa : "", r.grade, r.position ?? ""]),
      ],
      `${exam!.slug}-${className ? className.toLowerCase().replace(/\s+/g, "-") : "all"}-results.csv`,
    );
    toast("Export ready", { description: `${rows.length} results downloaded as CSV.`, tone: "info" });
  }

  return (
    <div className="space-y-6">
      <PublishBanner
        status={exam.status}
        custom={exam.custom}
        progress={all.progress}
        missing={all.papers - all.entered}
        onPublish={() => setConfirm("publish")}
        onUnpublish={() => setConfirm("unpublish")}
        onExport={exportCsv}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, hint, icon: Icon, accent }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums text-fg">{value}</p>
              <p className="truncate text-xs text-fg-subtle">{hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="p-5 pb-3 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">By class</h2>
            <p className="text-xs text-fg-muted">Click a class to see its tabulation sheet.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="px-5 py-2 sm:px-6">Class</th>
                  <th className="px-2 py-2 text-center">Marks</th>
                  <th className="px-2 py-2 text-center">Avg GPA</th>
                  <th className="px-2 py-2 text-center">Pass</th>
                  <th className="px-2 py-2 text-center">A+</th>
                  <th className="w-44 px-5 py-2 sm:px-6">Grades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {scope.map((c) => {
                  const list = sheets.get(c) ?? [];
                  const cs = summarize(list);
                  const complete = list.filter((r) => r.complete);
                  return (
                    <tr key={c} className="transition hover:bg-subtle/50">
                      <td className="px-5 py-3 sm:px-6">
                        <Link href="/results/tabulation" onClick={() => setClass(c)} className="font-medium text-fg hover:text-indigo-600">
                          {c}
                        </Link>
                        <p className="text-xs text-fg-muted">{cs.students} students</p>
                      </td>
                      <td className="px-2 py-3 text-center">
                        {cs.progress === 100 ? (
                          <Badge tone="success">Done</Badge>
                        ) : (
                          <Link href="/results/marks" onClick={() => setClass(c)}>
                            <Badge tone="warning">{cs.progress}%</Badge>
                          </Link>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center font-semibold tabular-nums text-fg">{complete.length ? cs.avgGpa.toFixed(2) : "—"}</td>
                      <td className={cn("px-2 py-3 text-center font-semibold tabular-nums", !complete.length ? "text-fg-subtle" : cs.passRate === 100 ? "text-emerald-600" : cs.passRate >= 80 ? "text-amber-600" : "text-rose-600")}>
                        {complete.length ? `${cs.passRate}%` : "—"}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-fg-secondary">{cs.aPlus}</td>
                      <td className="px-5 py-3 sm:px-6">
                        <div className="flex h-2 overflow-hidden rounded-full bg-soft">
                          {GRADES.map((g) => {
                            const n = complete.filter((r) => r.grade === g).length;
                            return n > 0 && <div key={g} className={GRADE_COLOR[g]} style={{ width: `${(n / complete.length) * 100}%` }} title={`${g}: ${n}`} />;
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line px-5 py-3 sm:px-6">
            {GRADES.map((g) => (
              <span key={g} className="flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
                <span className={cn("h-2 w-2 rounded-full", GRADE_COLOR[g])} />
                {g} · {done.filter((r) => r.grade === g).length}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <Medal className="h-4 w-4 text-fg-muted" />
            Merit list
          </h2>
          <p className="text-xs text-fg-muted">{className ?? "All classes"} · top {merit.length}</p>
          {merit.length === 0 ? (
            <p className="mt-4 rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">No complete results yet.</p>
          ) : (
            <ol className="mt-4 divide-y divide-line">
              {merit.map((r, i) => (
                <li key={r.student.id}>
                  <Link href={studentHref(r.student, "academics")} className="flex items-center gap-3 py-2.5 transition hover:bg-subtle/50">
                    <span className={cn("w-5 text-center text-sm font-bold tabular-nums", i < 3 ? "text-amber-500" : "text-fg-subtle")}>{i + 1}</span>
                    <StudentAvatar name={r.student.name} photo={r.student.photo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{r.student.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {r.student.className} {r.student.section} · {r.total}/{r.outOf}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-fg">{r.gpa.toFixed(2)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <BookOpen className="h-4 w-4 text-fg-muted" />
            Subject performance
          </h2>
          <p className="text-xs text-fg-muted">Average score and pass rate per subject.</p>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
            {subjectStats.map((x) => (
              <li key={x.col}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-fg">{x.col}</span>
                  <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                    {x.n ? (
                      <>
                        avg <b className="text-fg">{Math.round(x.avg)}%</b> · pass <b className={x.pass === 100 ? "text-emerald-600" : "text-amber-600"}>{x.pass}%</b> · top {x.highest}
                      </>
                    ) : (
                      "No marks yet"
                    )}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                  <div className={cn("h-full rounded-full", x.avg >= 70 ? "bg-emerald-500" : x.avg >= 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${x.avg}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <AlertTriangle className="h-4 w-4 text-fg-muted" />
                Needs attention
              </h2>
              <p className="text-xs text-fg-muted">Failed one or more subjects.</p>
            </div>
            <Badge tone={failing.length ? "danger" : "success"}>{failing.length}</Badge>
          </div>
          {failing.length === 0 ? (
            <p className="mt-4 rounded-xl bg-emerald-50 py-8 text-center text-sm text-emerald-700">{done.length ? "Everyone passed 🎉" : "No complete results yet."}</p>
          ) : (
            <ul className="mt-4 max-h-80 divide-y divide-line overflow-y-auto">
              {failing.map((r) => (
                <li key={r.student.id}>
                  <Link href={studentHref(r.student, "academics")} className="flex items-center gap-3 py-2.5 transition hover:bg-subtle/50">
                    <StudentAvatar name={r.student.name} photo={r.student.photo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{r.student.name}</p>
                      <p className="truncate text-xs text-rose-600">{r.failed.join(", ")}</p>
                    </div>
                    <span className="text-xs text-fg-muted">{r.student.className.replace("Class ", "C")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm === "publish" ? `Publish ${exam.name} results?` : `Unpublish ${exam.name} results?`}
        description={confirm === "publish" ? "Students and guardians can see their marks, GPA and position, and report cards can be printed." : "Results are hidden from students and guardians until you publish again."}
        confirmLabel={confirm === "publish" ? "Publish" : "Unpublish"}
        onConfirm={() => {
          publish(exam.id, confirm === "publish");
          toast(confirm === "publish" ? "Results published" : "Results unpublished");
          setConfirm(null);
        }}
      />
    </div>
  );
}

function PublishBanner({
  status,
  custom,
  progress,
  missing,
  onPublish,
  onUnpublish,
  onExport,
}: {
  status: string;
  custom: boolean;
  progress: number;
  missing: number;
  onPublish: () => void;
  onUnpublish: () => void;
  onExport: () => void;
}) {
  const published = status === "published";
  const text = published
    ? "Published — students and guardians can see their results. Corrections from Mark entry are shown immediately."
    : status === "ongoing"
      ? "The exam is still running. Enter marks as papers finish; publish after the last one."
      : progress === 100
        ? "Every mark is in. Check the tabulation sheet, then publish."
        : `${missing} paper mark(s) still missing. Publish once every mark is entered.`;
  return (
    <Card className={cn("flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center", !published && "border-amber-200 dark:border-amber-500/30")}>
      <div className="flex flex-1 items-center gap-4">
        <div className="relative h-12 w-12 shrink-0">
          <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" className="stroke-soft" />
            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(progress / 100) * 97.4} 97.4`} className={published ? "stroke-emerald-500" : "stroke-amber-500"} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-fg">{progress}%</span>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">{published ? "Results published" : "Marks entry"}</h2>
          <p className="text-xs text-fg-muted">{text}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
        {!published && progress < 100 && (
          <Link href="/results/marks" className={buttonStyles({ variant: "outline" })}>
            <PenLine className="h-4 w-4" />
            Enter marks
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {status === "completed" && (
          <Button onClick={onPublish} disabled={progress < 100}>
            <Send className="h-4 w-4" />
            Publish results
          </Button>
        )}
        {published && custom && (
          <Button variant="outline" onClick={onUnpublish}>
            <EyeOff className="h-4 w-4" />
            Unpublish
          </Button>
        )}
      </div>
    </Card>
  );
}
