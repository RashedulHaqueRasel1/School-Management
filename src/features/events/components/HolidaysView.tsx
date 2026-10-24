"use client";

import { CalendarHeart, Landmark, Pencil, School, Umbrella, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WEEKEND_DAYS, weekdayOf } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { useCalendar } from "../hooks/use-calendar";
import { useEventsUi } from "../store/events-ui.store";
import { MONTH_NAMES, datesOf, whenLabel } from "../utils";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The year's holidays — government (fixed) and school (editable) — and how many
 * school days they close. BACKEND: GET /calendar/holidays?year=
 */
export function HolidaysView() {
  const { items, hydrated, today } = useCalendar();
  const open = useEventsUi((s) => s.open);
  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-soft" />;

  const year = today.slice(0, 4);
  const holidays = items.filter((i) => i.closed && i.startDate.startsWith(year));
  const closedOn = (list: typeof holidays) => new Set(list.flatMap((h) => datesOf(h)).filter((d) => d.startsWith(year) && !WEEKEND_DAYS.includes(weekdayOf(d)))).size;
  const govt = holidays.filter((h) => h.source === "government");
  const school = holidays.filter((h) => h.source === "school");
  const next = holidays.find((h) => h.endDate >= today);
  const daysTo = next ? Math.max(0, Math.round((Date.parse(next.startDate) - Date.parse(today)) / 86_400_000)) : 0;

  const tiles: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "School days closed", value: String(closedOn(holidays)), hint: `In ${year}, besides Fridays`, icon: Umbrella, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Government holidays", value: String(govt.length), hint: `${closedOn(govt)} school days`, icon: Landmark, accent: "bg-sky-50 text-sky-600" },
    { label: "School holidays", value: String(school.length), hint: `${closedOn(school)} school days`, icon: School, accent: "bg-violet-50 text-violet-600" },
    { label: "Next holiday", value: next ? (daysTo === 0 ? "Today" : `${daysTo} days`) : "—", hint: next ? next.title : "None left this year", icon: CalendarHeart, accent: "bg-amber-50 text-amber-600" },
  ];
  const months = [...new Set(holidays.map((h) => h.startDate.slice(0, 7)))];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, hint, icon: Icon, accent }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-2xl font-bold tabular-nums text-fg">{value}</p>
              <p className="truncate text-xs text-fg-subtle">{hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3 sm:px-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Holiday list {year}</h2>
            <p className="text-xs text-fg-muted">Closed days show as “Holiday” in attendance, and exam papers skip them.</p>
          </div>
          <Button size="sm" onClick={() => open({ mode: "new", category: "Holiday" })}>
            <Umbrella className="h-3.5 w-3.5" />
            Add school holiday
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-y border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="px-5 py-2 sm:px-6">Holiday</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2 text-center">School days</th>
                <th className="px-3 py-2">Type</th>
                <th className="w-12 px-5 py-2 sm:px-6" />
              </tr>
            </thead>
            {months.map((m) => (
              <tbody key={m} className="divide-y divide-line">
                <tr className="bg-subtle/30">
                  <td colSpan={6} className="px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-fg-subtle sm:px-6">
                    {MONTH_NAMES[Number(m.slice(5)) - 1]}
                  </td>
                </tr>
                {holidays
                  .filter((h) => h.startDate.startsWith(m))
                  .map((h) => {
                    const past = h.endDate < today;
                    return (
                      <tr key={h.id} className={cn("transition hover:bg-subtle/50", past && "text-fg-muted")}>
                        <td className="px-5 py-3 sm:px-6">
                          <button type="button" onClick={() => open({ mode: "view", id: h.id })} className={cn("text-left font-medium hover:text-indigo-600", past ? "text-fg-secondary" : "text-fg")}>
                            {h.title}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-fg-secondary">{whenLabel(h).replace(" · All day", "")}</td>
                        <td className="px-3 py-3 text-fg-muted">{h.startDate === h.endDate ? WEEKDAY[weekdayOf(h.startDate)] : `${WEEKDAY[weekdayOf(h.startDate)]} – ${WEEKDAY[weekdayOf(h.endDate)]}`}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{closedOn([h]) || <span className="text-fg-subtle">Friday</span>}</td>
                        <td className="px-3 py-3">
                          {h.source === "government" ? (
                            <Badge tone="info">
                              <Landmark className="h-3 w-3" /> Government
                            </Badge>
                          ) : (
                            <Badge tone="violet">
                              <School className="h-3 w-3" /> School
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right sm:px-6">
                          {h.source === "school" && (
                            <button type="button" onClick={() => open({ mode: "edit", id: h.id })} aria-label={`Edit ${h.title}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-fg">
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            ))}
          </table>
        </div>
      </Card>
    </div>
  );
}
