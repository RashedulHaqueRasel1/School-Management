"use client";

import { RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { CLASS_OPTIONS, DEFAULT_FILTERS, SORT_OPTIONS, STATUS_CONFIG, STATUSES } from "../constants";
import type { AdmissionFilters, AdmissionStatus } from "../types/types";

type AdmissionsToolbarProps = {
  filters: AdmissionFilters;
  onChange: (patch: Partial<AdmissionFilters>) => void;
  statusCounts: Record<AdmissionStatus | "all", number>;
};

export function AdmissionsToolbar({ filters, onChange, statusCounts }: AdmissionsToolbarProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.applyingClass !== "all" ||
    filters.gender !== "all" ||
    filters.fee !== "all" ||
    filters.sort !== DEFAULT_FILTERS.sort;

  const tabs: { value: AdmissionStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label })),
  ];

  return (
    <div className="space-y-4 px-5 pt-5 sm:px-6">
      {/* Status tabs */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => {
          const active = filters.status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange({ status: tab.value })}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                active ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                  active ? "bg-surface/20 text-surface" : "bg-soft text-fg-muted",
                )}
              >
                {statusCounts[tab.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by student, parent, ID, phone..."
            aria-label="Search admissions"
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
          <Select
            aria-label="Filter by class"
            value={filters.applyingClass}
            onChange={(e) => onChange({ applyingClass: e.target.value })}
            className="lg:w-36"
          >
            <option value="all">All classes</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by gender"
            value={filters.gender}
            onChange={(e) => onChange({ gender: e.target.value as AdmissionFilters["gender"] })}
            className="lg:w-32"
          >
            <option value="all">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
          <Select
            aria-label="Filter by fee status"
            value={filters.fee}
            onChange={(e) => onChange({ fee: e.target.value as AdmissionFilters["fee"] })}
            className="lg:w-32"
          >
            <option value="all">All fees</option>
            <option value="paid">Fee paid</option>
            <option value="partial">Partially paid</option>
            <option value="unpaid">Fee unpaid</option>
          </Select>
          <Select
            aria-label="Sort"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as AdmissionFilters["sort"] })}
            className="lg:w-36"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => onChange({ ...DEFAULT_FILTERS, status: filters.status })}
            className="self-start lg:self-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
