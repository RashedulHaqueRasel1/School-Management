import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Sparkline } from "@/components/shared/Sparkline";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Stat } from "../types/types";

export function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  const up = stat.trend === "up";
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset", stat.accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold",
            up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {stat.change}
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-fg-muted">{stat.label}</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-fg">
          {stat.value}
        </p>
        <Sparkline data={stat.series} color={stat.color} id={`spark-${stat.id}`} className="h-10 w-28" />
      </div>
      <p className="mt-3 text-xs text-fg-subtle">Compared to last month</p>
    </Card>
  );
}
