"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, Download, EyeOff, FileCheck2, Hourglass, Medal, Percent, Send, TrendingUp, type LucideIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate, formatDateTime } from "@/features/admissions/utils";
import { useResultsStore } from "@/features/results/store/results.store";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useExam, type Candidate } from "../../hooks/use-exam";
import { useExamAdminStore } from "../../store/exam-admin.store";
import { downloadCsv, sortClasses } from "../../utils";

const GRADES = ["A+", "A", "A-", "B", "C", "D", "F"] as const;
const GRADE_COLOR: Record<string, string> = {
  "A+": "bg-emerald-500",
  A: "bg-teal-500",
  "A-": "bg-sky-500",
  B: "bg-indigo-500",
  C: "bg-violet-500",
  D: "bg-amber-500",
  F: "bg-rose-500",
};

type Graded = Candidate & { result: NonNullable<Candidate["result"]> };

const avg = (list: Graded[]) => (list.length ? list.reduce((s, c) => s + c.result.gpa, 0) / list.length : 0);
const passRate = (list: Graded[]) => (list.length ? Math.round((list.filter((c) => c.result.gpa > 0).length / list.length) * 100) : 0);

/**
 * Result summary of the exam — GPA by class, grade spread and merit list.
 * Marks are entered per student (profile → Academics). BACKEND: GET /exams/:id/results/summary · POST /exams/:id/publish
 */
