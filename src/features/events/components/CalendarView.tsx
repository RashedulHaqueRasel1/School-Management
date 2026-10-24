"use client";

import { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Umbrella } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addDaysIso, holidayName, weekdayOf, WEEKEND_DAYS } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { useCalendar } from "../hooks/use-calendar";
import { useEventsUi } from "../store/events-ui.store";
import type { CalendarItem, EventCategory } from "../types/types";
import { CATEGORIES, CATEGORY_STYLE, MONTH_NAMES, time12, whenLabel } from "../utils";

/** Week starts on Saturday (Friday is the weekly holiday). */
const WEEK = [6, 0, 1, 2, 3, 4, 5];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const shiftMonth = (m: string, by: number) => {
  const [y, mm] = m.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, mm - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};

/**
 * Month calendar of events, exams and holidays with a day panel.
 * BACKEND: GET /calendar?month=YYYY-MM
 */
export function CalendarView() {
  const { items, hydrated, today } = useCalendar();
  const open = useEventsUi((s) => s.open);
  const picked = useEventsUi((s) => s.month);
  const setMonth = useEventsUi((s) => s.setMonth);
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState<EventCategory[]>([]);
  if (!hydrated) return <div className="h-[640px] animate-pulse rounded-2xl bg-soft" />;

  const month = picked ?? today.slice(0, 7);
  const day = selected && selected.startsWith(month) ? selected : month === today.slice(0, 7) ? today : `${month}-01`;
  const first = `${month}-01`;
  const lead = WEEK.indexOf(weekdayOf(first));
  const start = addDaysIso(first, -lead);
  const cells = Array.from({ length: 42 }, (_, i) => addDaysIso(start, i));
  const rows = cells.slice(35).every((d) => !d.startsWith(month)) ? cells.slice(0, 35) : cells;
  const visible = items.filter((i) => !hidden.includes(i.category));
  const on = (d: string) => visible.filter((i) => i.startDate <= d && i.endDate >= d);
  const dayItems = on(day);
  const monthItems = visible.filter((i) => i.startDate <= `${month}-31` && i.endDate >= first);
  const upcoming = visible.filter((i) => i.endDate >= today).slice(0, 6);
  const closedDays = rows.filter((d) => d.startsWith(month) && !WEEKEND_DAYS.includes(weekdayOf(d)) && holidayName(d)).length;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4 sm:px-5">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-fg">
            {MONTH_NAMES[Number(month.slice(5)) - 1]} {month.slice(0, 4)}
          </h2>
          {month !== today.slice(0, 7) && (
            <Button variant="ghost" size="sm" onClick={() => (setMonth(null), setSelected(today))}>
              Today
            </Button>
          )}
          <p className="ml-auto text-xs text-fg-muted">
            {monthItems.length} item(s) · {closedDays} holiday(s) on school days
          </p>
        </div>

        <div className="grid grid-cols-7 border-b border-line bg-subtle/60 text-center text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          {WEEK.map((w) => (
            <div key={w} className={cn("py-2", WEEKEND_DAYS.includes(w) && "text-rose-500")}>
              {DAY_SHORT[w]}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {rows.map((d) => {
            const inMonth = d.startsWith(month);
            const list = on(d);
            const weekend = WEEKEND_DAYS.includes(weekdayOf(d));
            const holiday = holidayName(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                onDoubleClick={() => open({ mode: "new", date: d })}
                className={cn(
                  "group relative flex min-h-24 flex-col gap-1 border-b border-r border-line p-1.5 text-left transition hover:bg-subtle/70 sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-subtle/40",
                  weekend && inMonth && "bg-rose-50/40 dark:bg-rose-500/5",
                  holiday && inMonth && "bg-emerald-50/60 dark:bg-emerald-500/5",
                  d === day && "ring-2 ring-inset ring-indigo-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    d === today ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white" : inMonth ? (weekend ? "text-rose-500" : "text-fg") : "text-fg-subtle",
                  )}
                >
                  {Number(d.slice(8))}
                </span>
                <span className="flex flex-col gap-0.5">
                  {list.slice(0, 3).map((i) => (
                    <span key={i.id} className={cn("truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight", CATEGORY_STYLE[i.category].chip, !inMonth && "opacity-60")} title={i.title}>
                      {i.startDate === d || d === start || d.endsWith("-01") ? i.title : `↳ ${i.title}`}
                    </span>
                  ))}
                  {list.length > 3 && <span className="px-1 text-[10px] font-medium text-fg-muted">+{list.length - 3} more</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-line p-4 sm:px-5">
          {CATEGORIES.map((c) => {
            const off = hidden.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={!off}
                onClick={() => setHidden((h) => (off ? h.filter((x) => x !== c) : [...h, c]))}
                className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition", off ? "border-line text-fg-subtle line-through" : "border-line-strong text-fg-secondary hover:bg-soft")}
              >
                <span className={cn("h-2 w-2 rounded-full", CATEGORY_STYLE[c].dot, off && "opacity-40")} />
                {c}
              </button>
            );
          })}
          <span className="ml-auto self-center text-[11px] text-fg-subtle">Double-click a day to add an event</span>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">{day === today ? "Today" : new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })}</p>
              <h2 className="text-lg font-bold tracking-tight text-fg">{new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => open({ mode: "new", date: day })}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {holidayName(day) ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <Umbrella className="h-4 w-4" /> School closed · {holidayName(day)}
            </p>
          ) : WEEKEND_DAYS.includes(weekdayOf(day)) ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">Weekly holiday</p>
          ) : null}
          {dayItems.length === 0 ? (
            <p className="mt-3 rounded-xl bg-subtle py-6 text-center text-sm text-fg-muted">Nothing on this day.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {dayItems.map((i) => (
                <ItemRow key={i.id} item={i} onOpen={() => open({ mode: "view", id: i.id })} />
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <CalendarClock className="h-4 w-4 text-fg-muted" />
            Coming up
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">Nothing coming up.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((i) => (
                <ItemRow key={i.id} item={i} onOpen={() => open({ mode: "view", id: i.id })} showDate />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function ItemRow({ item: i, onOpen, showDate }: { item: CalendarItem; onOpen: () => void; showDate?: boolean }) {
  const style = CATEGORY_STYLE[i.category];
  const Icon = style.icon;
  return (
    <li>
      <button type="button" onClick={onOpen} className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-subtle">
        {showDate ? (
          <span className={cn("flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl", style.tile)}>
            <span className="text-[9px] font-semibold uppercase leading-none">{MONTH_NAMES[Number(i.startDate.slice(5, 7)) - 1]!.slice(0, 3)}</span>
            <span className="text-sm font-bold leading-tight">{Number(i.startDate.slice(8))}</span>
          </span>
        ) : (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", style.tile)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{i.title}</span>
          <span className="block truncate text-xs text-fg-muted">{showDate ? whenLabel(i) : i.startTime ? `${time12(i.startTime)}${i.location ? ` · ${i.location}` : ""}` : i.closed ? "School closed" : "All day"}</span>
        </span>
        <Badge tone={style.tone}>{i.category}</Badge>
      </button>
    </li>
  );
}
