import type { NoticeGroup } from "@/features/notices/types/types";

export type EventCategory = "Holiday" | "Academic" | "Exam" | "Sports" | "Cultural" | "Meeting" | "Trip" | "Other";

/** Where an item on the calendar comes from. */
export type EventSource = "school" | "government" | "exam";

export type SchoolEvent = {
  id: string;
  title: string;
  category: EventCategory;
  /** ISO dates, inclusive. */
  startDate: string;
  endDate: string;
  /** "HH:mm"; empty = all day. */
  startTime?: string;
  endTime?: string;
  location: string;
  groups: NoticeGroup[];
  /** Empty = every class. */
  classes: string[];
  description: string;
  createdAt: string;
  /** Created by an admin in the demo. */
  custom: boolean;
};

/** A calendar item: a school event, a government holiday or an exam (read-only). */
export type CalendarItem = SchoolEvent & {
  source: EventSource;
  /** Exam page for exam items. */
  href?: string;
  /** Closed for students (holidays). */
  closed: boolean;
};

export type EventDraft = Omit<SchoolEvent, "id" | "createdAt" | "custom">;
