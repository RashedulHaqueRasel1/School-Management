"use client";

import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ATTENDANCE_STYLE } from "@/features/students/components/profile/attendance-utils";
import type { AttendanceStatus } from "@/features/students/types/types";
import { cn } from "@/lib/utils";

import type { DayCounts } from "../hooks/use-school-attendance";

export type MarkStatus = "present" | "late" | "absent" | "leave";

export const QUICK: { status: MarkStatus; label: string; on: string }[] = [
  { status: "present", label: "P", on: "bg-emerald-500 text-white" },
  { status: "late", label: "L", on: "bg-amber-500 text-white" },
  { status: "absent", label: "A", on: "bg-rose-500 text-white" },
  { status: "leave", label: "Lv", on: "bg-violet-500 text-white" },
];

export const STATUS_TONE = { present: "success", late: "warning", absent: "danger", leave: "violet", holiday: "info", weekend: "neutral" } as const;

export const isOff = (status?: AttendanceStatus) => status === "weekend" || status === "holiday";

/** Rate colour: green ≥ 90, amber ≥ 75, red below. */
export const rateTone = (rate: number) => (rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500");
export const rateText = (rate: number) => (rate >= 90 ? "text-emerald-600" : rate >= 75 ? "text-amber-600" : "text-rose-600");

export type Tile = { label: string; value: string; hint: string; icon: LucideIcon; accent: string };

export function StatTiles({ tiles }: { tiles: Tile[] }) {
  return (
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
  );
}

/** Present / Late / Absent / Leave / Not marked strip (like the section register). */
export function CountStrip({ counts }: { counts: DayCounts }) {
  const items = [
    ["Present", counts.present, "text-emerald-600"],
    ["Late", counts.late, "text-amber-600"],
    ["Absent", counts.absent, "text-rose-600"],
    ["Leave", counts.leave, "text-violet-600"],
    ["Not marked", counts.unmarked, "text-fg-muted"],
  ] as const;
  return (
    <Card className="grid grid-cols-2 divide-line sm:grid-cols-5 sm:divide-x">
      {items.map(([label, value, cls]) => (
        <div key={label} className="px-5 py-4">
          <p className="text-xs font-medium text-fg-muted">{label}</p>
          <p className={cn("mt-1 text-2xl font-bold tabular-nums", cls)}>{value}</p>
        </div>
      ))}
    </Card>
  );
}

/** Stacked bar of a day's statuses. */
export function StatusBar({ counts, className }: { counts: DayCounts; className?: string }) {
  const parts: [string, number][] = [
    [ATTENDANCE_STYLE.present.dot, counts.present],
    [ATTENDANCE_STYLE.late.dot, counts.late],
    [ATTENDANCE_STYLE.absent.dot, counts.absent],
    [ATTENDANCE_STYLE.leave.dot, counts.leave],
  ];
  const total = Math.max(1, counts.total - counts.off);
  return (
    <div className={cn("flex h-2.5 overflow-hidden rounded-full bg-soft", className)}>
      {parts.map(([cls, n], i) => n > 0 && <div key={i} className={cls} style={{ width: `${(n / total) * 100}%` }} />)}
    </div>
  );
}

export function RateBar({ rate, empty }: { rate: number; empty?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-soft">
        {!empty && <div className={cn("h-full rounded-full", rateTone(rate))} style={{ width: `${rate}%` }} />}
      </div>
      <span className={cn("w-12 shrink-0 text-right text-xs font-semibold tabular-nums", empty ? "text-fg-subtle" : rateText(rate))}>{empty ? "—" : `${rate}%`}</span>
    </div>
  );
}

/** P / L / A / Lv segmented toggle. */
export function QuickMark({ value, onMark }: { value?: AttendanceStatus; onMark: (status: MarkStatus) => void }) {
  return (
    <div className="flex rounded-xl bg-soft p-1">
      {QUICK.map((q) => (
        <button
          key={q.status}
          type="button"
          onClick={() => onMark(q.status)}
          aria-pressed={value === q.status}
          title={ATTENDANCE_STYLE[q.status].label}
          className={cn("h-8 min-w-9 rounded-lg px-2 text-xs font-bold transition", value === q.status ? q.on : "text-fg-muted hover:bg-surface hover:text-fg")}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
}

/** Status filter chips with counts. */
export function StatusChips({ value, onChange, counts }: { value: string; onChange: (v: string) => void; counts: DayCounts }) {
  const chips: [string, string, number][] = [
    ["all", "All", counts.total],
    ["present", "Present", counts.present],
    ["late", "Late", counts.late],
    ["absent", "Absent", counts.absent],
    ["leave", "Leave", counts.leave],
    ["unmarked", "Not marked", counts.unmarked],
  ];
  return (
    <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {chips.map(([v, label, n]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition", value === v ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}
        >
          {label}
          <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", value === v ? "bg-surface/20" : "bg-soft")}>{n}</span>
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
    />
  );
}

export function LoadingBlocks({ heights = ["h-[76px]", "h-[92px]", "h-96"] }: { heights?: string[] }) {
  return (
    <div className="space-y-6">
      {heights.map((h, i) => (
        <div key={i} className={cn("animate-pulse rounded-2xl bg-soft", h)} />
      ))}
    </div>
  );
}

/** Download rows as CSV (first row = header). */
export function downloadCsv(rows: (string | number)[][], fileName: string) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
