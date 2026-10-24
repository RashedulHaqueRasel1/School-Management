"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, BookOpen, CalendarCheck, Percent, TrendingUp, Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { classOrder } from "@/features/classes/demoData/mock-data";
import { columnOf } from "@/features/results/utils";
import type { ExamResult } from "@/features/students/types/types";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";

import { useReportData } from "../hooks/use-report-data";
import { attendanceRate, pct } from "../utils";
import { Loading, Tiles } from "./ReportsOverviewView";

const gpaCell = (g: number) =>
  g >= 4.5 ? "bg-emerald-500 text-white" : g >= 4 ? "bg-emerald-300 text-emerald-950" : g >= 3.5 ? "bg-lime-200 text-lime-950" : g >= 3 ? "bg-amber-200 text-amber-950" : g > 0 ? "bg-orange-300 text-orange-950" : "bg-rose-400 text-white";

/**
 * Exam results across the session: trend, class × exam, subjects, the link
 * between attendance and results, and the most improved.
 * BACKEND: GET /reports/academic?session=
 */
export function AcademicReportView() {
  const { hydrated, today, learners } = useReportData();
  const [picked, setPicked] = useState<string | null>(null);
  if (!hydrated) return <Loading />;

  const resultOf = (examId: string) => learners.flatMap((l) => {
    const r = l.profile.exams.find((e) => e.id === examId && e.status === "published");
    return r ? [{ ...l, r }] : [];
  });
  const exams = [...new Map(learners.flatMap((l) => l.profile.exams.filter((e) => e.status === "published")).map((e) => [e.id, e] as const)).values()].sort((a, b) => a.heldOn.localeCompare(b.heldOn));
  if (exams.length === 0) return <Card className="py-16 text-center text-sm text-fg-muted">No published exam results yet.</Card>;

  const stats = exams.map((e) => {
    const rows = resultOf(e.id);
    return { exam: e, n: rows.length, gpa: rows.reduce((s, x) => s + x.r.gpa, 0) / Math.max(1, rows.length), pass: pct(rows.filter((x) => x.r.gpa > 0).length, rows.length), aPlus: rows.filter((x) => x.r.grade === "A+").length };
  });
  const latest = stats.at(-1)!;
  const prev = stats.at(-2);
  const exam: ExamResult = exams.find((e) => e.id === picked) ?? latest.exam;
  const rows = resultOf(exam.id);
  const classes = [...new Set(learners.map((l) => l.student.className))].sort((a, b) => classOrder(a) - classOrder(b));

  const subjects = [...new Set(rows.flatMap((x) => x.r.results.map((s) => columnOf(s.subject))))].map((col) => {
    const marks = rows.flatMap((x) => x.r.results.filter((s) => columnOf(s.subject) === col).map((s) => (s.obtained / s.fullMarks) * 100));
    return { col, avg: marks.reduce((s, v) => s + v, 0) / Math.max(1, marks.length), pass: pct(marks.filter((m) => m >= 33).length, marks.length), n: marks.length };
  }).sort((a, b) => b.avg - a.avg);

  const BANDS = [
    ["95%+", 95, 101],
    ["85–95%", 85, 95],
    ["75–85%", 75, 85],
    ["Below 75%", 0, 75],
  ] as const;
  const bands = BANDS.map(([label, lo, hi]) => {
    const inBand = rows.filter((x) => {
      const r = attendanceRate(x.profile.attendance.filter((d) => d.date <= exam.heldOn), today).rate;
      return r >= lo && r < hi;
    });
    return { label, n: inBand.length, gpa: inBand.reduce((s, x) => s + x.r.gpa, 0) / Math.max(1, inBand.length) };
  });

  const improved = prev
    ? learners
        .flatMap((l) => {
          const a = l.profile.exams.find((e) => e.id === prev.exam.id && e.status === "published");
          const b = l.profile.exams.find((e) => e.id === latest.exam.id && e.status === "published");
          return a && b ? [{ ...l, from: a.gpa, to: b.gpa, delta: b.gpa - a.gpa }] : [];
        })
        .filter((x) => x.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <Tiles
        tiles={[
          { label: `${latest.exam.name} GPA`, value: latest.gpa.toFixed(2), hint: prev ? `${latest.gpa >= prev.gpa ? "▲" : "▼"} ${Math.abs(latest.gpa - prev.gpa).toFixed(2)} vs ${prev.exam.name}` : `${latest.n} students`, icon: TrendingUp, accent: "bg-indigo-50 text-indigo-600" },
          { label: "Pass rate", value: `${latest.pass}%`, hint: prev ? `${prev.pass}% in ${prev.exam.name}` : "Latest exam", icon: Percent, accent: "bg-emerald-50 text-emerald-600" },
          { label: "GPA 5.00 (A+)", value: String(latest.aPlus), hint: `${pct(latest.aPlus, latest.n)}% of students`, icon: Award, accent: "bg-amber-50 text-amber-600" },
          { label: "Exams this session", value: String(exams.length), hint: exams.map((e) => e.name.replace(" Exam", "")).join(" · "), icon: BookOpen, accent: "bg-rose-50 text-rose-600" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5 print:grid-cols-5">
        <Card className="p-5 sm:p-6 xl:col-span-2 print:col-span-2 print:shadow-none">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Exam by exam</h2>
          <p className="text-xs text-fg-muted">Average GPA and pass rate.</p>
          <div className="mt-5 flex h-48 items-end gap-4">
            {stats.map((s) => (
              <div key={s.exam.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-sm font-bold tabular-nums text-fg">{s.gpa.toFixed(2)}</span>
                <div className="flex w-full max-w-14 flex-1 items-end rounded-lg bg-soft">
                  <div className="w-full rounded-lg bg-linear-to-t from-indigo-600 to-violet-500 print:[print-color-adjust:exact]" style={{ height: `${(s.gpa / 5) * 100}%` }} />
                </div>
                <span className="text-center text-[11px] font-medium leading-tight text-fg-muted">{s.exam.name.replace(" Exam", "")}</span>
                <span className="text-[10px] tabular-nums text-emerald-600">{s.pass}% pass</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden xl:col-span-3 print:col-span-3 print:shadow-none">
          <div className="p-5 pb-3 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Class × exam</h2>
            <p className="text-xs text-fg-muted">Average GPA — darker green is better.</p>
          </div>
          <div className="overflow-x-auto px-5 pb-5 sm:px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="py-1.5 pr-3">Class</th>
                  {exams.map((e) => (
                    <th key={e.id} className="px-1 py-1.5 text-center">
                      {e.name.replace(" Exam", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c}>
                    <td className="py-1 pr-3 font-medium text-fg">{c}</td>
                    {exams.map((e) => {
                      const list = resultOf(e.id).filter((x) => x.student.className === c);
                      const g = list.reduce((s, x) => s + x.r.gpa, 0) / Math.max(1, list.length);
                      return (
                        <td key={e.id} className="p-0.5">
                          {list.length ? (
                            <span className={cn("block rounded-md py-1.5 text-center text-xs font-bold tabular-nums print:[print-color-adjust:exact]", gpaCell(g))} title={`${c} · ${e.name}: ${g.toFixed(2)} (${list.length} students)`}>
                              {g.toFixed(2)}
                            </span>
                          ) : (
                            <span className="block py-1.5 text-center text-xs text-fg-subtle">—</span>
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
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 print:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2 print:col-span-2 print:shadow-none">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Subjects</h2>
              <p className="text-xs text-fg-muted">Average score and pass rate, best first.</p>
            </div>
            <Select aria-label="Exam" value={exam.id} onChange={(e) => setPicked(e.target.value)} className="w-48 print:hidden">
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
            {subjects.map((s) => (
              <li key={s.col}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-fg">{s.col}</span>
                  <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                    <b className="text-fg">{Math.round(s.avg)}%</b> · pass {s.pass}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                  <div className={cn("h-full rounded-full print:[print-color-adjust:exact]", s.avg >= 70 ? "bg-emerald-500" : s.avg >= 55 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${s.avg}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6 print:shadow-none">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <CalendarCheck className="h-4 w-4 text-fg-muted" />
            Attendance vs results
          </h2>
          <p className="text-xs text-fg-muted">Average GPA in {exam.name} by attendance up to the exam.</p>
          <ul className="mt-4 space-y-3">
            {bands.map((b) => (
              <li key={b.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-fg-secondary">
                    {b.label} <span className="text-xs text-fg-subtle">· {b.n} students</span>
                  </span>
                  <span className="font-bold tabular-nums text-fg">{b.n ? b.gpa.toFixed(2) : "—"}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-soft">
                  <div className="h-full rounded-full bg-indigo-500 print:[print-color-adjust:exact]" style={{ width: `${(b.gpa / 5) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {prev && (
        <Card className="p-5 sm:p-6 print:shadow-none">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <Trophy className="h-4 w-4 text-fg-muted" />
            Most improved
          </h2>
          <p className="text-xs text-fg-muted">
            GPA change from {prev.exam.name} to {latest.exam.name}.
          </p>
          {improved.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted">No improvements to show.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5 print:grid-cols-5">
              {improved.map((x) => (
                <li key={x.student.id}>
                  <Link href={studentHref(x.student, "academics")} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:bg-subtle">
                    <StudentAvatar name={x.student.name} photo={x.student.photo} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">{x.student.name}</span>
                      <span className="block text-xs tabular-nums text-fg-muted">
                        {x.from.toFixed(2)} → <b className="text-emerald-600">{x.to.toFixed(2)}</b>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
