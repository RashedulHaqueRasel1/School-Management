"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Archive, Armchair, ChevronRight, Clock, DoorOpen, Download, LayoutGrid, List, Plus, Rows3, School, Search, Table2, UserRound, Users, X, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";
import { useUIStore } from "@/store/ui.store";

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

type ClassesLayout = "grouped" | "grid" | "list" | "table";

const LAYOUTS: { value: ClassesLayout; label: string; icon: LucideIcon }[] = [
  { value: "grouped", label: "Grouped by class", icon: Rows3 },
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "list", label: "List", icon: List },
  { value: "table", label: "Table", icon: Table2 },
];

export function ClassesView() {
  const { sections, teachers, hydrated } = useClasses();
  const [filters, setFilters] = useState<ClassFilters>({ search: "", level: "all", shift: "all", view: "active" });
  const [adding, setAdding] = useState<string | true | null>(null);
  const savedView = useUIStore((st) => st.views.classes) as ClassesLayout | undefined;
  const setView = useUIStore((st) => st.setView);
  // Use the remembered layout only after hydration (the server always renders "grouped").
  const layout: ClassesLayout = hydrated && savedView && LAYOUTS.some((l) => l.value === savedView) ? savedView : "grouped";

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
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-xl bg-soft p-1" role="group" aria-label="Layout">
            {LAYOUTS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                title={label}
                aria-label={`${label} view`}
                aria-pressed={layout === value}
                onClick={() => setView("classes", value)}
                className={cn("flex h-8 w-9 items-center justify-center rounded-lg transition", layout === value ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg")}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
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
      ) : layout === "grid" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((s) => (
            <SectionCard key={s.key} section={s} />
          ))}
        </div>
      ) : layout === "list" ? (
        <Card className="mt-6 divide-y divide-line overflow-hidden">
          {visible.map((s) => (
            <SectionRow key={s.key} section={s} />
          ))}
        </Card>
      ) : layout === "table" ? (
        <SectionsTable sections={visible} />
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

const LEVEL_DOT: Record<ClassLevel, string> = {
  "Pre-primary": "bg-amber-500",
  Primary: "bg-emerald-500",
  Secondary: "bg-indigo-500",
  Other: "bg-slate-400",
};

const fill = (s: ClassSection) => s.students.length / Math.max(1, s.settings.capacity);

function FillBar({ section: s, className }: { section: ClassSection; className?: string }) {
  const ratio = fill(s);
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-soft", className)}>
      <div className={cn("h-full rounded-full", fillTone(ratio))} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
    </div>
  );
}

/** Grid view: one bigger card per section, class name included. */
function SectionCard({ section: s }: { section: ClassSection }) {
  const ratio = fill(s);
  const boys = s.students.filter((x) => x.gender === "Male").length;
  return (
    <Link href={sectionHref(s)} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-card-hover">
      <div className={cn("h-1.5 bg-linear-to-r", LEVEL_ACCENT[s.level])} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-lg font-black text-sky-700">{sectionCode(s.className, s.section)}</span>
          <div className="flex flex-wrap justify-end gap-1">
            <Badge>{s.level}</Badge>
            {s.custom && <Badge tone="info">New</Badge>}
            {s.settings.version === "English" && <Badge tone="violet">EV</Badge>}
          </div>
        </div>
        <p className="mt-3 text-base font-semibold text-fg group-hover:text-sky-700">{s.className}</p>
        <p className="text-sm text-fg-muted">Section {s.section}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-fg-subtle">Room</dt>
            <dd className="mt-0.5 font-medium text-fg">{s.settings.room}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">Shift</dt>
            <dd className="mt-0.5 font-medium text-fg">{s.settings.shift}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">Boys · girls</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-fg">
              {boys} · {s.students.length - boys}
            </dd>
          </div>
          <div>
            <dt className="text-fg-subtle">Version</dt>
            <dd className="mt-0.5 font-medium text-fg">{s.settings.version}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold tabular-nums text-fg">
              {s.students.length}
              <span className="font-normal text-fg-muted"> / {s.settings.capacity} seats</span>
            </span>
            <span className="tabular-nums text-fg-subtle">{Math.round(ratio * 100)}%</span>
          </div>
          <FillBar section={s} className="mt-1.5" />
        </div>
        <p className="mt-auto flex items-center gap-1.5 truncate border-t border-line pt-3 text-xs text-fg-muted [margin-top:1rem]">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
          {s.classTeacher.name}
        </p>
      </div>
    </Link>
  );
}

/** List view: compact, scannable rows. */
function SectionRow({ section: s }: { section: ClassSection }) {
  const ratio = fill(s);
  return (
    <Link href={sectionHref(s)} className="group flex items-center gap-4 px-4 py-3 transition hover:bg-subtle/70 sm:px-5">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", LEVEL_DOT[s.level])} title={s.level} />
      <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xs font-bold text-sky-700">{sectionCode(s.className, s.section)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-fg group-hover:text-sky-700">
          {s.className} · Section {s.section}
          {s.custom && (
            <Badge tone="info" className="ml-2 align-middle">
              New
            </Badge>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-muted">
          <span className="flex items-center gap-1">
            <DoorOpen className="h-3 w-3" />
            {s.settings.room}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {s.settings.shift} · {s.settings.version}
          </span>
          <span className="flex items-center gap-1 sm:hidden">
            <UserRound className="h-3 w-3" />
            {s.classTeacher.name}
          </span>
        </p>
      </div>
      <span className="hidden w-44 items-center gap-1.5 truncate text-sm text-fg-secondary sm:flex">
        <UserRound className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
        {s.classTeacher.name}
      </span>
      <div className="hidden w-36 md:block">
        <p className="text-right text-xs tabular-nums text-fg-secondary">
          <span className="font-semibold text-fg">{s.students.length}</span>/{s.settings.capacity} · {Math.round(ratio * 100)}%
        </p>
        <FillBar section={s} className="mt-1" />
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
    </Link>
  );
}

type SortKey = "class" | "students" | "fill" | "teacher" | "room";
type SortState = { key: SortKey; dir: 1 | -1 };

function Head({ k, sort, onSort, children, className }: { k: SortKey; sort: SortState; onSort: (s: SortState) => void; children: React.ReactNode; className?: string }) {
  const on = sort.key === k;
  const Icon = on ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={cn("px-3 py-3", className)} aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort({ key: k, dir: on ? (sort.dir === 1 ? -1 : 1) : 1 })} className={cn("inline-flex items-center gap-1 uppercase transition hover:text-fg", on && "text-fg")}>
        {children}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

/** Table view: every detail, sortable. */
function SectionsTable({ sections }: { sections: ClassSection[] }) {
  const [sort, setSort] = useState<SortState>({ key: "class", dir: 1 });
  const value = (s: ClassSection): string | number =>
    sort.key === "students" ? s.students.length : sort.key === "fill" ? fill(s) : sort.key === "teacher" ? s.classTeacher.name : sort.key === "room" ? s.settings.room : 0;
  const rows = sort.key === "class" ? (sort.dir === 1 ? sections : [...sections].reverse()) : [...sections].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
  });

  const head = { sort, onSort: setSort };

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              <Head k="class" {...head} className="pl-5 sm:pl-6">
                Class · section
              </Head>
              <th className="px-3 py-3">Level</th>
              <Head k="room" {...head}>Room</Head>
              <th className="px-3 py-3">Shift · version</th>
              <Head k="teacher" {...head}>Class teacher</Head>
              <th className="px-3 py-3 text-center">Boys · girls</th>
              <Head k="students" {...head}>Students</Head>
              <Head k="fill" {...head} className="pr-5 sm:pr-6">
                Seats filled
              </Head>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => {
              const boys = s.students.filter((x) => x.gender === "Male").length;
              const ratio = fill(s);
              return (
                <tr key={s.key} className="group transition-colors hover:bg-subtle/70">
                  <td className="py-3 pl-5 pr-3 sm:pl-6">
                    <Link href={sectionHref(s)} className="flex items-center gap-3">
                      <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-700">{sectionCode(s.className, s.section)}</span>
                      <span>
                        <span className="block font-semibold text-fg group-hover:text-sky-700">{s.className}</span>
                        <span className="block text-xs text-fg-muted">
                          Section {s.section}
                          {s.custom && " · new"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-fg-secondary">
                      <span className={cn("h-2 w-2 rounded-full", LEVEL_DOT[s.level])} />
                      {s.level}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-fg-secondary">{s.settings.room}</td>
                  <td className="px-3 py-3 text-fg-secondary">
                    {s.settings.shift} · {s.settings.version}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-fg-secondary">{s.classTeacher.name}</p>
                    <p className="text-xs text-fg-subtle">{s.classTeacher.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums text-fg-secondary">
                    {boys} · {s.students.length - boys}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    <span className="font-semibold text-fg">{s.students.length}</span>
                    <span className="text-fg-subtle"> / {s.settings.capacity}</span>
                  </td>
                  <td className="py-3 pl-3 pr-5 sm:pr-6">
                    <div className="flex items-center gap-2">
                      <FillBar section={s} className="w-20" />
                      <span className="text-xs font-semibold tabular-nums text-fg-secondary">{Math.round(ratio * 100)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-fg-muted sm:px-6">
        {sections.length} section{sections.length === 1 ? "" : "s"} · click a column title to sort
      </p>
    </Card>
  );
}
