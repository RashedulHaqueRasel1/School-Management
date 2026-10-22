"use client";

import { useState } from "react";
import { Bell, CalendarDays, CheckCheck, UserPlus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";

// Static sample notifications until the backend is connected.
const notifications = [
  { id: 1, icon: UserPlus, accent: "bg-indigo-50 text-indigo-600", title: "New admission request", body: "Tanvir Hasan applied for Class 9 - B", time: "5 min ago", unread: true },
  { id: 2, icon: Wallet, accent: "bg-emerald-50 text-emerald-600", title: "Fee payment received", body: "৳ 12,500 from Ayesha Rahman's guardian", time: "1 hour ago", unread: true },
  { id: 3, icon: CalendarDays, accent: "bg-amber-50 text-amber-600", title: "Exam schedule reminder", body: "Half-yearly exams begin on Oct 27", time: "Yesterday", unread: false },
];

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative", open && "bg-soft text-fg")}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-right animate-dropdown overflow-hidden rounded-2xl bg-surface shadow-popover">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-fg">Notifications</p>
              <p className="text-xs text-fg-muted">{unreadCount} unread</p>
            </div>
            <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.id} className="flex gap-3 px-4 py-3 transition hover:bg-subtle">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", n.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{n.title}</p>
                    <p className="truncate text-xs text-fg-muted">{n.body}</p>
                    <p className="mt-1 text-[11px] text-fg-subtle">{n.time}</p>
                  </div>
                  {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                </li>
              );
            })}
          </ul>
          <button type="button" className="w-full border-t border-line py-2.5 text-center text-xs font-semibold text-fg-secondary hover:bg-subtle hover:text-fg">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
