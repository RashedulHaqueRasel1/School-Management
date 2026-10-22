import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { AttendanceSummary } from "../types/types";

const GAP = 1.2; // gap between donut segments, in % of the circumference

function ProgressRow({ label, present, total }: { label: string; present: number; total: number }) {
  const percent = (present / total) * 100;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium text-fg-secondary">{label}</span>
        <span className="tabular-nums text-fg-muted">
          <span className="font-semibold text-fg">{present.toLocaleString()}</span> / {total.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-soft">
        <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function AttendanceOverview({ data }: { data: AttendanceSummary }) {
  const total = data.segments.reduce((sum, s) => sum + s.count, 0);
  const presentPct = ((data.segments[0]!.count / total) * 100).toFixed(1);

  const pcts = data.segments.map((s) => (s.count / total) * 100);
  const arcs = data.segments.map((s, i) => ({
    ...s,
    dash: Math.max(pcts[i]! - GAP, 0),
    // Each arc starts where the previous ones end.
    offset: pcts.slice(0, i).reduce((sum, p) => sum + p, 0),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Today&apos;s Attendance</CardTitle>
          <CardDescription>Thursday, 22 October</CardDescription>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/70">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </CardHeader>

      <CardContent>
        <div className="relative mx-auto h-44 w-44">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="3.2" className="text-soft" />
            {arcs.map((a) => (
              <circle
                key={a.label}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={a.color}
                strokeWidth="3.2"
                strokeDasharray={`${a.dash} ${100 - a.dash}`}
                strokeDashoffset={-a.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold tracking-tight tabular-nums text-fg">{presentPct}%</p>
            <p className="text-xs font-medium text-fg-muted">Present</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {arcs.map((a) => (
            <div key={a.label} className="rounded-xl bg-subtle px-3 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-fg-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                {a.label}
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-fg">{a.count.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <ProgressRow label="Students" {...data.students} />
          <ProgressRow label="Staff" {...data.staff} />
        </div>
      </CardContent>
    </Card>
  );
}
