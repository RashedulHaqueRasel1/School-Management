"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, PanelLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { findNavItem } from "@/lib/navigation";
import { useUIStore } from "@/store/ui.store";

import { NotificationsMenu } from "./NotificationsMenu";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="-ml-2 hidden lg:inline-flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      <Suspense fallback={null}>
        <Breadcrumb />
      </Suspense>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Search trigger (command palette later) */}
        <button
          type="button"
          className="hidden h-10 w-64 items-center gap-2.5 rounded-xl border border-line-strong bg-subtle/80 px-3.5 text-sm text-fg-subtle transition hover:border-fg-subtle/50 hover:bg-surface xl:flex 2xl:w-80"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search anything...</span>
          <kbd className="rounded-md border border-line-strong bg-surface px-1.5 py-0.5 font-sans text-[10px] font-semibold text-fg-muted shadow-sm">
            Ctrl K
          </kbd>
        </button>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>

        <ThemeToggle />
        <NotificationsMenu />
        <div className="mx-1 hidden h-7 w-px bg-line-strong sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}

/** Reads the URL, so it lives in its own Suspense boundary (required on dynamic routes). */
function Breadcrumb() {
  const current = findNavItem(usePathname());
  if (!current) return null;
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 whitespace-nowrap text-sm sm:flex">
      <span className="text-fg-subtle">{current.group}</span>
      <ChevronRight className="h-3.5 w-3.5 text-fg-subtle" />
      <span className="font-semibold text-fg">{current.title}</span>
    </nav>
  );
}
