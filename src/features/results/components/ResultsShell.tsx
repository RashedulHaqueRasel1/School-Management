"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, PenLine, Table2, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/features/admissions/utils";
import { STATUS_STYLE, examHref } from "@/features/examinations/utils";
import { cn } from "@/lib/utils";

import { useResults } from "../hooks/use-results";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/results", label: "Overview", icon: LayoutDashboard },
  { href: "/results/marks", label: "Mark entry", icon: PenLine },
  { href: "/results/tabulation", label: "Tabulation sheet", icon: Table2 },
];

/** Page header, tabs and the exam / class picker for every /results/* page. */
export function ResultsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Results" description="Enter marks, check the tabulation sheet, publish results and print report cards — for every exam and class." />
      <Suspense fallback={<TabsNav pathname="" />}>
        <ActiveTabs />
      </Suspense>
      <Suspense fallback={<div className="h-[74px] animate-pulse rounded-2xl bg-soft" />}>
        <Picker />
      </Suspense>
      {children}
    </div>
  );
}

function ActiveTabs() {
  return <TabsNav pathname={usePathname()} />;
}

function TabsNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Results pages" className="-mx-1 -mt-2 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow" : "text-fg-muted hover:bg-soft hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Picker() {
  const pathname = usePathname();
  const { exams, exam, classes, className, hydrated, setExam, setClass } = useResults();
  const overview = pathname === "/results";

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-[74px] animate-pulse rounded-2xl bg-soft" />
        <div className="h-96 animate-pulse rounded-2xl bg-soft" />
      </div>
    );
  }
  if (!exam) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No exam has been held yet"
          description="Results appear here once an exam starts. Plan one in Examinations."
          action={
            <Link href="/examinations" className={buttonStyles({ variant: "outline" })}>
              Open Examinations
            </Link>
          }
        />
      </Card>
    );
  }

  const style = STATUS_STYLE[exam.status];
  return (
    <Card className="flex flex-col gap-3 p-4 sm:px-5 lg:flex-row lg:items-center print:hidden">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select aria-label="Exam" value={exam.id} onChange={(e) => setExam(e.target.value)} className="sm:w-60">
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Class" value={className ?? (overview ? "all" : classes[0])} onChange={(e) => setClass(e.target.value === "all" ? null : e.target.value)} className="sm:w-44">
            {overview && <option value="all">All classes</option>}
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <p className="flex flex-1 flex-wrap items-center gap-2 text-sm text-fg-secondary">
          <Badge tone={style.tone} dot>
            {style.label}
          </Badge>
          <span>
            {exam.type} · {formatDate(exam.days[0] ?? exam.startDate)} – {formatDate(exam.endDate)}
          </span>
        </p>
        <Link href={examHref(exam)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
          Exam details →
        </Link>
    </Card>
  );
}
