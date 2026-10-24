"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Armchair, DoorOpen, Download, LayoutGrid, Plus, School, Search, UserRound, Users, X, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { LEVELS, sectionCode } from "../demoData/mock-data";
import { useClasses } from "../hooks/use-classes";
import type { ClassFilters, ClassLevel, ClassSection } from "../types/types";
import { exportSectionsCsv, sectionHref } from "../utils";
import { AddSectionDialog } from "./AddSectionDialog";

const LEVEL_ACCENT: Record<ClassLevel, string> = {
  "Pre-primary": "from-amber-400 to-orange-500",
  Primary: "from-emerald-500 to-teal-500",
  Secondary: "from-indigo-500 to-violet-500",
  Other: "from-slate-400 to-slate-500",
};

export function fillTone(ratio: number) {
  return ratio > 1 ? "bg-rose-500" : ratio >= 0.9 ? "bg-amber-500" : "bg-emerald-500";
}

export function ClassesView() {
  const { sections, teachers, hydrated } = useClasses();
  const [filters, setFilters] = useState<ClassFilters>({ search: "", level: "all", shift: "all", view: "active" });
  const [adding, setAdding] = useState<string | true | null>(null);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return sections.filter((s) => {
      if (filters.view === "archived" ? !s.archived : s.archived) return false;
      if (filters.level !== "all" && s.level !== filters.level) return false;
      if (filters.shift !== "all" && s.settings.shift !== filters.shift) return false;
      if (!q) return true;
      return [s.className, `${s.className} ${s.section}`, s.classTeacher.name, s.settings.room].some((v) => v.toLowerCase().includes(q));
    });
  }, [sections, filters]);

  const active = sections.filter((s) => !s.archived);
  const enrolled = active.reduce((sum, s) => sum + s.students.length, 0);
  const seats = active.reduce((sum, s) => sum + s.settings.capacity, 0);
  const stats: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Classes", value: String(new Set(active.map((s) => s.className)).size), hint: `${LEVELS.filter((l) => active.some((s) => s.level === l)).length} levels`, icon: School, accent: "bg-sky-50 text-sky-600" },
    { label: "Sections", value: String(active.length), hint: `${active.filter((s) => s.custom).length} added by admin`, icon: LayoutGrid, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Students enrolled", value: String(enrolled), hint: `${active.length ? (enrolled / active.length).toFixed(1) : 0} per section`, icon: Users, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Seats filled", value: `${seats ? Math.round((enrolled / seats) * 100) : 0}%`, hint: `${seats - enrolled} seats free`, icon: Armchair, accent: "bg-amber-50 text-amber-600" },
  ];

  // Group visible sections by level → class.
  const groups = LEVELS.map((level) => ({
    level,
    classes: [...new Set(visible.filter((s) => s.level === level).map((s) => s.className))].map((className) => ({
      className,
      sections: visible.filter((s) => s.className === className),
    })),
  })).filter((g) => g.classes.length > 0);

  const set = (patch: Partial<ClassFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const archivedCount = sections.filter((s) => s.archived).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Classes & Sections"
        description="Every class and section — students, class teacher, room, subjects, routine and daily attendance. Open a section to manage it."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                exportSectionsCsv(visible);
                toast("Export ready", { description: `${visible.length} sections downloaded as CSV.`, tone: "info" });
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Add Section
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
        <div className="flex gap-1 overflow-x-auto">
          {(["all", ...LEVELS.filter((l) => l !== "Other" || sections.some((s) => s.level === "Other"))] as (ClassLevel | "all")[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set({ level: l })}
              className={cn("shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition", filters.level === l ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}
            >
              {l === "all" ? "All levels" : l}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search class, section, room or class teacher..."
            aria-label="Search sections"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-9 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button type="button" onClick={() => set({ search: "" })} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-soft">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Select aria-label="Shift" value={filters.shift} onChange={(e) => set({ shift: e.target.value })} className="w-36">
            <option value="all">All shifts</option>
            <option value="Morning">Morning</option>
            <option value="Day">Day</option>
          </Select>
          <Button variant={filters.view === "archived" ? "primary" : "outline"} onClick={() => set({ view: filters.view === "archived" ? "active" : "archived" })} disabled={archivedCount === 0 && filters.view !== "archived"}>
            <Archive className="h-4 w-4" />
            Archived{archivedCount > 0 && ` (${archivedCount})`}
          </Button>
        </div>
      </Card>

      {!hydrated ? (
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-soft" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="mt-6">
          <EmptyState icon={School} title="No sections found" description="Try another search or filter." />
        </Card>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((g) => (
            <section key={g.level}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-fg-subtle">
                <span className={cn("h-2 w-2 rounded-full bg-linear-to-br", LEVEL_ACCENT[g.level])} />
                {g.level}
              </h2>
              <div className="space-y-4">
                {g.classes.map((c) => {
                  const total = c.sections.reduce((sum, s) => sum + s.students.length, 0);
                  return (
                    <Card key={c.className} className="p-4 sm:p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-sm font-bold text-white shadow-card", LEVEL_ACCENT[g.level])}>
                            {c.className.startsWith("Class ") ? c.className.slice(6) : c.className.slice(0, 2)}
                          </span>
                          <div>
                            <h3 className="font-semibold text-fg">{c.className}</h3>
                            <p className="text-xs text-fg-muted">
                              {c.sections.length} section{c.sections.length === 1 ? "" : "s"} · {total} student{total === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        {filters.view === "active" && (
                          <Button size="sm" variant="ghost" onClick={() => setAdding(c.className)}>
                            <Plus className="h-3.5 w-3.5" />
                            Section
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {c.sections.map((s) => (
                          <SectionTile key={s.key} section={s} />
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {adding && <AddSectionDialog sections={sections} teachers={teachers} initialClass={adding === true ? undefined : adding} onClose={() => setAdding(null)} />}
    </div>
  );
}

function SectionTile({ section: s }: { section: ClassSection }) {
  const ratio = s.students.length / Math.max(1, s.settings.capacity);
  return (
    <Link href={sectionHref(s)} className="group rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sm font-bold text-sky-700">{sectionCode(s.className, s.section)}</span>
          <div className="min-w-0">
            <p className="font-semibold text-fg group-hover:text-sky-700">Section {s.section}</p>
            <p className="flex items-center gap-1 text-xs text-fg-muted">
              <DoorOpen className="h-3 w-3" />
              {s.settings.room} · {s.settings.shift}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {s.custom && <Badge tone="info">New</Badge>}
          {s.settings.version === "English" && <Badge tone="violet">EV</Badge>}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold tabular-nums text-fg">
            {s.students.length}
            <span className="font-normal text-fg-muted"> / {s.settings.capacity} students</span>
          </span>
          <span className="tabular-nums text-fg-subtle">{Math.round(ratio * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
          <div className={cn("h-full rounded-full", fillTone(ratio))} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 truncate border-t border-line pt-3 text-xs text-fg-muted">
        <UserRound className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
        {s.classTeacher.name}
      </p>
    </Link>
  );
}
