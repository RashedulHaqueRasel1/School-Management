"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { isActivePath, navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

import { Logo } from "./Logo";

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-68 flex-col overflow-hidden bg-navy-950 text-slate-400 transition-[width,transform] duration-300 ease-out print:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-68",
        )}
      >
        {/* Ambient glow */}
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

        {/* Brand */}
        <div
          className={cn(
            "relative flex h-[72px] shrink-0 items-center justify-between px-5",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <Logo tone="dark" subtitle="School Admin" className={cn(collapsed && "lg:hidden")} />
          <Logo tone="dark" iconOnly className={cn("hidden", collapsed && "lg:flex")} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mx-5 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

        {/* Navigation */}
        <nav className="sidebar-scroll relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
          {/* usePathname needs a Suspense boundary on dynamic routes (cacheComponents). */}
          <Suspense fallback={<NavLinks pathname="" collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />}>
            <ActiveNavLinks collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
          </Suspense>
        </nav>

        {/* Signed-in user */}
        <div className="relative border-t border-white/[0.06] p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]",
              collapsed && "lg:justify-center lg:bg-transparent lg:p-1 lg:ring-0",
            )}
          >
            <div className="relative">
              <Avatar name="Admin User" size="md" className="bg-linear-to-br from-indigo-400 to-violet-500 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-navy-950" />
            </div>
            <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <p className="truncate text-sm font-semibold text-white">Admin User</p>
              <p className="truncate text-xs text-slate-500">admin@school.edu</p>
            </div>
            <Link
              href="/login"
              title="Sign out"
              className={cn(
                "rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white",
                collapsed && "lg:hidden",
              )}
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

type NavLinksProps = { collapsed: boolean; onNavigate: () => void };

function ActiveNavLinks(props: NavLinksProps) {
  return <NavLinks pathname={usePathname()} {...props} />;
}

function NavLinks({ pathname, collapsed, onNavigate }: NavLinksProps & { pathname: string }) {
  return (
    <>
      {navigation.map((group) => (
        <div key={group.label} className="mb-6 last:mb-0">
          <p
            className={cn(
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500",
              collapsed && "lg:hidden",
            )}
          >
            {group.label}
          </p>
          {collapsed && <div className="mx-auto mb-2 hidden h-px w-6 bg-white/10 lg:block" />}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.title : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-all duration-150",
                      active
                        ? "bg-linear-to-r from-indigo-500/20 via-indigo-500/10 to-transparent text-white ring-1 ring-inset ring-white/[0.07]"
                        : "hover:bg-white/[0.04] hover:text-slate-100",
                      collapsed && "lg:justify-center lg:px-0",
                    )}
                  >
                    {active && (
                      <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-indigo-400 to-violet-500 shadow-[0_0_12px_rgb(129_140_248/0.8)]" />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        active ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300",
                      )}
                      strokeWidth={active ? 2.25 : 2}
                    />
                    <span className={cn("truncate", collapsed && "lg:hidden")}>
                      {item.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
