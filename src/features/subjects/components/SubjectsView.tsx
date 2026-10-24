"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, BookOpen, Download, GraduationCap, Plus, Search, TrendingUp, UserCheck, X, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { classRange } from "../demoData/catalog";
import { useSubjects, type SubjectSummary } from "../hooks/use-subjects";
import type { SubjectFilters, SubjectType } from "../types/types";
import { SUBJECT_TYPES, TYPE_ACCENT, TYPE_TONE, scoreTone, subjectHref } from "../utils";
import { AddSubjectDialog } from "./AddSubjectDialog";

function exportCsv(list: SubjectSummary[]) {
  const header = ["Subject", "Code", "Type", "Classes", "Periods/week", "Full marks", "Pass marks", "Students", "Teachers", "Latest average %"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = list.map((s) =>
    [s.name, s.code, s.type, s.classes.join("; "), s.periodsPerWeek, s.fullMarks, s.passMarks, s.learners.length, s.teachers.map((t) => t.name).join("; "), s.average?.toFixed(1) ?? ""].map(esc).join(","),
  );
  const blob = new Blob([[header.map(esc).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subjects-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SubjectsView() {
  const router = useRouter();
  const { subjects, students, teachers, hydrated } = useSubjects();
  const [filters, setFilters] = useState<SubjectFilters>({ search: "", type: "all", className: "all", view: "active" });
  const [adding, setAdding] = useState(false);
  const set = (patch: Partial<SubjectFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return subjects.filter((s) => {
      if (filters.view === "archived" ? !s.archived : s.archived) return false;
      if (filters.type !== "all" && s.type !== filters.type) return false;
      if (filters.className !== "all" && !s.classes.includes(filters.className)) return false;
      if (!q) return true;
      return [s.name, s.code, ...s.teachers.map((t) => t.name)].some((v) => v.toLowerCase().includes(q));
    });
  }, [subjects, filters]);

  const active = subjects.filter((s) => !s.archived);
  const scored = active.filter((s) => s.average !== undefined);
  const weakest = [...scored].sort((a, b) => a.average! - b.average!)[0];
  const stats: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Subjects", value: String(active.length), hint: `${active.filter((s) => s.type === "Core").length} core · ${active.filter((s) => s.custom).length} added`, icon: BookOpen, accent: "bg-violet-50 text-violet-600" },
    { label: "Subject teachers", value: String(new Set(active.flatMap((s) => s.teachers.map((t) => t.id))).size), hint: `${active.filter((s) => s.teachers.length === 0).length} subject(s) without a teacher`, icon: UserCheck, accent: "bg-emerald-50 text-emerald-600" },
    {
      label: "School average",
      value: scored.length ? `${Math.round(scored.reduce((s, x) => s + x.average!, 0) / scored.length)}%` : "—",
      hint: scored[0]?.latestExam ?? "Latest published exam",
      icon: TrendingUp,
      accent: "bg-indigo-50 text-indigo-600",
    },
    { label: "Needs attention", value: weakest?.name ?? "—", hint: weakest ? `Lowest average · ${Math.round(weakest.average!)}%` : "", icon: GraduationCap, accent: "bg-rose-50 text-rose-600" },
  ];
  const archivedCount = subjects.filter((s) => s.archived).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Subjects"
        description="Curriculum and extra subjects — where they're taught, who teaches them, syllabus progress and exam performance."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                exportCsv(visible);
                toast("Export ready", { description: `${visible.length} subjects downloaded as CSV.`, tone: "info" });
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Add Subject
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
                <p className="truncate text-2xl font-bold tabular-nums text-fg">{value}</p>
                <p className="truncate text-xs text-fg-subtle">{hint}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-[92px] animate-pulse rounded-2xl bg-soft" />
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="space-y-4 px-5 pt-5 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {(["all", ...SUBJECT_TYPES] as (SubjectType | "all")[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set({ type: t })}
                className={cn("shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition", filters.type === t ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}
              >
                {t === "all" ? "All" : t}
                <span className={cn("ml-2 rounded-md px-1.5 py-0.5 text-[11px] tabular-nums", filters.type === t ? "bg-surface/20 text-surface" : "bg-soft text-fg-muted")}>
                  {subjects.filter((s) => !s.archived === (filters.view === "active") && (t === "all" || s.type === t)).length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => set({ search: e.target.value })}
                placeholder="Search subject, code or teacher..."
                aria-label="Search subjects"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-9 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 [&::-webkit-search-cancel-button]:hidden"
              />
              {filters.search && (
                <button type="button" onClick={() => set({ search: "" })} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-soft">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <Select aria-label="Class" value={filters.className} onChange={(e) => set({ className: e.target.value })} className="w-40">
                <option value="all">All classes</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Button variant={filters.view === "archived" ? "primary" : "outline"} onClick={() => set({ view: filters.view === "archived" ? "active" : "archived" })} disabled={archivedCount === 0 && filters.view !== "archived"}>
                <Archive className="h-4 w-4" />
                Archived{archivedCount > 0 && ` (${archivedCount})`}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {!hydrated ? (
            <div className="space-y-3 border-t border-line p-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-soft" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="border-t border-line">
              <EmptyState icon={BookOpen} title="No subjects found" description="Try another search or filter." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    <th className="py-3 pl-5 pr-3 sm:pl-6">Subject</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Taught in</th>
                    <th className="px-3 py-3">Students</th>
                    <th className="px-3 py-3">Teachers</th>
                    <th className="px-3 py-3">Periods</th>
                    <th className="py-3 pl-3 pr-5 sm:pr-6">Latest average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((s) => (
                    <tr key={s.slug} onClick={() => router.push(subjectHref(s))} className="cursor-pointer transition-colors hover:bg-subtle/70">
                      <td className="py-3.5 pl-5 pr-3 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <span className={cn("flex h-10 w-12 items-center justify-center rounded-xl font-mono text-xs font-bold", TYPE_ACCENT[s.type])}>{s.code}</span>
                          <div>
                            <p className="font-semibold text-fg">{s.name}</p>
                            <p className="text-xs text-fg-subtle">
                              Pass {s.passMarks}/{s.fullMarks}
                              {s.custom && " · added by admin"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge tone={TYPE_TONE[s.type]}>{s.type}</Badge>
                      </td>
                      <td className="px-3 py-3.5 text-fg-secondary">{classRange(s.classes)}</td>
                      <td className="px-3 py-3.5 tabular-nums text-fg-secondary">{s.learners.length}</td>
                      <td className="px-3 py-3.5">
                        {s.teachers.length ? (
                          <span className="text-fg-secondary">
                            {s.teachers[0]!.name}
                            {s.teachers.length > 1 && <span className="text-fg-subtle"> +{s.teachers.length - 1}</span>}
                          </span>
                        ) : (
                          <Badge tone="warning">No teacher</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3.5 tabular-nums text-fg-secondary">{s.periodsPerWeek}/wk</td>
                      <td className="py-3.5 pl-3 pr-5 sm:pr-6">
                        {s.average === undefined ? (
                          <span className="text-xs text-fg-subtle">No results yet</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-soft">
                              <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500" style={{ width: `${s.average}%` }} />
                            </div>
                            <span className={cn("text-xs font-semibold tabular-nums", scoreTone(s.average))}>{Math.round(s.average)}%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {adding && <AddSubjectDialog existing={subjects.map((s) => s.name)} students={students} teachers={teachers} onClose={() => setAdding(false)} />}
    </div>
  );
}
