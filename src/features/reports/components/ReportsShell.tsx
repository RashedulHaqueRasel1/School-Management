"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, GraduationCap, LayoutDashboard, Printer, Wallet, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ACADEMIC_SESSION, SCHOOL_INFO } from "@/features/admissions/constants";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/reports", label: "Overview", icon: LayoutDashboard },
  { href: "/reports/academic", label: "Academic", icon: GraduationCap },
  { href: "/reports/finance", label: "Finance", icon: Wallet },
  { href: "/reports/downloads", label: "Downloads", icon: Download },
];

/** Page header and tabs for every /reports/* page. */
export function ReportsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Reports"
          description="School-wide numbers from every module — enrollment, attendance, results and money — with exports for the office and the board."
          actions={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print report
            </Button>
          }
        />
      </div>
      <div className="hidden border-b-2 border-slate-900 pb-3 print:block">
        <p className="text-lg font-bold">{SCHOOL_INFO.name} — School report</p>
        <p className="text-xs">
          Session {ACADEMIC_SESSION} · printed <PrintedOn />
        </p>
      </div>
      <Suspense fallback={<TabsNav pathname="" />}>
        <ActiveTabs />
      </Suspense>
      {children}
    </div>
  );
}

const noop = () => () => {};

/** Today's date, read on the client only (not during prerender). */
function PrintedOn() {
  return useSyncExternalStore(
    noop,
    () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    () => "",
  );
}

function ActiveTabs() {
  return <TabsNav pathname={usePathname()} />;
}

function TabsNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Report pages" className="-mx-1 -mt-2 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
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
