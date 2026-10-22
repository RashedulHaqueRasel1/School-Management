"use client";

import { LayoutGrid, List, RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { cn } from "@/lib/utils";

import type { StudentFilters } from "../types/types";
import { DEFAULT_STUDENT_FILTERS } from "../utils";

export type StudentsViewMode = "table" | "grid";

type StudentsToolbarProps = {
  filters: StudentFilters;
  onChange: (patch: Partial<StudentFilters>) => void;
  view: StudentsViewMode;
  onViewChange: (view: StudentsViewMode) => void;
  sourceCounts: Record<StudentFilters["source"], number>;
  /** Sections in use (incl. custom ones set by admins). */
  sections: string[];
};

export function StudentsToolbar({ filters, onChange, view, onViewChange, sourceCounts, sections }: StudentsToolbarProps) {
  const hasActiveFilters =
    filters.search !== "" || filters.className !== "all" || filters.section !== "all" || filters.gender !== "all" || filters.sort !== "class";

  const tabs: { value: StudentFilters["source"]; label: string }[] = [
    { value: "all", label: "All students" },
    { value: "admission", label: "New admissions" },
    { value: "existing", label: "Existing" },
    { value: "left", label: "Left (TC)" },
  ];

  return (
    <div className="space-y-4 px-5 pt-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.map((tab) => {
            const active = filters.source === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onChange({ source: tab.value })}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                  active ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg",
                )}
              >
                {tab.label}
                <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] tabular-nums", active ? "bg-surface/20 text-surface" : "bg-soft text-fg-muted")}>
                  {sourceCounts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex rounded-xl bg-soft p-1" role="group" aria-label="View">
          {(
            [
              { value: "table", icon: List, label: "Table view" },
              { value: "grid", icon: LayoutGrid, label: "Card view" },
            ] as const
          ).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onViewChange(value)}
              aria-pressed={view === value}
              aria-label={label}
              title={label}
              className={cn(
                "flex h-8 w-9 items-center justify-center rounded-lg transition",
                view === value ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by name, student ID, guardian, phone..."
            aria-label="Search students"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-9 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: "" })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-soft hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
          <Select aria-label="Filter by class" value={filters.className} onChange={(e) => onChange({ className: e.target.value })} className="lg:w-36">
            <option value="all">All classes</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select aria-label="Filter by section" value={filters.section} onChange={(e) => onChange({ section: e.target.value })} className="lg:w-32">
            <option value="all">All sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </Select>
          <Select aria-label="Filter by gender" value={filters.gender} onChange={(e) => onChange({ gender: e.target.value as StudentFilters["gender"] })} className="lg:w-32">
            <option value="all">All genders</option>
            <option value="Male">Boys</option>
            <option value="Female">Girls</option>
          </Select>
          <Select aria-label="Sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value as StudentFilters["sort"] })} className="lg:w-40">
            <option value="class">Class & roll</option>
            <option value="name">Name (A–Z)</option>
            <option value="newest">Newest enrolled</option>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={() => onChange({ ...DEFAULT_STUDENT_FILTERS, source: filters.source })} className="self-start lg:self-auto">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
