"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, CalendarCheck, LayoutDashboard, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/attendance", label: "Daily overview", icon: LayoutDashboard },
  { href: "/attendance/students", label: "Student register", icon: CalendarCheck },
  { href: "/attendance/staff", label: "Staff register", icon: BriefcaseBusiness },
  { href: "/attendance/reports", label: "Monthly reports", icon: BarChart3 },
];

/** Page header + tabs for every /attendance/* page. */
export function AttendanceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Attendance" description="School-wide attendance for students and staff — take registers, follow up absences and see monthly reports." />
      <Suspense fallback={<TabsNav pathname="" />}>
        <ActiveTabs />
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
    <nav aria-label="Attendance pages" className="-mx-1 -mt-2 overflow-x-auto px-1 [scrollbar-width:none]">
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
