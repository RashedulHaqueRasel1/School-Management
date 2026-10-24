"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Circle, Clock, History, IdCard, ListChecks, NotebookPen, Users, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/features/admissions/utils";
import { WEEKDAY_NAMES, localToday, weekdayOf } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { useExam } from "../../hooks/use-exam";
import { clashesOf, examHref, timeRange, type ExamTab } from "../../utils";

export function ExamOverviewView({ slug }: { slug: string }) {
  const { exam, candidates, plan, audit } = useExam(slug);
  if (!exam || !candidates || !plan || !audit) return null;

  const today = localToday();
  const done = exam.days.filter((d) => d < today).length;
  const focusDay = exam.days.find((d) => d >= today);
  const focusPapers = exam.papers.filter((p) => p.date === focusDay);
  const withheld = candidates.filter((c) => !c.eligible).length;
  const clashes = clashesOf(exam.papers).size;
  const marked = candidates.filter((c) => c.result).length;

  const tiles: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Exam days", value: `${done} / ${exam.days.length}`, hint: exam.status === "scheduled" ? `Starts ${formatDate(exam.days[0] ?? exam.startDate)}` : `${exam.days.length - done} remaining`, icon: CalendarDays, accent: "bg-rose-50 text-rose-600" },
    { label: "Papers", value: String(exam.papers.length), hint: clashes ? `${clashes} paper(s) clash` : "No clashes", icon: NotebookPen, accent: clashes ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600" },
    { label: "Candidates", value: String(candidates.length), hint: `${exam.classes.length} classes · ${exam.rooms.length} rooms`, icon: Users, accent: "bg-sky-50 text-sky-600" },
    { label: "Admit cards withheld", value: String(withheld), hint: "2+ months tuition unpaid", icon: IdCard, accent: withheld ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600" },
  ];

  const steps: { label: string; hint: string; done: boolean; warn?: boolean; tab: ExamTab }[] = [
    { label: "Routine ready", hint: clashes ? `${clashes} paper(s) clash — fix the times` : `${exam.papers.length} papers over ${exam.days.length} days`, done: exam.papers.length > 0 && !clashes, warn: clashes > 0, tab: "schedule" },
    { label: "Seat plan", hint: plan.unseated.length ? `${plan.unseated.length} student(s) without a seat — add rooms` : `${plan.seats.length} seats in ${new Set(plan.seats.map((s) => s.room.id)).size} rooms`, done: !plan.unseated.length, warn: plan.unseated.length > 0, tab: "seating" },
    { label: "Admit cards", hint: withheld ? `${withheld} withheld — 2+ months tuition unpaid` : "Every candidate can print", done: withheld === 0, warn: withheld > 0, tab: "admit-cards" },
    { label: "Results", hint: exam.status === "published" ? `Published${marked ? ` · ${marked} students` : ""}` : exam.status === "completed" ? "Enter marks, then publish" : "After the last paper", done: exam.status === "published", tab: "results" },
  ];

  return (
    <div className="space-y-6">
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
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">{focusDay === today ? "Today's papers" : focusDay ? "Next exam day" : "Exam finished"}</h2>
              <p className="text-xs text-fg-muted">{focusDay ? `${WEEKDAY_NAMES[weekdayOf(focusDay)]}, ${formatDate(focusDay)} · ${focusPapers.length} papers` : `Last paper on ${formatDate(exam.endDate)}`}</p>
            </div>
            <Link href={examHref(exam, "schedule")} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Full routine <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {focusPapers.length === 0 ? (
            <p className="rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">{exam.status === "cancelled" ? "This exam was cancelled." : "No more papers — results are next."}</p>
          ) : (
            <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {focusPapers.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
                  <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 px-1.5 text-xs font-bold text-rose-700">{p.className.replace("Class ", "C")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{p.subject}</p>
                    <p className="truncate text-xs text-fg-muted">{p.className}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] tabular-nums text-fg-subtle">
                    <Clock className="h-3 w-3" />
                    {timeRange(p)}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold text-fg-muted">Exam days</p>
            <div className="flex flex-wrap gap-2">
              {exam.days.map((d, i) => {
                const state = d < today ? "done" : d === today ? "today" : "next";
                return (
                  <span
                    key={d}
                    title={`${formatDate(d)} · ${exam.papers.filter((p) => p.date === d).length} papers`}
                    className={cn(
                      "flex w-14 flex-col items-center rounded-xl border py-1.5",
                      state === "done" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30",
                      state === "today" && "border-indigo-500 bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow",
                      state === "next" && "border-line text-fg-secondary",
                    )}
                  >
                    <span className="text-[9px] font-semibold uppercase opacity-80">Day {i + 1}</span>
                    <span className="text-sm font-bold leading-tight">{Number(d.slice(8))}</span>
                    <span className="text-[9px] font-medium opacity-80">{WEEKDAY_NAMES[weekdayOf(d)]!.slice(0, 3)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <ListChecks className="h-4 w-4 text-fg-muted" />
              Exam checklist
            </h2>
            <ul className="mt-4 space-y-1">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={examHref(exam, s.tab)} className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-subtle">
                    {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : s.warn ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{s.label}</p>
                      <p className="text-xs text-fg-muted">{s.hint}</p>
                    </div>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <History className="h-4 w-4 text-fg-muted" />
              Recent changes
            </h2>
            {audit.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">No changes yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {audit.slice(0, 5).map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium text-fg">{a.action}</p>
                    {a.detail && <p className="truncate text-xs text-fg-secondary">{a.detail}</p>}
                    <p className="text-[11px] text-fg-subtle">{formatDateTime(a.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
