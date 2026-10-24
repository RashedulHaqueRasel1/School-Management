"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { GROUP_LABEL } from "@/features/notices/utils";
import { cn } from "@/lib/utils";

import { useCalendar } from "../hooks/use-calendar";
import { useEventsUi } from "../store/events-ui.store";
import type { EventCategory } from "../types/types";
import { CATEGORIES, CATEGORY_STYLE, MONTH_NAMES, dayCount, whenLabel } from "../utils";

type Period = "upcoming" | "past" | "all";

/** Every calendar item as a searchable agenda, grouped by month. BACKEND: GET /calendar?from=&to=&category=&q= */
export function EventsListView() {
  const { items, hydrated, today } = useCalendar();
  const open = useEventsUi((s) => s.open);
  const [period, setPeriod] = useState<Period>("upcoming");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter(
      (i) =>
        (period === "all" || (period === "upcoming" ? i.endDate >= today : i.endDate < today)) &&
        (category === "all" || i.category === category) &&
        (!q || [i.title, i.description, i.location].some((v) => v.toLowerCase().includes(q))),
    );
    return period === "past" ? list.reverse() : list;
  }, [items, period, category, search, today]);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-soft" />;

  const months = [...new Set(visible.map((i) => i.startDate.slice(0, 7)))];
  const counts = { upcoming: items.filter((i) => i.endDate >= today).length, past: items.filter((i) => i.endDate < today).length, all: items.length };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex gap-1">
          {(["upcoming", "past", "all"] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={cn("flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold capitalize transition", period === p ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}>
              {p}
              <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", period === p ? "bg-surface/20" : "bg-soft")}>{counts[p]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, places..."
            aria-label="Search events"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
        <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as EventCategory | "all")} className="lg:w-44">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarDays} title="No events found" description="Try another period, category or search." />
        </Card>
      ) : (
        months.map((m) => (
          <section key={m}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-fg-subtle">
              {MONTH_NAMES[Number(m.slice(5)) - 1]} {m.slice(0, 4)}
            </h2>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {visible
                .filter((i) => i.startDate.startsWith(m))
                .map((i) => {
                  const style = CATEGORY_STYLE[i.category];
                  const Icon = style.icon;
                  const live = i.startDate <= today && i.endDate >= today;
                  return (
                    <button key={i.id} type="button" onClick={() => open({ mode: "view", id: i.id })} className={cn("flex items-start gap-4 rounded-2xl border bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover", live ? "border-indigo-300" : "border-line", i.endDate < today && "opacity-75")}>
                      <span className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl", style.tile)}>
                        <span className="text-[10px] font-semibold uppercase leading-none">{new Date(`${i.startDate}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</span>
                        <span className="text-xl font-bold leading-tight">{Number(i.startDate.slice(8))}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={style.tone}>
                            <Icon className="h-3 w-3" />
                            {i.category}
                          </Badge>
                          {live && <Badge tone="info" dot>Happening now</Badge>}
                          {i.source === "government" && <Badge tone="neutral">Government</Badge>}
                          {dayCount(i) > 1 && <span className="text-[11px] font-medium text-fg-muted">{dayCount(i)} days</span>}
                        </span>
                        <span className="mt-1 block font-semibold leading-snug text-fg">{i.title}</span>
                        <span className="mt-0.5 block text-xs text-fg-muted">{whenLabel(i)}</span>
                        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted">
                          {i.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {i.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {i.groups.length === 3 ? "Everyone" : i.groups.map((g) => GROUP_LABEL[g]).join(" & ")}
                            {i.classes.length > 0 && ` · ${i.classes.length > 2 ? `${i.classes.length} classes` : i.classes.join(", ")}`}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
