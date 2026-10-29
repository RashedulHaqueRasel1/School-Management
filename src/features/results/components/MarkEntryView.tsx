"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, PenLine, RotateCcw, Save } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";
import type { ExamSummary } from "@/features/examinations/hooks/use-exams";
import { gradeTone } from "@/features/students/components/profile/grade-utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useResults } from "../hooks/use-results";
import { RELIGION_COLUMN, columnsOf, subjectGrade, type SheetRow } from "../utils";

/**
 * Subject-wise mark entry for one class — the way teachers hand in marks.
 * BACKEND: PUT /exams/:examId/marks { classId, subject, marks: [{ studentId, obtained }] }
 */
export function MarkEntryView() {
  const { exam, classes, className, sheets } = useResults();
  const current = className ?? classes[0];
  const rows = (current && sheets.get(current)) || [];
  const columns = columnsOf(rows);
  const [picked, setPicked] = useState<string | null>(null);
  if (!exam || !current) return null;
  const column = picked && columns.includes(picked) ? picked : (columns.find((c) => rows.some((r) => r.marks[c] === undefined)) ?? columns[0]);

  if (!column) {
    return (
      <Card>
        <EmptyState icon={PenLine} title="No students in this class" description="Pick another class to enter marks." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:px-5">
        <p className="mb-3 text-xs font-semibold text-fg-muted">Subject · {current}</p>
        <div className="flex flex-wrap gap-2">
          {columns.map((c) => {
            const taking = rows.filter((r) => r.subjects.some((s) => s.column === c));
            const done = taking.filter((r) => r.marks[c] !== undefined).length;
            const active = c === column;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setPicked(c)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  active ? "border-indigo-500 bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow" : "border-line text-fg-secondary hover:bg-soft hover:text-fg",
                )}
              >
                {c}
                <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", active ? "bg-white/25" : done === taking.length ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                  {done}/{taking.length}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <EntrySheet key={`${exam.id}|${current}|${column}`} exam={exam} column={column} rows={rows.filter((r) => r.subjects.some((s) => s.column === column))} />
    </div>
  );
}

function EntrySheet({ exam, column, rows }: { exam: ExamSummary; column: string; rows: SheetRow[] }) {
  const setMarks = useStudentAdminStore((s) => s.setMarks);
  const initial = () => Object.fromEntries(rows.map((r) => [r.student.id, r.marks[column] === undefined ? "" : String(r.marks[column])]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const subjectOf = (r: SheetRow) => r.subjects.find((s) => s.column === column)!;
  const fullMarks = subjectOf(rows[0]!).fullMarks;
  const paper = exam.papers.find((p) => p.className === rows[0]!.student.className && (p.subject === column || (column === RELIGION_COLUMN && p.subject.startsWith("Religion"))));
  const notHeld = paper && paper.date > localToday();
  const parse = (v: string) => (v.trim() === "" ? undefined : Number(v));
  const invalid = (r: SheetRow) => {
    const n = parse(values[r.student.id] ?? "");
    return n !== undefined && (!Number.isFinite(n) || n < 0 || n > subjectOf(r).fullMarks || !Number.isInteger(n * 2));
  };
  const changed = rows.filter((r) => parse(values[r.student.id] ?? "") !== r.marks[column] && parse(values[r.student.id] ?? "") !== undefined);
  const bad = rows.filter(invalid);
  const filled = rows.filter((r) => parse(values[r.student.id] ?? "") !== undefined).length;

  async function save() {
    if (!(await confirmAction({ title: "Save marks?", description: `${column} · ${changed.length} student(s) changed. Results and positions are recalculated.`, confirmLabel: "Save marks" }))) return;
    for (const r of changed) setMarks(r.student.id, exam.id, exam.name, { [subjectOf(r).code]: parse(values[r.student.id]!)! });
    toast("Marks saved", { description: `${column} · ${changed.length} student(s)` });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">
            {column} <span className="font-normal text-fg-muted">· out of {fullMarks}</span>
          </h2>
          <p className="text-xs text-fg-muted">
            {filled} of {rows.length} entered{paper && ` · paper on ${formatDate(paper.date)}`}. Press Enter to jump to the next student.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {changed.length > 0 && <Badge tone="warning">{changed.length} unsaved</Badge>}
          <Button variant="outline" onClick={() => setValues(initial())} disabled={changed.length === 0}>
            <RotateCcw className="h-4 w-4" />
            Discard
          </Button>
          <Button onClick={save} disabled={changed.length === 0 || bad.length > 0}>
            <Save className="h-4 w-4" />
            Save marks
          </Button>
        </div>
      </div>

      {(exam.status === "published" || notHeld || bad.length > 0) && (
        <p className={cn("flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm sm:px-5", bad.length ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {bad.length
            ? `${bad.length} mark(s) are not valid — use 0 to ${fullMarks} (halves allowed).`
            : notHeld
              ? `This paper is on ${formatDate(paper!.date)} — marks can be entered after it.`
              : "Results are published — corrections show on the student's profile and report card straight away."}
        </p>
      )}

      <div className="divide-y divide-line">
        {rows.map((r, i) => {
          const subject = subjectOf(r);
          const n = parse(values[r.student.id] ?? "");
          const wrong = invalid(r);
          const g = n !== undefined && !wrong ? subjectGrade(n, subject) : null;
          return (
            <div key={r.student.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <span className="w-8 text-center text-sm font-bold tabular-nums text-fg-subtle">{r.student.roll}</span>
              <Link href={studentHref(r.student, "academics")} className="flex min-w-0 flex-1 items-center gap-3">
                <StudentAvatar name={r.student.name} photo={r.student.photo} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg hover:text-indigo-600">{r.student.name}</p>
                  <p className="truncate text-xs text-fg-muted">
                    Section {r.student.section}
                    {subject.name !== column && ` · ${subject.name}`}
                  </p>
                </div>
              </Link>
              <span className="hidden w-16 justify-end sm:flex">{g && <Badge tone={gradeTone(g.grade)}>{g.grade}</Badge>}</span>
              <input
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="number"
                inputMode="decimal"
                min={0}
                max={subject.fullMarks}
                step={0.5}
                disabled={Boolean(notHeld)}
                value={values[r.student.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [r.student.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    inputs.current[i + 1]?.focus();
                    inputs.current[i + 1]?.select();
                  }
                }}
                aria-label={`${r.student.name} ${column} marks`}
                placeholder="—"
                className={cn(
                  "h-10 w-20 rounded-xl border bg-surface px-3 text-right text-sm font-semibold tabular-nums text-fg shadow-card focus:outline-none focus:ring-4 disabled:opacity-50",
                  wrong ? "border-rose-400 focus:ring-rose-500/10" : g?.gp === 0 ? "border-rose-300 text-rose-600 focus:border-indigo-400 focus:ring-indigo-500/10" : "border-line-strong focus:border-indigo-400 focus:ring-indigo-500/10",
                )}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
