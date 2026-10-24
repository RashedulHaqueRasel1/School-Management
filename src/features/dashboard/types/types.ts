import type { LucideIcon } from "lucide-react";

import type { BadgeTone } from "@/components/ui/badge";

export type Stat = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  /** Tailwind classes for the icon tile. */
  accent: string;
  /** Hex colour for the sparkline. */
  color: string;
  series: number[];
};

export type Admission = {
  id: string;
  name: string;
  className: string;
  guardian: string;
  date: string;
  status: { label: string; tone: BadgeTone };
};

export type SchoolEvent = {
  id: string;
  title: string;
  time: string;
  day: string;
  month: string;
  type: "Event" | "Holiday" | "Exam";
};

export type Notice = {
  id: string;
  title: string;
  audience: string;
  postedAt: string;
  category: { label: string; tone: BadgeTone };
  /** Link to the full notice. */
  href?: string;
};

export type MonthlyValue = {
  month: string;
  value: number;
};

export type AttendanceSegment = {
  label: string;
  count: number;
  color: string;
};

export type AttendanceSummary = {
  segments: AttendanceSegment[];
  students: { present: number; total: number };
  staff: { present: number; total: number };
};

export type TopPerformer = {
  name: string;
  className: string;
  gpa: number;
};

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};
