"use client";

import { Suspense } from "react";

import { HolidaySync } from "@/features/events/components/HolidaySync";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

import { ConfirmHost } from "./ConfirmHost";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/** Sidebar + header frame shared by every admin page. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-canvas">
      <HolidaySync />
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-20" : "lg:pl-68",
          "print:pl-0",
        )}
      >
        <Header />
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
          {children}
        </main>
        <Suspense fallback={null}>
          <ConfirmHost />
        </Suspense>
      </div>
    </div>
  );
}
