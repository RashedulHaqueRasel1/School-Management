"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileText, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTone } from "@/features/students/components/profile/grade-utils";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";

import { useResults } from "../hooks/use-results";
import { columnsOf, downloadCsv, subjectGrade, summarize } from "../utils";

export const reportCardHref = (examSlug: string, q: { className?: string; section?: string; studentId?: string }) => {
  const params = new URLSearchParams();
  if (q.className) params.set("class", q.className);
  if (q.section) params.set("section", q.section);
  if (q.studentId) params.set("student", q.studentId);
  return `/report-cards/${examSlug}?${params.toString()}`;
};

/**
 * Tabulation sheet: every student × subject with total, GPA, grade and position.
 * BACKEND: GET /results/tabulation?examId=&classId=&section= (CSV / PDF)
 */
export function TabulationView() {
  const { exam, classes, className, sheets } = useResults();
  const [section, setSection] = useState("all");
  const current = className ?? classes[0];
  if (!exam || !current) return null;

  const all = sheets.get(current) ?? [];
  const sections = [...new Set(all.map((r) => r.student.section))].sort();
  const rows = all.filter((r) => section === "all" || r.student.section === section);
  const cols = columnsOf(rows);
  const s = summarize(rows);
  const canPrint = exam.status === "published" && rows.some((r) => r.complete);

  function exportCsv() {
    downloadCsv(
      [
        ["Roll", "Section", "Student ID", "Name", ...cols, "Total", "Out of", "GPA", "Grade", "Position"],
        ...rows.map((r) => [r.student.roll, r.student.section, r.student.id, r.student.name, ...cols.map((c) => r.marks[c] ?? ""), r.total, r.outOf, r.complete ? r.gpa.toFixed(2) : "", r.grade, r.position ?? ""]),
      ],
      `${exam!.slug}-${current!.toLowerCase().replace(/\s+/g, "-")}-tabulation.csv`,
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center print:hidden">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">
            {current} · {exam.name}
          </h2>
          <p className="text-xs text-fg-muted">
            {s.complete}/{s.students} complete · avg GPA {s.complete ? s.avgGpa.toFixed(2) : "—"} · pass {s.complete ? `${s.passRate}%` : "—"}. Red = below pass marks, amber = not entered.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sections.length > 1 && (
            <div className="flex rounded-xl bg-soft p-1">
              {["all", ...sections].map((x) => (
                <button key={x} type="button" onClick={() => setSection(x)} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition", section === x ? "bg-surface text-fg shadow-card" : "text-fg-muted hover:text-fg")}>
                  {x === "all" ? "All sections" : `Section ${x}`}
                </button>
              ))}
            </div>
          )}
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <a
            href={reportCardHref(exam.slug, { className: current, section: section === "all" ? undefined : section })}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonStyles(), !canPrint && "pointer-events-none opacity-50")}
            title={canPrint ? undefined : "Publish the results first"}
          >
            <FileText className="h-4 w-4" />
            Report cards
          </a>
        </div>
      </Card>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">
          Tabulation sheet — {exam.name} · {current}
          {section !== "all" && ` · Section ${section}`}
        </h1>
      </div>

      <Card className="overflow-hidden print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="sticky left-0 z-10 min-w-52 bg-subtle px-4 py-3 sm:px-5">Student</th>
                {cols.map((c) => (
                  <th key={c} className="min-w-20 px-2 py-3 text-center" title={c}>
                    <span className="line-clamp-2 normal-case">{c}</span>
                  </th>
                ))}
                <th className="px-2 py-3 text-center">Total</th>
                <th className="px-2 py-3 text-center">GPA</th>
                <th className="px-2 py-3 text-center">Grade</th>
                <th className="px-2 py-3 text-center">Pos.</th>
                <th className="px-3 py-3 print:hidden" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.student.id} className="transition hover:bg-subtle/40">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 sm:px-5">
                    <Link href={studentHref(r.student, "academics")} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-fg-subtle">{r.student.roll}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-fg hover:text-indigo-600">{r.student.name}</span>
                        <span className="block text-[11px] text-fg-muted">Section {r.student.section}</span>
                      </span>
                    </Link>
                  </td>
                  {cols.map((c) => {
                    const subject = r.subjects.find((x) => x.column === c);
                    const v = r.marks[c];
                    const fail = subject && v !== undefined && subjectGrade(v, subject).gp === 0;
                    return (
                      <td key={c} className={cn("px-2 py-2.5 text-center tabular-nums", !subject ? "text-fg-subtle" : v === undefined ? "bg-amber-50/70 text-amber-600 dark:bg-amber-500/10" : fail ? "bg-rose-50/70 font-semibold text-rose-600 dark:bg-rose-500/10" : "text-fg-secondary")}>
                        {!subject ? "·" : v === undefined ? "—" : v}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2.5 text-center font-semibold tabular-nums text-fg">{r.total}</td>
                  <td className="px-2 py-2.5 text-center font-bold tabular-nums text-fg">{r.complete ? r.gpa.toFixed(2) : "—"}</td>
                  <td className="px-2 py-2.5 text-center">{r.complete ? <Badge tone={gradeTone(r.grade)}>{r.grade}</Badge> : <span className="text-xs text-fg-subtle">—</span>}</td>
                  <td className="px-2 py-2.5 text-center font-semibold tabular-nums text-fg-secondary">{r.position ?? "—"}</td>
                  <td className="px-3 py-2.5 print:hidden">
                    {canPrint && r.complete && (
                      <a href={reportCardHref(exam.slug, { studentId: r.student.id })} target="_blank" rel="noreferrer" aria-label={`Report card of ${r.student.name}`} title="Report card" className="inline-flex rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600">
                        <FileText className="h-4 w-4" />
                      </a>
                    )}
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
