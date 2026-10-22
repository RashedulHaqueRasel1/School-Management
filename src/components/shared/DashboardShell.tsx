"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/** Sidebar + header frame shared by every admin page. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-20" : "lg:pl-68",
        )}
      >
        <Header />
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
