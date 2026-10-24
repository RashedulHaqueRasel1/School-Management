"use client";

import { useState } from "react";
import { AlertTriangle, PenLine, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { localToday, weekdayOf } from "@/features/students/demoData/profile-data";
import { DAY_NAMES, PERIODS_PER_DAY, ROUTINE_DAYS, periodTime } from "@/features/teachers/demoData/mock-data";
import { cn } from "@/lib/utils";

import { useSection, type GridCell } from "../../hooks/use-section";
import { RoutineCellDialog } from "./admin/SectionDialogs";

const PALETTE = [
  "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
  "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  "bg-amber-50 text-amber-700 ring-amber-200/70",
  "bg-violet-50 text-violet-700 ring-violet-200/70",
  "bg-sky-50 text-sky-700 ring-sky-200/70",
  "bg-rose-50 text-rose-700 ring-rose-200/70",
];

export function SectionRoutineView({ slug }: { slug: string }) {
  const { section, grid, subjects, curriculum, teachers, busy } = useSection(slug);
  const [editing, setEditing] = useState<GridCell | null>(null);
  if (!section || !grid || !subjects || !curriculum || !busy) return null;

  const names = [...new Set([...curriculum.map((c) => c.name), ...subjects.map((s) => s.name)])];
  const color = (subject: string) => PALETTE[Math.max(0, names.indexOf(subject)) % PALETTE.length]!;
  const weekday = weekdayOf(localToday());
  const clashes = grid.filter((c) => c.clash).length;
  const edited = grid.filter((c) => c.edited).length;
  const free = grid.filter((c) => !c.cell).length;
  const noTeacher = grid.filter((c) => c.unassigned).length;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Weekly class routine</h2>
          <p className="text-xs text-fg-muted">
            Built from the teachers&apos; class assignments · click a period to change it · {free} free · {edited} edited
          </p>
        </div>
        {noTeacher > 0 && <Badge tone="warning">{noTeacher} period(s) without teacher</Badge>}
        {clashes > 0 && (
          <Badge tone="warning">
            <AlertTriangle className="h-3 w-3" /> {clashes} clash{clashes > 1 ? "es" : ""}
          </Badge>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle/70 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="w-28 py-3 pl-5 text-left">Day</th>
                {Array.from({ length: PERIODS_PER_DAY }, (_, i) => (
                  <th key={i} className="px-2 py-3 text-left">
                    Period {i + 1}
                    <span className="block text-[10px] font-medium normal-case tracking-normal text-fg-subtle">{periodTime(section.settings.shift, i + 1)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROUTINE_DAYS.map((day) => (
                <tr key={day} className={cn(day === weekday && "bg-sky-50/40")}>
                  <td className="py-2.5 pl-5 font-medium text-fg">
                    {DAY_NAMES[day]}
                    {day === weekday && <span className="block text-[10px] font-semibold uppercase text-sky-600">Today</span>}
                  </td>
                  {grid
                    .filter((c) => c.day === day)
                    .map((c) => (
                      <td key={c.slot} className="px-1.5 py-2">
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          title={c.clash ?? "Edit period"}
                          className={cn(
                            "group relative w-full rounded-lg px-2.5 py-2 text-left ring-1 ring-inset transition hover:-translate-y-0.5 hover:shadow-card",
                            c.unassigned ? "bg-amber-50/50 text-amber-800 ring-amber-300 [--tw-ring-inset:inset] outline-dashed outline-1 -outline-offset-4 outline-amber-300 dark:text-amber-700" : c.cell ? color(c.cell.subject) : "bg-surface text-fg-subtle ring-line",
                            c.clash && "ring-2 ring-amber-400",
                          )}
                        >
                          <p className="truncate text-xs font-semibold">{c.cell?.subject ?? "Free"}</p>
                          <p className="truncate text-[11px] opacity-80">{c.cell?.teacherName ?? "Click to assign"}</p>
                          <span className="absolute right-1.5 top-1.5 flex items-center gap-1">
                            {c.clash && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                            {c.edited && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" title="Edited" />}
                            <PenLine className="h-3 w-3 opacity-0 transition group-hover:opacity-70" />
                          </span>
                        </button>
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 border-t border-line px-5 py-3 text-xs text-fg-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Edited by admin
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-600" /> Clash — teacher busy elsewhere or two classes at once
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm outline-dashed outline-1 outline-amber-400" /> No teacher yet — assign on Subjects & Teachers
          </span>
          <span>Friday — weekly holiday</span>
        </div>
      </Card>

      {editing && <RoutineCellDialog section={section} cell={editing} subjects={names} teachers={teachers} busy={busy} onClose={() => setEditing(null)} />}
    </div>
  );
}
