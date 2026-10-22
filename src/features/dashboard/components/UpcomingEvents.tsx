import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { SchoolEvent } from "../types/types";

const typeStyle: Record<SchoolEvent["type"], { tone: BadgeTone; tile: string }> = {
  Event: { tone: "info", tile: "bg-indigo-50 text-indigo-700" },
  Holiday: { tone: "success", tile: "bg-emerald-50 text-emerald-700" },
  Exam: { tone: "warning", tile: "bg-amber-50 text-amber-700" },
};

export function UpcomingEvents({ events }: { events: SchoolEvent[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next on the school calendar</CardDescription>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Calendar <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((e) => {
          const style = typeStyle[e.type];
          return (
            <div
              key={e.id}
              className="-mx-2 flex items-center gap-4 rounded-xl p-2 transition hover:bg-subtle"
            >
              <div className={cn("flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-xl", style.tile)}>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{e.month}</span>
                <span className="text-lg font-bold leading-none">{e.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{e.title}</p>
                <p className="mt-0.5 truncate text-xs text-fg-muted">{e.time}</p>
              </div>
              <Badge tone={style.tone}>{e.type}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
