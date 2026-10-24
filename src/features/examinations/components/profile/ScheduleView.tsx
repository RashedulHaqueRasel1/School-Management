"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, Download, Pencil, Printer, RotateCcw } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/features/admissions/utils";
import { WEEKDAY_NAMES, holidayName, localToday, minutesToTime, weekdayOf } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { isExamDay } from "../../demoData/mock-data";
import { useExam } from "../../hooks/use-exam";
import { useExamAdminStore } from "../../store/exam-admin.store";
import type { Paper } from "../../types/types";
import { clashesOf, downloadCsv, hours, sortClasses, timeRange } from "../../utils";

const TIMES = Array.from({ length: 17 }, (_, i) => 8 * 60 + i * 30);
const DURATIONS = [40, 60, 90, 120, 150, 180];

/**
 * Exam routine: exam days × classes. Click a paper to move it.
 * BACKEND: PUT /exams/:id/papers/:paperId { date, start, duration }
 */
export function ExamScheduleView({ slug }: { slug: string }) {
  const { exam } = useExam(slug);
  const setPapers = useExamAdminStore((s) => s.setPapers);
  const [className, setClassName] = useState("all");
  const [editing, setEditing] = useState<Paper | null>(null);
  const [resetting, setResetting] = useState(false);
  if (!exam) return null;

  const today = localToday();
  const locked = exam.status === "published" || exam.status === "cancelled";
  const classes = sortClasses(exam.classes).filter((c) => className === "all" || c === className);
  const clashes = clashesOf(exam.papers);
  const days = exam.days.filter((d) => exam.papers.some((p) => p.date === d && classes.includes(p.className)));

  function save(updated: Paper) {
    setPapers(
      exam!.id,
      exam!.papers.map((p) => (p.id === updated.id ? updated : p)),
      "Paper rescheduled",
      `${updated.className} ${updated.subject} → ${formatDate(updated.date)}, ${timeRange(updated)}`,
    );
    toast("Paper rescheduled", { description: `${updated.className} · ${updated.subject}` });
    setEditing(null);
  }

  function exportCsv() {
    downloadCsv(
      [["Date", "Day", "Class", "Subject", "Time", "Duration"], ...exam!.papers.map((p) => [p.date, WEEKDAY_NAMES[weekdayOf(p.date)]!, p.className, p.subject, timeRange(p), hours(p.duration)])],
      `${exam!.slug}-routine.csv`,
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center print:hidden">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            Exam routine
            {clashes.size > 0 && (
              <Badge tone="danger">
                <AlertTriangle className="h-3 w-3" /> {clashes.size} clashing
              </Badge>
            )}
          </h2>
          <p className="text-xs text-fg-muted">{locked ? "Results are out — the routine is read-only." : "One paper per class per day. Click a paper to move it to another day or time."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Class" value={className} onChange={(e) => setClassName(e.target.value)} className="w-40">
            <option value="all">All classes</option>
            {sortClasses(exam.classes).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          {exam.editedSchedule && !locked && (
            <Button variant="outline" onClick={() => setResetting(true)}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </Card>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">{exam.name} — Routine</h1>
        <p className="text-sm">Papers start at {minutesToTime(exam.startTime)}</p>
      </div>

      <Card className="overflow-hidden print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="sticky left-0 z-10 min-w-36 bg-subtle px-4 py-3 sm:px-5">Date</th>
                {classes.map((c) => (
                  <th key={c} className="min-w-36 px-3 py-3">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {days.map((d) => (
                <tr key={d} className={cn(d === today && "bg-indigo-50/50 dark:bg-indigo-500/5")}>
                  <td className="sticky left-0 z-10 bg-surface px-4 py-3 sm:px-5">
                    <p className={cn("font-semibold", d === today ? "text-indigo-600" : d < today ? "text-fg-muted" : "text-fg")}>{formatDate(d)}</p>
                    <p className="text-xs text-fg-subtle">
                      {WEEKDAY_NAMES[weekdayOf(d)]}
                      {d === today && " · Today"}
                    </p>
                  </td>
                  {classes.map((c) => {
                    const list = exam.papers.filter((p) => p.date === d && p.className === c);
                    return (
                      <td key={c} className="px-2 py-2 align-top">
                        {list.length === 0 ? (
                          <span className="block px-2 py-2 text-xs text-fg-subtle">—</span>
                        ) : (
                          <div className="space-y-1.5">
                            {list.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                disabled={locked}
                                onClick={() => setEditing(p)}
                                className={cn(
                                  "group w-full rounded-lg border px-2.5 py-2 text-left transition enabled:hover:border-indigo-300 enabled:hover:bg-indigo-50/50",
                                  clashes.has(p.id) ? "border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10" : d < today ? "border-line bg-subtle/50" : "border-line",
                                )}
                              >
                                <span className="flex items-start justify-between gap-1">
                                  <span className="text-[13px] font-semibold leading-snug text-fg">{p.subject}</span>
                                  {!locked && <Pencil className="mt-0.5 h-3 w-3 shrink-0 text-fg-subtle opacity-0 transition group-hover:opacity-100 print:hidden" />}
                                </span>
                                <span className="mt-0.5 block whitespace-nowrap text-[11px] tabular-nums text-fg-muted" title={hours(p.duration)}>
                                  {timeRange(p)}
                                </span>
                              </button>
                            ))}
                          </div>
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

      {editing && <PaperDialog paper={editing} others={exam.papers} onSave={save} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={resetting}
        onClose={() => setResetting(false)}
        title="Reset the routine?"
        description="Every paper goes back to the generated day and time. Your changes are discarded."
        confirmLabel="Reset"
        onConfirm={() => {
          setPapers(exam.id, null, "Routine reset to generated");
          toast("Routine reset");
          setResetting(false);
        }}
      />
    </div>
  );
}

function PaperDialog({ paper, others, onSave, onClose }: { paper: Paper; others: Paper[]; onSave: (p: Paper) => void; onClose: () => void }) {
  const [value, setValue] = useState(paper);
  const offDay = value.date && !isExamDay(value.date) ? (holidayName(value.date) ?? "Weekly holiday") : null;
  const clash = clashesOf([...others.filter((p) => p.id !== paper.id), value]).has(paper.id);
  return (
    <Dialog
      open
      onClose={onClose}
      title={`${paper.className} · ${paper.subject}`}
      description="Move the paper to another day or time."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <CalendarDays className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(value)} disabled={!value.date || clash}>
            Save
          </Button>
        </>
      }
    >
      <FieldGrid>
        <FormField label="Date" required className="sm:col-span-2">
          <Input type="date" value={value.date} onChange={(e) => setValue({ ...value, date: e.target.value })} />
        </FormField>
        <FormField label="Starts at" required>
          <Select value={value.start} onChange={(e) => setValue({ ...value, start: Number(e.target.value) })} className="h-11">
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {minutesToTime(t)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Duration" required>
          <Select value={value.duration} onChange={(e) => setValue({ ...value, duration: Number(e.target.value) })} className="h-11">
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {hours(d)}
              </option>
            ))}
          </Select>
        </FormField>
      </FieldGrid>
      {offDay && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">Heads up: {formatDate(value.date)} is a day off ({offDay}).</p>}
      {clash && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{paper.className} already has a paper at this time.</p>}
    </Dialog>
  );
}
