import { BookOpen, CalendarHeart, ClipboardList, Megaphone, PartyPopper, Siren, Users, Wallet, type LucideIcon } from "lucide-react";

import type { BadgeTone } from "@/components/ui/badge";

import type { Notice, NoticeCategory, NoticeGroup, NoticeStatus } from "./types/types";

export const CATEGORIES: NoticeCategory[] = ["General", "Academic", "Exam", "Event", "Holiday", "Finance", "Staff", "Urgent"];

export const CATEGORY_STYLE: Record<NoticeCategory, { icon: LucideIcon; tone: BadgeTone; tile: string; bar: string }> = {
  General: { icon: Megaphone, tone: "neutral", tile: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300", bar: "bg-slate-400" },
  Academic: { icon: BookOpen, tone: "info", tile: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
  Exam: { icon: ClipboardList, tone: "warning", tile: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  Event: { icon: PartyPopper, tone: "violet", tile: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  Holiday: { icon: CalendarHeart, tone: "info", tile: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  Finance: { icon: Wallet, tone: "success", tile: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  Staff: { icon: Users, tone: "neutral", tile: "bg-teal-50 text-teal-600", bar: "bg-teal-500" },
  Urgent: { icon: Siren, tone: "danger", tile: "bg-rose-50 text-rose-600", bar: "bg-rose-500" },
};

export const STATUS_STYLE: Record<NoticeStatus, { label: string; tone: BadgeTone }> = {
  published: { label: "Published", tone: "success" },
  scheduled: { label: "Scheduled", tone: "info" },
  draft: { label: "Draft", tone: "neutral" },
  expired: { label: "Expired", tone: "warning" },
  archived: { label: "Archived", tone: "neutral" },
};

export const GROUP_LABEL: Record<NoticeGroup, string> = { students: "Students", parents: "Parents", teachers: "Teachers" };

export const noticeHref = (n: Pick<Notice, "slug">, edit = false) => `/notices/${n.slug}${edit ? "/edit" : ""}`;
export const noticePrintHref = (n: Pick<Notice, "slug">) => `/notice-print/${n.slug}`;

export function noticeStatus(n: Pick<Notice, "archived" | "publishAt" | "expiresOn">, now: string): NoticeStatus {
  if (n.archived) return "archived";
  if (!n.publishAt) return "draft";
  if (n.publishAt > now) return "scheduled";
  if (n.expiresOn && n.expiresOn < now.slice(0, 10)) return "expired";
  return "published";
}

export function audienceLabel(n: Pick<Notice, "groups" | "classes">) {
  const groups = n.groups.length === 3 ? "Everyone" : n.groups.map((g) => GROUP_LABEL[g]).join(" & ");
  if (!n.classes.length) return groups;
  const classes = n.classes.length > 3 ? `${n.classes.length} classes` : n.classes.join(", ");
  return `${groups} · ${classes}`;
}

/** "2h ago", "Yesterday", "in 3 days", "12 Oct 2026". */
export function relativeTime(iso: string, now: string) {
  const diff = (Date.parse(now) - Date.parse(iso)) / 60_000;
  const abs = Math.abs(diff);
  const future = diff < 0;
  if (abs < 1) return "just now";
  if (abs < 60) return future ? `in ${Math.max(1, Math.round(abs))} min` : `${Math.max(1, Math.round(abs))} min ago`;
  if (abs < 60 * 24) return future ? `in ${Math.round(abs / 60)}h` : `${Math.round(abs / 60)}h ago`;
  const days = Math.round(abs / 1440);
  if (days === 1) return future ? "Tomorrow" : "Yesterday";
  if (days < 7) return future ? `in ${days} days` : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Local "YYYY-MM-DDTHH:mm:ss" for now (matches how publish times are stored). */
export function nowIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
