import { Trophy } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { TopPerformer } from "../types/types";

const rankStyle = [
  "bg-linear-to-br from-amber-300 to-amber-500 text-white",
  "bg-linear-to-br from-slate-300 to-slate-400 text-white",
  "bg-linear-to-br from-orange-300 to-orange-500 text-white",
];

export function TopPerformers({ students }: { students: TopPerformer[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Highest GPA in the last exam</CardDescription>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Trophy className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {students.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                rankStyle[i] ?? "bg-soft text-fg-muted",
              )}
            >
              {i + 1}
            </span>
            <Avatar name={s.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{s.name}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-soft">
                <div
                  className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${(s.gpa / 5) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums text-fg">{s.gpa.toFixed(2)}</p>
              <p className="text-[11px] text-fg-subtle">{s.className}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
