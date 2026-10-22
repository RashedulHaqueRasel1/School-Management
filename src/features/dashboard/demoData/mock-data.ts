import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Megaphone,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import type {
  Admission,
  AttendanceSummary,
  MonthlyValue,
  Notice,
  QuickAction,
  SchoolEvent,
  Stat,
  TopPerformer,
} from "../types/types";

// Static placeholder data for the layout. Replace with TanStack Query hooks
// (features/dashboard/hooks) once the backend API exists.

export const stats: Stat[] = [
  {
    id: "students",
    label: "Total Students",
    value: "1,248",
    change: "+4.2%",
    trend: "up",
    icon: GraduationCap,
    accent: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    color: "#6366f1",
    series: [980, 1010, 1040, 1035, 1090, 1120, 1150, 1190, 1215, 1248],
  },
  {
    id: "teachers",
    label: "Total Teachers",
    value: "86",
    change: "+2.4%",
    trend: "up",
    icon: Users,
    accent: "bg-sky-50 text-sky-600 ring-sky-100",
    color: "#0ea5e9",
    series: [78, 79, 79, 80, 82, 81, 83, 84, 84, 86],
  },
  {
    id: "admissions",
    label: "New Admissions",
    value: "42",
    change: "+12%",
    trend: "up",
    icon: UserPlus,
    accent: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    color: "#10b981",
    series: [18, 22, 20, 27, 25, 31, 29, 35, 38, 42],
  },
  {
    id: "fees",
    label: "Fees Collected",
    value: "৳ 8.4L",
    change: "-3.1%",
    trend: "down",
    icon: Wallet,
    accent: "bg-amber-50 text-amber-600 ring-amber-100",
    color: "#f59e0b",
    series: [7.1, 6.8, 8.4, 7.9, 9.2, 8.6, 9.8, 9.1, 8.7, 8.4],
  },
];

/** Monthly fee collection in lakh taka (current academic year). */
export const feeCollection: MonthlyValue[] = [
  { month: "Jan", value: 6.2 },
  { month: "Feb", value: 7.1 },
  { month: "Mar", value: 6.8 },
  { month: "Apr", value: 8.4 },
  { month: "May", value: 7.9 },
  { month: "Jun", value: 9.2 },
  { month: "Jul", value: 8.6 },
  { month: "Aug", value: 9.8 },
  { month: "Sep", value: 9.1 },
  { month: "Oct", value: 8.4 },
];

export const feeTarget = 9;

export const attendanceSummary: AttendanceSummary = {
  segments: [
    { label: "Present", count: 1153, color: "#6366f1" },
    { label: "Late", count: 38, color: "#f59e0b" },
    { label: "Absent", count: 57, color: "#f43f5e" },
  ],
  students: { present: 1153, total: 1248 },
  staff: { present: 81, total: 86 },
};

export const recentAdmissions: Admission[] = [
  { id: "ADM-1042", name: "Ayesha Rahman", className: "Class 6 - A", guardian: "Mizanur Rahman", date: "Oct 21, 2026", status: { label: "Approved", tone: "success" } },
  { id: "ADM-1041", name: "Tanvir Hasan", className: "Class 9 - B", guardian: "Kamrul Hasan", date: "Oct 20, 2026", status: { label: "Pending", tone: "warning" } },
  { id: "ADM-1040", name: "Nusrat Jahan", className: "Class 3 - A", guardian: "Shirin Akter", date: "Oct 19, 2026", status: { label: "In Review", tone: "info" } },
  { id: "ADM-1039", name: "Arif Chowdhury", className: "Class 7 - C", guardian: "Faruk Chowdhury", date: "Oct 18, 2026", status: { label: "Rejected", tone: "danger" } },
  { id: "ADM-1038", name: "Sadia Islam", className: "Class 1 - B", guardian: "Rafiqul Islam", date: "Oct 18, 2026", status: { label: "Approved", tone: "success" } },
];

export const upcomingEvents: SchoolEvent[] = [
  { id: "e1", title: "Half-Yearly Examinations", time: "9:00 AM · All classes", day: "27", month: "Oct", type: "Exam" },
  { id: "e2", title: "Parent–Teacher Meeting", time: "10:30 AM · Main Hall", day: "02", month: "Nov", type: "Event" },
  { id: "e3", title: "Annual Sports Day", time: "8:00 AM · Playground", day: "12", month: "Nov", type: "Event" },
  { id: "e4", title: "Victory Day", time: "School closed", day: "16", month: "Dec", type: "Holiday" },
];

export const latestNotices: Notice[] = [
  { id: "n1", title: "Half-yearly exam routine published", audience: "Students & Parents", postedAt: "2h ago", category: { label: "Exam", tone: "warning" } },
  { id: "n2", title: "Staff meeting on Thursday at 2:00 PM", audience: "Teachers", postedAt: "Yesterday", category: { label: "Staff", tone: "info" } },
  { id: "n3", title: "Tuition fee deadline extended to Oct 31", audience: "Parents", postedAt: "2 days ago", category: { label: "Finance", tone: "success" } },
  { id: "n4", title: "Winter uniform mandatory from Nov 15", audience: "All", postedAt: "3 days ago", category: { label: "General", tone: "neutral" } },
];

export const topPerformers: TopPerformer[] = [
  { name: "Raihan Kabir", className: "Class 10 - A", gpa: 5.0 },
  { name: "Mehjabin Sultana", className: "Class 10 - B", gpa: 4.94 },
  { name: "Fahim Ahmed", className: "Class 9 - A", gpa: 4.89 },
  { name: "Tasnim Akter", className: "Class 8 - A", gpa: 4.81 },
];

export const quickActions: QuickAction[] = [
  { label: "Add Student", href: "/students", icon: GraduationCap, accent: "bg-indigo-50 text-indigo-600" },
  { label: "Take Attendance", href: "/attendance", icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
  { label: "Collect Fee", href: "/fees", icon: Wallet, accent: "bg-amber-50 text-amber-600" },
  { label: "Create Exam", href: "/examinations", icon: ClipboardList, accent: "bg-sky-50 text-sky-600" },
  { label: "Post Notice", href: "/notices", icon: Megaphone, accent: "bg-rose-50 text-rose-600" },
  { label: "Reports", href: "/reports", icon: BarChart3, accent: "bg-violet-50 text-violet-600" },
];
