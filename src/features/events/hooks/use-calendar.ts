"use client";

import { useMemo } from "react";

import { useExams } from "@/features/examinations/hooks/use-exams";
import { examHref } from "@/features/examinations/utils";
import { localToday } from "@/features/students/demoData/profile-data";

import { demoEvents, governmentHolidays } from "../demoData/mock-data";
import { useEventAdminHydrated, useEventAdminStore } from "../store/event-admin.store";
import type { CalendarItem, SchoolEvent } from "../types/types";

const ALL = ["students", "parents", "teachers"] as const;

/** School events (demo + admin) without the read-only items. */
export function useSchoolEvents() {
  const hydrated = useEventAdminHydrated();
  const added = useEventAdminStore((s) => s.added);
  const edits = useEventAdminStore((s) => s.edits);
  const deleted = useEventAdminStore((s) => s.deleted);
  const events = useMemo<SchoolEvent[]>(() => {
    if (!hydrated) return [];
    return [...demoEvents(localToday()).map((e) => ({ ...e, ...edits[e.id] })), ...added].filter((e) => !deleted.includes(e.id));
  }, [hydrated, added, edits, deleted]);
  return { events, hydrated };
}

/**
 * Everything on the school calendar: school events, government holidays and
 * exams (from Examinations). TODO (backend phase): GET /calendar?from=&to=
 */
export function useCalendar() {
  const { events, hydrated: eventsReady } = useSchoolEvents();
  const { exams, hydrated: examsReady } = useExams();
  const hydrated = eventsReady && examsReady;

  const items = useMemo<CalendarItem[]>(() => {
    if (!hydrated) return [];
    const school: CalendarItem[] = events.map((e) => ({ ...e, source: "school", closed: e.category === "Holiday" }));
    const government: CalendarItem[] = governmentHolidays().map((h, i) => ({
      id: `GOV-${i}`,
      title: h.title,
      category: "Holiday",
      startDate: h.startDate,
      endDate: h.endDate,
      location: "",
      groups: [...ALL],
      classes: [],
      description: "Government public holiday — the school is closed.",
      createdAt: "",
      custom: false,
      source: "government",
      closed: true,
    }));
    const examItems: CalendarItem[] = exams
      .filter((e) => e.status !== "cancelled" && e.days.length)
      .map((e) => ({
        id: `EXM-${e.id}`,
        title: e.name,
        category: "Exam",
        startDate: e.days[0]!,
        endDate: e.endDate,
        startTime: `${String(Math.floor(e.startTime / 60)).padStart(2, "0")}:${String(e.startTime % 60).padStart(2, "0")}`,
        location: `${e.papers.length} papers · ${e.classes.length} classes`,
        groups: ["students", "parents", "teachers"],
        classes: e.classes.length > 12 ? [] : e.classes,
        description: `${e.type} exam. Routine, seat plan and admit cards are in Examinations.`,
        createdAt: "",
        custom: false,
        source: "exam",
        href: examHref(e),
        closed: false,
      }));
    return [...school, ...government, ...examItems].sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  }, [hydrated, events, exams]);

  return { items, hydrated, today: hydrated ? localToday() : "" };
}
