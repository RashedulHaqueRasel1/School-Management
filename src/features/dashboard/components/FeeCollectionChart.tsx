import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toSmoothPath, type Point } from "@/lib/chart";
import { cn } from "@/lib/utils";

import type { MonthlyValue } from "../types/types";

const W = 600;
const H = 220;
const MAX = 12;
const TICKS = [12, 9, 6, 3, 0];
const RANGES = ["Monthly", "Quarterly", "Yearly"];

type FeeCollectionChartProps = {
  data: MonthlyValue[];
  target: number;
};

export function FeeCollectionChart({ data, target }: FeeCollectionChartProps) {
  const points: Point[] = data.map((d, i) => [
    (i / (data.length - 1)) * W,
    H - (d.value / MAX) * H,
  ]);
  const line = toSmoothPath(points);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const last = data[data.length - 1]!;
  const [lastX, lastY] = points[points.length - 1]!;

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Fee Collection</CardTitle>
          <CardDescription>Monthly collection vs. target (in lakh ৳)</CardDescription>
        </div>
        <div className="hidden rounded-xl bg-soft p-1 sm:flex">
          {RANGES.map((range, i) => (
            <button
              key={range}
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                i === 0 ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold tracking-tight tabular-nums text-fg">
              ৳ {total.toFixed(1)}L
            </p>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <ArrowUpRight className="h-3.5 w-3.5" />
              8.2%
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Collected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-fg-subtle" /> Target
            </span>
          </div>
        </div>

        {/* Plot */}
        <div className="relative mt-8 h-60">
          {TICKS.map((tick) => (
            <div
              key={tick}
              className="absolute inset-x-0 flex items-center"
              style={{ top: `${(1 - tick / MAX) * 100}%` }}
            >
              <span className="w-9 -translate-y-1/2 pr-2 text-right text-[11px] tabular-nums text-fg-subtle">
                {tick}L
              </span>
              <span className="h-px flex-1 -translate-y-1/2 bg-soft" />
            </div>
          ))}

          <div className="absolute inset-y-0 left-9 right-0">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id="fee-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fee-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#fee-area)" />
              <line
                x1={0}
                x2={W}
                y1={H - (target / MAX) * H}
                y2={H - (target / MAX) * H}
                stroke="var(--fg-subtle)"
                strokeWidth={1.5}
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={line}
                fill="none"
                stroke="url(#fee-line)"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Latest value marker */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(lastX / W) * 100}%`, top: `${(lastY / H) * 100}%` }}
            >
              <span className="absolute bottom-full left-1/2 mb-3 -translate-x-[85%] whitespace-nowrap rounded-lg bg-navy-950 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-white dark:text-navy-950">
                {last.month}: ৳ {last.value}L
              </span>
              <span className="block h-4 w-4 rounded-full border-[3px] border-surface bg-violet-600 shadow-[0_0_0_4px_rgb(124_58_237/0.2)]" />
            </div>
          </div>
        </div>

        <div className="ml-9 mt-3 flex justify-between text-[11px] font-medium text-fg-subtle">
          {data.map((d) => (
            <span key={d.month}>{d.month}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
