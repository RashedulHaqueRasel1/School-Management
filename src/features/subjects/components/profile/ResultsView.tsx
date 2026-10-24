"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { gradeTone } from "@/features/students/components/profile/grade-utils";
import { EXAMS } from "@/features/students/demoData/profile-data";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";

import { useSubject } from "../../hooks/use-subject";
import { scoreTone } from "../../utils";
import { examResults } from "./OverviewView";

/** Exam-wise class analysis + every student's mark. BACKEND: GET /subjects/:id/results?examId= */
export function SubjectResultsView({ slug }: { slug: string }) {
  const { subject } = useSubject(slug);
  const [examId, setExamId] = useState<string | null>(null);
  const [className, setClassName] = useState("all");
  if (!subject) return null;

  const published = EXAMS.filter((e) => examResults(subject.learners, subject.name, e.id).length > 0);
  const exam = published.find((e) => e.id === examId) ?? published.at(-1);
  if (!exam) return <Card className="py-12 text-center text-sm text-fg-muted">No published exam results for {subject.name} yet.</Card>;

  const rows = examResults(subject.learners, subject.name, exam.id);
  const passPct = (subject.passMarks / subject.fullMarks) * 100;
  const classes = subject.classes.filter((c) => rows.some((r) => r.student.className === c));
  const summary = classes.map((c) => {
    const list = rows.filter((r) => r.student.className === c);
    const marks = list.map((r) => r.result.obtained);
    return {
      className: c,
      count: list.length,
      avg: list.reduce((s, r) => s + r.pct, 0) / list.length,
      high: Math.max(...marks),
      low: Math.min(...marks),
      pass: (list.filter((r) => r.pct >= passPct).length / list.length) * 100,
      aplus: list.filter((r) => r.result.grade === "A+").length,
    };
  });
  const shown = rows.filter((r) => className === "all" || r.student.className === className).sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Results analysis</h2>
          <p className="text-xs text-fg-muted">
            {rows.length} student(s) · pass mark {subject.passMarks}/{subject.fullMarks}
          </p>
        </div>
        <Select aria-label="Exam" value={exam.id} onChange={(e) => setExamId(e.target.value)} className="sm:w-56">
          {published.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="py-3 pl-5 pr-3">Class</th>
                <th className="px-3 py-3">Students</th>
                <th className="px-3 py-3">Average</th>
                <th className="px-3 py-3">Highest</th>
                <th className="px-3 py-3">Lowest</th>
                <th className="px-3 py-3">Pass rate</th>
                <th className="py-3 pl-3 pr-5">A+</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summary.map((c) => (
                <tr key={c.className}>
                  <td className="py-3 pl-5 pr-3 font-medium text-fg">{c.className}</td>
                  <td className="px-3 py-3 tabular-nums text-fg-secondary">{c.count}</td>
                  <td className={cn("px-3 py-3 font-semibold tabular-nums", scoreTone(c.avg))}>{c.avg.toFixed(1)}%</td>
                  <td className="px-3 py-3 tabular-nums text-fg-secondary">{c.high}</td>
                  <td className="px-3 py-3 tabular-nums text-fg-secondary">{c.low}</td>
                  <td className="px-3 py-3">
                    <Badge tone={c.pass === 100 ? "success" : c.pass >= 80 ? "warning" : "danger"}>{Math.round(c.pass)}%</Badge>
                  </td>
                  <td className="py-3 pl-3 pr-5 tabular-nums text-fg-secondary">{c.aplus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Student marks · {exam.name}</h2>
          <Select aria-label="Class" value={className} onChange={(e) => setClassName(e.target.value)} className="w-40">
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="w-14 py-3 pl-5 pr-3">#</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Class</th>
                <th className="px-3 py-3">Marks</th>
                <th className="px-3 py-3">Class highest</th>
                <th className="py-3 pl-3 pr-5">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((r, i) => (
                <tr key={r.student.id} className={cn(r.pct < passPct && "bg-rose-50/40")}>
                  <td className="py-3 pl-5 pr-3 font-semibold tabular-nums text-fg-subtle">{i + 1}</td>
                  <td className="px-3 py-3">
                    <Link href={studentHref(r.student, "academics")} className="flex items-center gap-3">
                      <StudentAvatar name={r.student.name} photo={r.student.photo} />
                      <span className="font-medium text-fg hover:text-indigo-600">{r.student.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-fg-secondary">
                    {r.student.className} {r.student.section}
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums text-fg">
                    {r.result.obtained}
                    <span className="font-normal text-fg-subtle">/{r.result.fullMarks}</span>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-fg-muted">{r.result.highest}</td>
                  <td className="py-3 pl-3 pr-5">
                    <Badge tone={gradeTone(r.result.grade)}>{r.result.grade}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
