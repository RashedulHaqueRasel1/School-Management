"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Eye, FilePenLine, Megaphone, MessageSquareText, Paperclip, Pin, Plus, Search, Send, X, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useNotices, type NoticeView } from "../hooks/use-notices";
import type { NoticeFilters, NoticeStatus } from "../types/types";
import { CATEGORIES, CATEGORY_STYLE, GROUP_LABEL, STATUS_STYLE, audienceLabel, noticeHref, relativeTime } from "../utils";

const STATUSES: (NoticeStatus | "all")[] = ["all", "published", "scheduled", "draft", "expired", "archived"];

export function NoticesView() {
  const { notices, hydrated, now } = useNotices();
  const [filters, setFilters] = useState<NoticeFilters>({ search: "", status: "all", category: "all", group: "all" });
  const set = (patch: Partial<NoticeFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return notices.filter((n) => {
      // "All" hides archived notices.
      if (filters.status === "all" ? n.status === "archived" : n.status !== filters.status) return false;
      if (filters.category !== "all" && n.category !== filters.category) return false;
      if (filters.group !== "all" && !n.groups.includes(filters.group)) return false;
      return !q || [n.title, n.body, n.category].some((v) => v.toLowerCase().includes(q));
    });
  }, [notices, filters]);

  const count = (s: NoticeStatus | "all") => (s === "all" ? notices.filter((n) => n.status !== "archived").length : notices.filter((n) => n.status === s).length);
  const month = now.slice(0, 7);
  const live = notices.filter((n) => n.status === "published");
  const reached = live.reduce((s, n) => s + n.reach.total, 0);
  const seen = live.reduce((s, n) => s + n.seen, 0);
  const scheduled = notices.filter((n) => n.status === "scheduled").sort((a, b) => a.publishAt!.localeCompare(b.publishAt!));

  const stats: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "On the board", value: String(live.length), hint: `${live.filter((n) => n.pinned).length} pinned`, icon: Megaphone, accent: "bg-rose-50 text-rose-600" },
    { label: "Published this month", value: String(notices.filter((n) => n.publishAt?.startsWith(month) && n.publishAt <= now).length), hint: `${notices.filter((n) => n.sms && n.publishAt?.startsWith(month)).length} also sent by SMS`, icon: Send, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Seen by", value: reached ? `${Math.round((seen / reached) * 100)}%` : "—", hint: `${seen.toLocaleString()} of ${reached.toLocaleString()} recipients`, icon: Eye, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Scheduled & drafts", value: `${count("scheduled")} · ${count("draft")}`, hint: scheduled[0] ? `Next ${relativeTime(scheduled[0].publishAt!, now)}` : "Nothing scheduled", icon: CalendarClock, accent: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Notices"
        description="Announcements for students, parents and teachers — shown on their portal, with optional SMS and email."
        actions={
          <Link href="/notices/new" className={buttonStyles()}>
            <Plus className="h-4 w-4" />
            New Notice
          </Link>
        }
      />

      {hydrated ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, hint, icon: Icon, accent }) => (
            <Card key={label} className="flex items-center gap-4 p-5">
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg-muted">{label}</p>
                <p className="text-2xl font-bold tabular-nums text-fg">{value}</p>
                <p className="truncate text-xs text-fg-subtle">{hint}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-[92px] animate-pulse rounded-2xl bg-soft" />
      )}

      <Card className="mt-6 flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ status: s })}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition", filters.status === s ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}
            >
              {s === "all" ? "All" : STATUS_STYLE[s].label}
              {hydrated && <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", filters.status === s ? "bg-surface/20" : "bg-soft")}>{count(s)}</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search notices..."
            aria-label="Search notices"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-9 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button type="button" onClick={() => set({ search: "" })} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-soft">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select aria-label="Category" value={filters.category} onChange={(e) => set({ category: e.target.value as NoticeFilters["category"] })} className="w-36">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select aria-label="Audience" value={filters.group} onChange={(e) => set({ group: e.target.value as NoticeFilters["group"] })} className="w-36">
            <option value="all">Everyone</option>
            {(Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[]).map((g) => (
              <option key={g} value={g}>
                {GROUP_LABEL[g]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {!hydrated ? (
            [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-soft" />)
          ) : visible.length === 0 ? (
            <Card>
              <EmptyState icon={Megaphone} title="No notices found" description="Try another status, category or search — or post a new notice." />
            </Card>
          ) : (
            visible.map((n) => <NoticeCard key={n.id} notice={n} now={now} />)
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <CalendarClock className="h-4 w-4 text-fg-muted" />
              Scheduled
            </h2>
            <p className="text-xs text-fg-muted">Go live automatically at the set time.</p>
            {!hydrated ? (
              <div className="mt-4 h-24 animate-pulse rounded-xl bg-soft" />
            ) : scheduled.length === 0 ? (
              <p className="mt-4 rounded-xl bg-subtle py-6 text-center text-sm text-fg-muted">Nothing scheduled.</p>
            ) : (
              <ul className="mt-4 space-y-1">
                {scheduled.map((n) => (
                  <li key={n.id}>
                    <Link href={noticeHref(n)} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-subtle">
                      <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <span className="text-[9px] font-semibold uppercase leading-none">{new Date(n.publishAt!).toLocaleDateString("en-GB", { month: "short" })}</span>
                        <span className="text-sm font-bold leading-tight">{Number(n.publishAt!.slice(8, 10))}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">{n.title}</p>
                        <p className="text-xs text-fg-muted">{relativeTime(n.publishAt!, now)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">By category</h2>
            <p className="text-xs text-fg-muted">Click to filter.</p>
            <ul className="mt-4 space-y-1">
              {CATEGORIES.map((c) => {
                const n = notices.filter((x) => x.category === c && x.status !== "archived").length;
                const Icon = CATEGORY_STYLE[c].icon;
                return (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => set({ category: filters.category === c ? "all" : c })}
                      className={cn("-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-subtle", filters.category === c && "bg-subtle")}
                    >
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", CATEGORY_STYLE[c].tile)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-fg">{c}</span>
                      <span className="text-xs tabular-nums text-fg-muted">{n}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NoticeCard({ notice: n, now }: { notice: NoticeView; now: string }) {
  const style = CATEGORY_STYLE[n.category];
  const Icon = style.icon;
  const status = STATUS_STYLE[n.status];
  const rate = n.reach.total ? Math.round((n.seen / n.reach.total) * 100) : 0;
  const excerpt = n.body.split(/\n\s*\n/)[0]!;
  return (
    <Link
      href={noticeHref(n)}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:pl-6",
        n.pinned ? "border-rose-200 dark:border-rose-500/30" : "border-line",
        (n.status === "archived" || n.status === "expired") && "opacity-75",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", style.bar)} />
      <div className="flex items-start gap-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", style.tile)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={style.tone}>{n.category}</Badge>
            {n.priority !== "normal" && <Badge tone={n.priority === "urgent" ? "danger" : "warning"}>{n.priority === "urgent" ? "Urgent" : "Important"}</Badge>}
            {n.status !== "published" && (
              <Badge tone={status.tone} dot>
                {status.label}
              </Badge>
            )}
            {n.pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            )}
          </div>
          <h3 className="mt-1.5 font-semibold leading-snug text-fg group-hover:text-indigo-600">{n.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-fg-secondary">{excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-muted">
            <span>{audienceLabel(n)}</span>
            <span>
              {n.status === "draft" ? (
                <span className="inline-flex items-center gap-1">
                  <FilePenLine className="h-3 w-3" /> Edited {relativeTime(n.updatedAt, now)}
                </span>
              ) : n.status === "scheduled" ? (
                `Goes live ${relativeTime(n.publishAt!, now)}`
              ) : (
                relativeTime(n.publishAt!, now)
              )}
            </span>
            {n.sms && (
              <span className="inline-flex items-center gap-1">
                <MessageSquareText className="h-3 w-3" /> SMS
              </span>
            )}
            {n.attachment && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3" /> 1 file
              </span>
            )}
          </div>
        </div>
        {(n.status === "published" || n.status === "expired" || n.status === "archived") && (
          <div className="hidden w-28 shrink-0 text-right sm:block">
            <p className="text-lg font-bold tabular-nums text-fg">{rate}%</p>
            <p className="text-[11px] text-fg-muted">
              seen · {n.seen}/{n.reach.total}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
