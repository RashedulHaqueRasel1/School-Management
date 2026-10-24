"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, List, Plus, Umbrella, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useEventsUi } from "../store/events-ui.store";
import { EventDialogs } from "./EventDialogs";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/events", label: "Calendar", icon: CalendarDays },
  { href: "/events/list", label: "All events", icon: List },
  { href: "/events/holidays", label: "Holidays", icon: Umbrella },
];

/** Page header, tabs and event dialogs for every /events/* page. */
export function EventsShell({ children }: { children: React.ReactNode }) {
  const open = useEventsUi((s) => s.open);
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Events & Holidays"
        description="The school calendar — events, exams and holidays. Holidays close the school in attendance and exam routines too."
        actions={
          <>
            <Button variant="outline" onClick={() => open({ mode: "new", category: "Holiday" })}>
              <Umbrella className="h-4 w-4" />
              Add holiday
            </Button>
            <Button onClick={() => open({ mode: "new" })}>
              <Plus className="h-4 w-4" />
              Add event
            </Button>
          </>
        }
      />
      <Suspense fallback={<TabsNav pathname="" />}>
        <ActiveTabs />
      </Suspense>
      {children}
      <EventDialogs />
    </div>
  );
}

function ActiveTabs() {
  return <TabsNav pathname={usePathname()} />;
}

function TabsNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Events pages" className="-mx-1 -mt-2 overflow-x-auto px-1 [scrollbar-width:none]">
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
