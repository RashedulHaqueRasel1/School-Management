export type NoticeCategory = "General" | "Academic" | "Exam" | "Event" | "Holiday" | "Finance" | "Staff" | "Urgent";

export type NoticeGroup = "students" | "parents" | "teachers";

export type NoticePriority = "normal" | "important" | "urgent";

/** Derived: draft, publishAt in the future = scheduled, past expiry = expired. */
export type NoticeStatus = "draft" | "scheduled" | "published" | "expired" | "archived";

export type Notice = {
  id: string;
  /** "half-yearly-exam-routine" */
  slug: string;
  title: string;
  /** Plain text; blank lines separate paragraphs. */
  body: string;
  category: NoticeCategory;
  priority: NoticePriority;
  groups: NoticeGroup[];
  /** Empty = every class. */
  classes: string[];
  /** ISO date-time; null = draft. */
  publishAt: string | null;
  /** ISO date; hidden from the portal after it. */
  expiresOn?: string;
  pinned: boolean;
  archived: boolean;
  sms: boolean;
  email: boolean;
  attachment?: { name: string; size: number };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Created by an admin in the demo (not seeded). */
  custom: boolean;
};

export type NoticeDraft = Omit<Notice, "id" | "slug" | "createdBy" | "createdAt" | "updatedAt" | "custom" | "archived">;

export type NoticeFilters = { search: string; status: NoticeStatus | "all"; category: NoticeCategory | "all"; group: NoticeGroup | "all" };