export function ExamResultsView({ slug }: { slug: string }) {
  const { exam, candidates } = useExam(slug);
  const publish = useExamAdminStore((s) => s.publish);
  const setExam = useResultsStore((s) => s.setExam);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  if (!exam || !candidates) return null;

  const graded = candidates.filter((c): c is Graded => Boolean(c.result));

  if (graded.length === 0 && exam.custom) {
    return (
      <Card>
        <EmptyState
          icon={exam.status === "published" ? CheckCircle2 : exam.status === "scheduled" || exam.status === "ongoing" ? Hourglass : FileCheck2}
          title={exam.status === "published" ? "Results published" : exam.status === "cancelled" ? "Exam cancelled" : "Marks entry & results"}
          description={exam.status === "scheduled" ? `The last paper is on ${formatDate(exam.endDate)}. Enter marks in Results after that.` : "Enter marks subject by subject, check the tabulation sheet, publish and print report cards in Results."}
          action={
            exam.status !== "cancelled" && exam.status !== "scheduled" ? (
              <Link href="/results" onClick={() => setExam(exam.id)} className={buttonStyles()}>
                <FileCheck2 className="h-4 w-4" />
                Open in Results
              </Link>
            ) : undefined
          }
        />
      </Card>
    );
  }

  if (graded.length === 0) {
    const waiting = exam.status === "scheduled" || exam.status === "ongoing";
    return (
      <Card>
        <EmptyState
          icon={waiting ? Hourglass : exam.status === "published" ? CheckCircle2 : FileCheck2}
          title={waiting ? "Results come after the exam" : exam.status === "published" ? "Results published" : exam.status === "cancelled" ? "Exam cancelled" : "Waiting for marks"}
          description={
            waiting
              ? `The last paper is on ${formatDate(exam.endDate)}. Teachers enter marks after that.`
              : exam.status === "published"
                ? `Published ${exam.publishedAt ? formatDateTime(exam.publishedAt) : ""}. Students and guardians can see their results.`
                : exam.status === "cancelled"
                  ? "No results for a cancelled exam."
                  : "When teachers have entered every mark, publish the results so students and guardians can see them."
          }
          action={
            exam.status === "completed" ? (
              <Button onClick={() => setConfirm("publish")}>
                <Send className="h-4 w-4" />
                Publish results
              </Button>
            ) : exam.status === "published" && exam.custom ? (
              <Button variant="outline" onClick={() => setConfirm("unpublish")}>
                <EyeOff className="h-4 w-4" />
                Unpublish
              </Button>
            ) : undefined
          }
        />
        <PublishDialogs examId={exam.id} name={exam.name} confirm={confirm} setConfirm={setConfirm} publish={publish} />
      </Card>
    );
  }

  const byClass = sortClasses(exam.classes)
    .map((c) => ({ className: c, list: graded.filter((g) => g.student.className === c) }))
    .filter((c) => c.list.length > 0);
  const spread = GRADES.map((g) => ({ grade: g, n: graded.filter((c) => c.result.grade === g).length }));
  const merit = [...graded].sort((a, b) => b.result.gpa - a.result.gpa || b.result.total / b.result.outOf - a.result.total / a.result.outOf).slice(0, 10);
  const top = merit[0];

  const tiles: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Average GPA", value: avg(graded).toFixed(2), hint: `${graded.length} of ${candidates.length} students`, icon: TrendingUp, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Pass rate", value: `${passRate(graded)}%`, hint: `${graded.filter((c) => c.result.gpa === 0).length} failed`, icon: Percent, accent: "bg-emerald-50 text-emerald-600" },
    { label: "GPA 5.00 (A+)", value: String(spread[0]!.n), hint: `${Math.round((spread[0]!.n / graded.length) * 100)}% of students`, icon: Award, accent: "bg-amber-50 text-amber-600" },
    { label: "Top of the school", value: top ? top.result.gpa.toFixed(2) : "—", hint: top ? `${top.student.name} · ${top.student.className}` : "", icon: Medal, accent: "bg-rose-50 text-rose-600" },
  ];

  function exportCsv() {
    downloadCsv(
      [
        ["Student ID", "Name", "Class", "Section", "Roll", "Total", "Out of", "GPA", "Grade", "Position"],
        ...graded.map((c) => [c.student.id, c.student.name, c.student.className, c.student.section, c.student.roll, c.result.total, c.result.outOf, c.result.gpa, c.result.grade, c.result.position]),
      ],
      `${exam!.slug}-results.csv`,
    );
    toast("Export ready", { description: `${graded.length} results downloaded as CSV.`, tone: "info" });
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            Results
            <Badge tone="success" dot>
              Published
            </Badge>
          </h2>
          <p className="text-xs text-fg-muted">Students and guardians see these on their profiles. Correct marks, see the tabulation sheet and print report cards in Results.</p>
        </div>
        <Link href="/results" onClick={() => setExam(exam.id)} className={buttonStyles({ variant: "outline" })}>
          <FileCheck2 className="h-4 w-4" />
          Open in Results
        </Link>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </Card>

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
            <p className="text-xs text-fg-muted">Average GPA, pass rate and grade spread.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-y border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="px-5 py-2 sm:px-6">Class</th>
                  <th className="px-2 py-2 text-center">Students</th>
                  <th className="px-2 py-2 text-center">Avg GPA</th>
                  <th className="px-2 py-2 text-center">Pass</th>
                  <th className="px-2 py-2 text-center">A+</th>
                  <th className="w-48 px-5 py-2 sm:px-6">Grades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byClass.map(({ className, list }) => {
                  const rate = passRate(list);
                  return (
                    <tr key={className} className="transition hover:bg-subtle/50">
                      <td className="px-5 py-3 font-medium text-fg sm:px-6">{className}</td>
                      <td className="px-2 py-3 text-center tabular-nums text-fg-secondary">{list.length}</td>
                      <td className="px-2 py-3 text-center font-semibold tabular-nums text-fg">{avg(list).toFixed(2)}</td>
                      <td className={cn("px-2 py-3 text-center font-semibold tabular-nums", rate === 100 ? "text-emerald-600" : rate >= 80 ? "text-amber-600" : "text-rose-600")}>{rate}%</td>
                      <td className="px-2 py-3 text-center tabular-nums text-fg-secondary">{list.filter((c) => c.result.grade === "A+").length}</td>
                      <td className="px-5 py-3 sm:px-6">
                        <div className="flex h-2 overflow-hidden rounded-full bg-soft">
                          {GRADES.map((g) => {
                            const n = list.filter((c) => c.result.grade === g).length;
                            return n > 0 && <div key={g} className={GRADE_COLOR[g]} style={{ width: `${(n / list.length) * 100}%` }} title={`${g}: ${n}`} />;
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
            {spread.map(({ grade, n }) => (
              <span key={grade} className="flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
                <span className={cn("h-2 w-2 rounded-full", GRADE_COLOR[grade])} />
                {grade} · {n}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <Medal className="h-4 w-4 text-fg-muted" />
            Merit list
          </h2>
          <p className="text-xs text-fg-muted">Top 10 across all classes.</p>
          <ol className="mt-4 divide-y divide-line">
            {merit.map((c, i) => (
              <li key={c.student.id}>
                <Link href={studentHref(c.student, "academics")} className="flex items-center gap-3 py-2.5 transition hover:bg-subtle/50">
                  <span className={cn("w-5 text-center text-sm font-bold tabular-nums", i < 3 ? "text-amber-500" : "text-fg-subtle")}>{i + 1}</span>
                  <StudentAvatar name={c.student.name} photo={c.student.photo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{c.student.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {c.student.className} {c.student.section} · {c.result.total}/{c.result.outOf}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-fg">{c.result.gpa.toFixed(2)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function PublishDialogs({
  examId,
  name,
  confirm,
  setConfirm,
  publish,
}: {
  examId: string;
  name: string;
  confirm: "publish" | "unpublish" | null;
  setConfirm: (v: null) => void;
  publish: (id: string, on: boolean) => void;
}) {
  return (
    <ConfirmDialog
      open={Boolean(confirm)}
      onClose={() => setConfirm(null)}
      title={confirm === "publish" ? `Publish ${name} results?` : `Unpublish ${name} results?`}
      description={confirm === "publish" ? "Students and guardians will see their marks, GPA and position." : "Results are hidden from students and guardians until you publish again."}
      confirmLabel={confirm === "publish" ? "Publish" : "Unpublish"}
      onConfirm={() => {
        publish(examId, confirm === "publish");
        toast(confirm === "publish" ? "Results published" : "Results unpublished");
        setConfirm(null);
      }}
    />
  );
}
