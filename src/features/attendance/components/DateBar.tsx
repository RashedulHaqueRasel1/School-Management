"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/features/admissions/utils";
import { WEEKDAY_NAMES, addDaysIso, holidayName, weekdayOf } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

/** Day picker shared by the registers (date is kept while switching tabs). */
export function DateBar({ date, today, onChange, children }: { date: string; today: string; onChange: (date: string | null) => void; children?: React.ReactNode }) {
  const holiday = holidayName(date);
  return (
    <Card className="flex flex-col gap-3 p-4 sm:px-5 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onChange(addDaysIso(date, -1))} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label="Date"
          className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-fg shadow-card focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
        <Button variant="outline" size="icon" onClick={() => onChange(addDaysIso(date, 1))} disabled={date >= today} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
        {date !== today && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Today
          </Button>
        )}
      </div>
      <p className="flex-1 text-sm text-fg-secondary">
        <span className="font-semibold text-fg">
          {WEEKDAY_NAMES[weekdayOf(date)]}, {formatDate(date)}
        </span>
        {date === today && <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">Today</span>}
        {holiday && <span className={cn("ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700")}>Holiday · {holiday}</span>}
      </p>
      {children}
    </Card>
  );
}
