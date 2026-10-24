"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, HeartHandshake, MessageSquareText, RotateCcw, Search, ShieldAlert, Star, UserPlus, UserX, Users, X, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { ACCOUNT_STATUS_LABEL } from "@/features/students/components/profile/admin/AccountDialogs";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useParents } from "../hooks/use-parents";
import type { Parent, ParentFilters } from "../types/types";
import { DEFAULT_PARENT_FILTERS, exportParentsCsv, filterParents, parentHref } from "../utils";
import { MessageDialog } from "./profile/admin/MessageDialog";

const VIEWS: [ParentFilters["view"], string][] = [
  ["all", "All"],
  ["father", "Fathers"],
  ["mother", "Mothers"],
  ["guardian", "Local guardians"],
  ["multi", "2+ children"],
  ["inactive", "Former"],
];

export function ParentsView() {
  const router = useRouter();
  const { parents, hydrated, accountOf } = useParents();
  const [filters, setFilters] = useState<ParentFilters>(DEFAULT_PARENT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [messaging, setMessaging] = useState<Parent[] | null>(null);

  const filtered = useMemo(() => filterParents(parents, filters, accountOf), [parents, filters, accountOf]);
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, lastPage);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const counts = Object.fromEntries(VIEWS.map(([v]) => [v, filterParents(parents, { ...filters, view: v }, accountOf).length]));
  const selectedParents = filtered.filter((p) => selected.has(p.key));

  const change = (patch: Partial<ParentFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const allOnPage = rows.length > 0 && rows.every((p) => selected.has(p.key));

  const current_ = parents.filter((p) => !p.inactive);
  const stats: { label: string; value: number; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Parents & guardians", value: current_.length, hint: `${current_.filter((p) => p.links.some((l) => l.isPrimary)).length} primary contacts`, icon: Users, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Families with 2+ children", value: current_.filter((p) => p.links.length > 1).length, hint: "Siblings at the school", icon: HeartHandshake, accent: "bg-violet-50 text-violet-600" },
    { label: "With email", value: current_.filter((p) => p.email).length, hint: "Receive email + SMS", icon: MessageSquareText, accent: "bg-sky-50 text-sky-600" },
    { label: "Portal restricted", value: current_.filter((p) => accountOf(p).status !== "active").length, hint: "Suspended / blocked / disabled", icon: ShieldAlert, accent: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Parents & Guardians"
        description="Every student's father, mother and local guardian — one record per mobile number, with all their children together."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                exportParentsCsv(filtered);
                toast("Export ready", { description: `${filtered.length} guardians downloaded as CSV.`, tone: "info" });
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href="/parents/new" className={buttonStyles()}>
              <UserPlus className="h-4 w-4" />
              Add Guardian
            </Link>
          </>
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

      <Card className="mt-6 overflow-hidden">
        <div className="space-y-4 px-5 pt-5 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {VIEWS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => change({ view: value })}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                  filters.view === value ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg",
                )}
              >
                {label}
                <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] tabular-nums", filters.view === value ? "bg-surface/20 text-surface" : "bg-soft text-fg-muted")}>
                  {hydrated ? counts[value] : "–"}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => change({ search: e.target.value })}
                placeholder="Search guardian, mobile, email, child name or student ID..."
                aria-label="Search guardians"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-9 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 [&::-webkit-search-cancel-button]:hidden"
              />
              {filters.search && (
                <button type="button" onClick={() => change({ search: "" })} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-soft">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 lg:flex">
              <Select aria-label="Child's class" value={filters.className} onChange={(e) => change({ className: e.target.value })} className="lg:w-36">
                <option value="all">All classes</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select aria-label="Portal" value={filters.portal} onChange={(e) => change({ portal: e.target.value as ParentFilters["portal"] })} className="lg:w-40">
                <option value="all">Any portal status</option>
                <option value="active">Portal active</option>
                <option value="restricted">Portal restricted</option>
              </Select>
              <Select aria-label="Sort" value={filters.sort} onChange={(e) => change({ sort: e.target.value as ParentFilters["sort"] })} className="lg:w-36">
                <option value="name">Name (A–Z)</option>
                <option value="children">Most children</option>
                <option value="class">Child&apos;s class</option>
              </Select>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800">
              <span className="font-semibold">{selectedParents.length} selected</span>
              <Button size="sm" onClick={() => setMessaging(selectedParents)} disabled={selectedParents.length === 0}>
                <MessageSquareText className="h-3.5 w-3.5" />
                Send message
              </Button>
              <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold hover:underline">
                Clear
              </button>
            </div>
          )}
          {selected.size === 0 && hydrated && filtered.length > 1 && (
            <button type="button" onClick={() => setMessaging(filtered)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              <MessageSquareText className="h-3.5 w-3.5" />
              Message all {filtered.length} guardians in this list
            </button>
          )}
        </div>

        <div className="mt-4">
          {!hydrated ? (
            <div className="space-y-3 border-t border-line p-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-soft" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="border-t border-line">
              <EmptyState
                icon={UserX}
                title="No guardians found"
                description="Try another search or clear the filters."
                action={
                  <Button variant="outline" onClick={() => change(DEFAULT_PARENT_FILTERS)}>
                    <RotateCcw className="h-4 w-4" />
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    <th className="w-12 py-3 pl-5 pr-2 sm:pl-6">
                      <Checkbox
                        checked={allOnPage}
                        indeterminate={!allOnPage && rows.some((p) => selected.has(p.key))}
                        onCheckedChange={(v) =>
                          setSelected((s) => {
                            const next = new Set(s);
                            for (const p of rows) {
                              if (v) next.add(p.key);
                              else next.delete(p.key);
                            }
                            return next;
                          })
                        }
                        aria-label="Select all on this page"
                      />
                    </th>
                    <th className="px-3 py-3">Guardian</th>
                    <th className="px-3 py-3">Children</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Occupation</th>
                    <th className="py-3 pl-3 pr-5 sm:pr-6">Portal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((p) => {
                    const account = accountOf(p);
                    return (
                      <tr key={p.key} onClick={() => router.push(parentHref(p))} className={cn("cursor-pointer transition-colors hover:bg-subtle/70", selected.has(p.key) && "bg-indigo-50/40")}>
                        <td className="py-3.5 pl-5 pr-2 sm:pl-6" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selected.has(p.key)} onCheckedChange={() => toggle(p.key)} aria-label={`Select ${p.name}`} />
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={p.name} />
                            <div>
                              <p className="font-semibold text-fg">{p.name}</p>
                              <p className="text-xs text-fg-subtle">
                                {p.roles.join(" / ")} · <span className="font-mono">{p.id}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-1">
                            {p.links.slice(0, 3).map((l) => (
                              <span key={l.student.id} className="flex items-center gap-1.5 text-xs">
                                <span className={cn("font-medium", l.student.status === "left" ? "text-fg-subtle line-through" : "text-fg-secondary")}>{l.student.name}</span>
                                <span className="text-fg-subtle">
                                  {l.student.className} {l.student.section}
                                </span>
                                {l.isPrimary && <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-label="Primary contact" />}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-fg-secondary">{p.phone}</p>
                          <p className="text-xs text-fg-subtle">{p.email || "No email"}</p>
                        </td>
                        <td className="px-3 py-3.5 text-fg-muted">{p.occupation || "—"}</td>
                        <td className="py-3.5 pl-3 pr-5 sm:pr-6">
                          {p.inactive ? (
                            <Badge>Former</Badge>
                          ) : account.status === "active" ? (
                            <Badge tone="success" dot>
                              Active
                            </Badge>
                          ) : (
                            <Badge tone={account.status === "suspended" ? "warning" : "danger"} dot>
                              {ACCOUNT_STATUS_LABEL[account.status]}
                            </Badge>
                          )}
                          {p.links.length > 1 && (
                            <Badge tone="violet" className="ml-1.5">
                              {p.links.length} children
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {hydrated && filtered.length > 0 && (
          <div className="border-t border-line px-5 py-4 sm:px-6">
            <Pagination
              page={current}
              pageSize={pageSize}
              total={filtered.length}
              pageSizeOptions={[8, 12, 24, 48]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </Card>

      {messaging && (
        <MessageDialog
          recipients={messaging}
          onClose={() => {
            setMessaging(null);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}
