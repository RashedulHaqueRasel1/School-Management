"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, ClipboardList, Download, FileCheck2, NotebookPen, Plus, Search, Users, X, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/features/admissions/utils";
import { WEEKDAY_NAMES, localToday, weekdayOf } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useExams, type ExamSummary } from "../hooks/use-exams";
import type { ExamFilters, ExamStatus } from "../types/types";
import { STATUS_STYLE, downloadCsv, examHref, sortClasses, timeRange } from "../utils";
import { NewExamDialog } from "./NewExamDialog";

const TYPE_ACCENT: Record<string, string> = {
  Term: "from-indigo-500 to-violet-500",
  "Half Yearly": "from-sky-500 to-cyan-500",
  Annual: "from-rose-500 to-orange-500",
  "Class test": "from-emerald-500 to-teal-500",
  "Model test": "from-amber-400 to-orange-500",
};

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function ExamsView() {
  const { exams, hydrated } = useExams();
  const [filters, setFilters] = useState<ExamFilters>({ search: "", status: "all", className: "all" });
  const [adding, setAdding] = useState(false);
  const today = hydrated ? localToday() : "";

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return exams.filter((e) => {
      if (filters.status !== "all" && e.status !== filters.status) return false;
      if (filters.className !== "all" && !e.classes.includes(filters.className)) return false;
      return !q || [e.name, e.type].some((v) => v.toLowerCase().includes(q));
    });
  }, [exams, filters]);

  const set = (patch: Partial<ExamFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const live = exams.filter((e) => e.status !== "cancelled");
  const next = live.find((e) => e.status === "ongoing") ?? live.find((e) => e.status === "scheduled");
  const upcomingPapers = live.flatMap((e) => (e.status === "scheduled" || e.status === "ongoing" ? e.papers.filter((p) => p.date >= today).map((p) => ({ ...p, exam: e })) : []));
  const nextDays = [...new Set(upcomingPapers.map((p) => p.date))].sort().slice(0, 3);
  const classes = sortClasses([...new Set(exams.flatMap((e) => e.classes))]);
  const counts = (s: ExamStatus | "all") => (s === "all" ? exams.length : exams.filter((e) => e.status === s).length);

  const stats: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Exams this session", value: String(live.length), hint: `${live.filter((e) => e.status === "published" || e.status === "completed").length} held · ${counts("cancelled")} cancelled`, icon: ClipboardList, accent: "bg-rose-50 text-rose-600" },
    {
      label: next?.status === "ongoing" ? "Running now" : "Next exam",
      value: next ? (next.status === "ongoing" ? `Day ${next.days.filter((d) => d <= today).length}` : `${daysBetween(today, next.days[0] ?? next.startDate)} days`) : "—",
      hint: next ? `${next.name} · ${formatDate(next.days[0] ?? next.startDate)}` : "Nothing scheduled",
      icon: CalendarClock,
      accent: "bg-amber-50 text-amber-600",
    },
    { label: "Papers scheduled", value: String(upcomingPapers.length), hint: `Over ${new Set(upcomingPapers.map((p) => p.date)).size} exam days`, icon: NotebookPen, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Results published", value: `${counts("published")} / ${live.length}`, hint: `${counts("completed")} waiting for marks`, icon: FileCheck2, accent: "bg-emerald-50 text-emerald-600" },
  ];

  function exportCsv() {
    const rows: (string | number)[][] = [["Exam", "Type", "Status", "Class", "Subject", "Date", "Day", "Time"]];
    for (const e of visible) for (const p of e.papers) rows.push([e.name, e.type, STATUS_STYLE[e.status].label, p.className, p.subject, p.date, WEEKDAY_NAMES[weekdayOf(p.date)]!, timeRange(p)]);
    downloadCsv(rows, `exam-routine-${today}.csv`);
    toast("Export ready", { description: `${visible.length} exam(s) · ${rows.length - 1} papers downloaded as CSV.`, tone: "info" });
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Examinations"
        description="Plan the session's exams — routine, seat plan, admit cards and results. Open an exam to manage it."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={!hydrated}>
              <Download className="h-4 w-4" />
              Export routine
            </Button>
            <Button onClick={() => setAdding(true)} disabled={!hydrated}>
              <Plus className="h-4 w-4" />
              New Exam
            </Button>
          </>
        }
      />

      {hydrated ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, hint, icon: Icon, accent }) => (
            <Card key={label} className="flex items-center gap-4 p-5">
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg-muted">{label}</p>
                <p className="text-2xl font-bold tabular-nums text-fg">{value}</p>
                <p className="truncate text-xs text-fg-subtle">{hint}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-[92px] animate-pulse rounded-2xl bg-soft" />
      )}

      <Card className="mt-6 flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {(["all", "scheduled", "ongoing", "completed", "published", "cancelled"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ status: s })}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition", filters.status === s ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}
            >
              {s === "all" ? "All" : STATUS_STYLE[s].label}
              {hydrated && <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", filters.status === s ? "bg-surface/20" : "bg-soft")}>{counts(s)}</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search exam name or type..."
            aria-label="Search exams"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-9 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button type="button" onClick={() => set({ search: "" })} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-soft">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select aria-label="Class" value={filters.className} onChange={(e) => set({ className: e.target.value })} className="lg:w-40">
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {!hydrated ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-60 animate-pulse rounded-2xl bg-soft" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <EmptyState icon={ClipboardList} title="No exams found" description="Try another status, class or search — or create a new exam." />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {visible.map((e) => (
                <ExamCard key={e.id} exam={e} today={today} />
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <CalendarDays className="h-4 w-4 text-fg-muted" />
            Coming up
          </h2>
          <p className="text-xs text-fg-muted">The next exam days and their papers.</p>
          {!hydrated ? (
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-soft" />
          ) : nextDays.length === 0 ? (
            <p className="mt-4 rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">No papers scheduled.</p>
          ) : (
            <ol className="mt-4 space-y-5">
              {nextDays.map((d) => {
                const list = upcomingPapers.filter((p) => p.date === d);
                return (
                  <li key={d}>
                    <div className="mb-2 flex items-center gap-3">
                      <span className={cn("flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl", d === today ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow" : "bg-rose-50 text-rose-700")}>
                        <span className="text-[9px] font-semibold uppercase leading-none">{WEEKDAY_NAMES[weekdayOf(d)]!.slice(0, 3)}</span>
                        <span className="text-base font-bold leading-tight">{Number(d.slice(8))}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-fg">{d === today ? "Today" : formatDate(d)}</p>
                        <p className="truncate text-xs text-fg-muted">
                          {list[0]!.exam.name} · {list.length} paper{list.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-14">
                      {list.slice(0, 8).map((p) => (
                        <Link key={`${p.exam.id}${p.id}`} href={examHref(p.exam, "schedule")} className="rounded-lg bg-soft px-2 py-1 text-[11px] font-medium text-fg-secondary transition hover:bg-indigo-50 hover:text-indigo-700">
                          {p.className.replace("Class ", "C")} · {p.subject}
                        </Link>
                      ))}
                      {list.length > 8 && <span className="px-1 py-1 text-[11px] text-fg-subtle">+{list.length - 8} more</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      {adding && <NewExamDialog slugs={exams.map((e) => e.slug)} onClose={() => setAdding(false)} />}
    </div>
  );
}

function ExamCard({ exam: e, today }: { exam: ExamSummary; today: string }) {
  const done = e.days.filter((d) => d < today || (d === today && e.status !== "ongoing")).length + (e.status === "ongoing" && e.days.includes(today) ? 0.5 : 0);
  const progress = e.status === "scheduled" || e.status === "cancelled" ? 0 : e.status === "ongoing" ? done / Math.max(1, e.days.length) : 1;
  const style = STATUS_STYLE[e.status];
  return (
    <Link href={examHref(e)} className={cn("group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-card-hover", e.status === "cancelled" && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-card", TYPE_ACCENT[e.type])}>
          <ClipboardList className="h-5 w-5" />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {e.custom && <Badge tone="violet">New</Badge>}
          <Badge tone={style.tone} dot>
            {style.label}
          </Badge>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{e.type}</p>
      <h3 className="font-semibold text-fg group-hover:text-rose-600">{e.name}</h3>
      <p className="mt-0.5 text-xs text-fg-muted">
        {formatDate(e.days[0] ?? e.startDate)}
        {e.endDate !== (e.days[0] ?? e.startDate) && ` – ${formatDate(e.endDate)}`}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-subtle p-3 text-center">
        {(
          [
            ["Classes", e.classes.length],
            ["Papers", e.papers.length],
            ["Students", e.candidates.length],
          ] as const
        ).map(([label, n]) => (
          <div key={label}>
            <p className="text-base font-bold tabular-nums text-fg">{n}</p>
            <p className="text-[11px] text-fg-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-fg-muted">
            <Users className="h-3 w-3" />
            {e.days.length} exam days
          </span>
          <span className="font-semibold tabular-nums text-fg-subtle">{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
          <div className={cn("h-full rounded-full", e.status === "published" ? "bg-emerald-500" : e.status === "completed" ? "bg-slate-400" : "bg-amber-500")} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </Link>
  );
}
