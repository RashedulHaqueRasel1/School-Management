"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Armchair,
  ArrowLeft,
  Ban,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  ClipboardList,
  DoorOpen,
  FileCheck2,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  NotebookPen,
  Printer,
  Settings2,
  ShieldCheck,
  Target,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { ProfileHero } from "@/components/shared/ProfileHero";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACADEMIC_SESSION } from "@/features/admissions/constants";
import { formatDate } from "@/features/admissions/utils";
import { minutesToTime } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { useExam } from "../../hooks/use-exam";
import type { ExamSummary } from "../../hooks/use-exams";
import { STATUS_STYLE, examHref, sortClasses, type ExamTab } from "../../utils";

type TabDef = { tab?: ExamTab; label: string; icon: LucideIcon };

const TABS: TabDef[] = [
  { label: "Overview", icon: LayoutDashboard },
  { tab: "schedule", label: "Schedule", icon: CalendarDays },
  { tab: "seating", label: "Seat plan", icon: Armchair },
  { tab: "admit-cards", label: "Admit cards", icon: IdCard },
  { tab: "results", label: "Results", icon: FileCheck2 },
  { tab: "settings", label: "Settings", icon: Settings2 },
];

const RIBBON_ICON: Record<ExamSummary["status"], LucideIcon> = { scheduled: CalendarCheck2, ongoing: Timer, completed: NotebookPen, published: CheckCircle2, cancelled: Ban };

/** Header + tabs shared by every /examinations/[slug]/* page. */
export function ExamShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { exam, hydrated, candidates, plan } = useExam(slug);

  if (!hydrated) return <Skeleton />;
  if (!exam || !candidates || !plan) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="Exam not found"
          description="It may have been deleted, or the link is outdated."
          action={
            <Link href="/examinations" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All exams
            </Link>
          }
        />
      </Card>
    );
  }

  const style = STATUS_STYLE[exam.status];
  const first = exam.days[0] ?? exam.startDate;
  const withheld = candidates.filter((c) => !c.eligible).length;
  const seats = exam.rooms.reduce((s, r) => s + r.capacity, 0);
  const classes = sortClasses(exam.classes);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/examinations" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          All exams
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin view · full access
        </span>
      </div>

      <div className="print:hidden">
        <ProfileHero
          role="exam"
          avatar={
            <span className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl bg-rose-50 text-rose-700 sm:h-28 sm:w-28">
              <span className="text-xs font-bold uppercase tracking-widest">{formatDate(first).split(" ")[1]}</span>
              <span className="text-4xl font-black leading-none tracking-tight">{Number(first.slice(8))}</span>
              <span className="mt-1 text-[10px] font-semibold text-rose-500">{exam.days.length} days</span>
            </span>
          }
          name={exam.name}
          code={exam.type}
          ribbon={{ label: style.label, icon: RIBBON_ICON[exam.status], tone: style.ribbon }}
          badges={
            <>
              <Badge tone="info">{ACADEMIC_SESSION}</Badge>
              {exam.custom && <Badge tone="violet">Added by admin</Badge>}
              {exam.editedSchedule && <Badge tone="warning">Routine edited</Badge>}
              {withheld > 0 && exam.status !== "published" && <Badge tone="danger">{withheld} admit card(s) withheld</Badge>}
            </>
          }
          actions={
            <>
              <Link href={examHref(exam, "schedule")} className={buttonStyles({ variant: "outline" })}>
                <CalendarDays className="h-4 w-4" />
                Routine
              </Link>
              <Link href={examHref(exam, "admit-cards")} className={buttonStyles()}>
                <Printer className="h-4 w-4" />
                Admit cards
              </Link>
            </>
          }
          columns={[
            [
              { icon: CalendarRange, label: "Dates", value: `${formatDate(first)} – ${formatDate(exam.endDate)}` },
              { icon: Clock, label: "Papers start", value: minutesToTime(exam.startTime) },
              { icon: ClipboardList, label: "Session", value: ACADEMIC_SESSION },
            ],
            [
              { icon: GraduationCap, label: "Classes", value: classes.length > 4 ? `${classes[0]} – ${classes.at(-1)} (${classes.length})` : classes.join(", ") },
              { icon: NotebookPen, label: "Papers", value: `${exam.papers.length} papers` },
              { icon: Target, label: "Marks", value: `${exam.fullMarks} full · ${exam.passMarks} to pass` },
            ],
            [
              { icon: Users, label: "Candidates", value: `${candidates.length} students` },
              { icon: IdCard, label: "Admit cards", value: `${candidates.length - withheld} ready${withheld ? ` · ${withheld} withheld` : ""}` },
              { icon: FileCheck2, label: "Results", value: exam.status === "published" ? "Published" : exam.status === "completed" ? "Marks entry" : "After the exam" },
            ],
            [
              { icon: DoorOpen, label: "Rooms", value: `${exam.rooms.length} rooms` },
              { icon: Armchair, label: "Seats", value: `${seats} seats · ${plan.unseated.length ? `${plan.unseated.length} short` : "enough"}` },
              { icon: Timer, label: "Status", value: style.label },
            ],
          ]}
          footer={
            exam.cancelled && (
              <p className="text-sm text-fg-secondary">
                <span className="font-semibold text-fg">Cancelled.</span> {exam.cancelled.reason} — restore it from Settings.
              </p>
            )
          }
        />
      </div>

      <Suspense fallback={<TabsNav exam={exam} pathname="" />}>
        <ActiveTabsNav exam={exam} />
      </Suspense>

      {children}
    </div>
  );
}

function ActiveTabsNav(props: { exam: ExamSummary }) {
  return <TabsNav {...props} pathname={usePathname()} />;
}

function TabsNav({ exam, pathname }: { exam: ExamSummary; pathname: string }) {
  return (
    <nav aria-label="Exam pages" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ tab, label, icon: Icon }) => {
          const href = examHref(exam, tab);
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow" : "text-fg-muted hover:bg-soft hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {tab === "schedule" && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-soft text-fg-muted")}>{exam.papers.length}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading exam">
      <div className="h-5 w-28 animate-pulse rounded bg-soft" />
      <Card className="h-56 animate-pulse" />
      <div className="h-14 animate-pulse rounded-2xl bg-soft" />
      <Card className="h-80 animate-pulse" />
    </div>
  );
}
