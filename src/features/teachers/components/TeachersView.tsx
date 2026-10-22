"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarOff,
  Download,
  LayoutGrid,
  List,
  Mail,
  Phone,
  RotateCcw,
  Search,
  UserPlus,
  UserX,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES, defaultSalarySettings, salaryBreakdown } from "../demoData/mock-data";
import { useTeachers } from "../hooks/use-teachers";
import { useTeacherAdminStore } from "../store/teacher-admin.store";
import type { Teacher, TeacherFilters } from "../types/types";
import { DEFAULT_TEACHER_FILTERS, exportTeachersCsv, filterTeachers, teacherHref, yearsOfService } from "../utils";

export function TeachersView() {
  const router = useRouter();
  const { teachers, onLeaveToday, hydrated } = useTeachers();
  const salarySettings = useTeacherAdminStore((s) => s.salarySettings);
  const [filters, setFilters] = useState<TeacherFilters>(DEFAULT_TEACHER_FILTERS);
  const [view, setView] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const filtered = useMemo(() => filterTeachers(teachers, filters, onLeaveToday), [teachers, filters, onLeaveToday]);
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, lastPage);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const active = teachers.filter((t) => t.status !== "left");
  const payroll = active.reduce((sum, t) => sum + salaryBreakdown(salarySettings[t.id] ?? defaultSalarySettings(t)).net, 0);
  const counts = {
    active: filterTeachers(teachers, { ...filters, view: "active" }, onLeaveToday).length,
    "on-leave": filterTeachers(teachers, { ...filters, view: "on-leave" }, onLeaveToday).length,
    left: filterTeachers(teachers, { ...filters, view: "left" }, onLeaveToday).length,
  };

  const change = (patch: Partial<TeacherFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const open = (t: Teacher) => router.push(teacherHref(t));

  const stats: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Teaching staff", value: String(active.length), hint: `${active.filter((t) => t.employmentType === "Permanent").length} permanent`, icon: Users, accent: "bg-indigo-50 text-indigo-600" },
    { label: "On leave today", value: String(onLeaveToday.size), hint: "Approved leave", icon: CalendarOff, accent: "bg-amber-50 text-amber-600" },
    {
      label: "Average service",
      value: !hydrated ? "" : `${active.length ? (active.reduce((s, t) => s + yearsOfService(t, localToday()), 0) / active.length).toFixed(1) : 0} yrs`,
      hint: `${new Set(active.map((t) => t.department)).size} departments`,
      icon: BriefcaseBusiness,
      accent: "bg-sky-50 text-sky-600",
    },
    { label: "Monthly payroll", value: formatTaka(payroll), hint: "Net salary, active staff", icon: Wallet, accent: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Teachers"
        description="Teaching staff, their classes, attendance, leave and salary. Open a teacher to manage everything about them."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                exportTeachersCsv(filtered);
                toast("Export ready", { description: `${filtered.length} teachers downloaded as CSV.`, tone: "info" });
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href="/teachers/new" className={buttonStyles()}>
              <UserPlus className="h-4 w-4" />
              Add Teacher
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 overflow-x-auto">
              {(
                [
                  ["active", "Active"],
                  ["on-leave", "On leave today"],
                  ["left", "Left / released"],
                ] as const
              ).map(([value, label]) => (
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
                    {counts[value]}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex rounded-xl bg-soft p-1">
              {(
                [
                  ["table", List, "Table view"],
                  ["grid", LayoutGrid, "Card view"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-label={label}
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={cn("flex h-8 w-9 items-center justify-center rounded-lg transition", view === value ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg")}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => change({ search: e.target.value })}
                placeholder="Search by name, staff ID, subject, phone..."
                aria-label="Search teachers"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-9 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 [&::-webkit-search-cancel-button]:hidden"
              />
              {filters.search && (
                <button type="button" onClick={() => change({ search: "" })} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-soft">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
              <Select aria-label="Department" value={filters.department} onChange={(e) => change({ department: e.target.value })} className="lg:w-40">
                <option value="all">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <Select aria-label="Designation" value={filters.designation} onChange={(e) => change({ designation: e.target.value })} className="lg:w-44">
                <option value="all">All designations</option>
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <Select aria-label="Employment" value={filters.employmentType} onChange={(e) => change({ employmentType: e.target.value as TeacherFilters["employmentType"] })} className="lg:w-36">
                <option value="all">All types</option>
                {EMPLOYMENT_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <Select aria-label="Sort" value={filters.sort} onChange={(e) => change({ sort: e.target.value as TeacherFilters["sort"] })} className="lg:w-36">
                <option value="id">Staff ID</option>
                <option value="name">Name (A–Z)</option>
                <option value="newest">Newest joined</option>
              </Select>
            </div>
          </div>
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
                title="No teachers found"
                description="Try another search or clear the filters."
                action={
                  <Button variant="outline" onClick={() => change(DEFAULT_TEACHER_FILTERS)}>
                    <RotateCcw className="h-4 w-4" />
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : view === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    <th className="py-3 pl-5 pr-3 sm:pl-6">Teacher</th>
                    <th className="px-3 py-3">Designation</th>
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="py-3 pl-3 pr-5 sm:pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((t) => (
                    <tr key={t.id} onClick={() => open(t)} className="cursor-pointer transition-colors hover:bg-subtle/70">
                      <td className="py-3.5 pl-5 pr-3 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={t.name} photo={t.photo} />
                          <div>
                            <p className="font-semibold text-fg">{t.name}</p>
                            <p className="font-mono text-xs text-fg-subtle">{t.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-medium text-fg-secondary">{t.designation}</p>
                        <p className="text-xs text-fg-subtle">
                          {t.department} · {t.employmentType}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 text-fg-secondary">{t.subjects.join(", ")}</td>
                      <td className="px-3 py-3.5">
                        <p className="text-fg-secondary">{t.phone}</p>
                        <p className="text-xs text-fg-subtle">{t.email}</p>
                      </td>
                      <td className="px-3 py-3.5 text-fg-muted">
                        {formatDate(t.joinedOn)}
                        <p className="text-xs text-fg-subtle">{yearsOfService(t, localToday())} yrs</p>
                      </td>
                      <td className="py-3.5 pl-3 pr-5 sm:pr-6">
                        <StatusBadge teacher={t} onLeave={onLeaveToday.has(t.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 border-t border-line p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 2xl:grid-cols-4">
              {rows.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => open(t)}
                  className="group flex flex-col items-center rounded-2xl border border-line bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <StudentAvatar name={t.name} photo={t.photo} size="xl" className="h-20 w-20 rounded-full text-xl sm:h-20 sm:w-20" />
                  <p className="mt-3 font-semibold text-fg group-hover:text-indigo-600">{t.name}</p>
                  <p className="text-xs text-fg-muted">{t.designation}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {t.subjects.map((s) => (
                      <span key={s} className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 w-full space-y-1 border-t border-line pt-3 text-xs text-fg-muted">
                    <p className="flex items-center justify-center gap-1">
                      <Phone className="h-3 w-3" /> {t.phone}
                    </p>
                    <p className="flex items-center justify-center gap-1 truncate">
                      <Mail className="h-3 w-3" /> {t.email}
                    </p>
                  </div>
                  <div className="mt-3">
                    <StatusBadge teacher={t} onLeave={onLeaveToday.has(t.id)} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {hydrated && filtered.length > 0 && (
          <div className="border-t border-line px-5 py-4 sm:px-6">
            <Pagination
              page={current}
              pageSize={pageSize}
              total={filtered.length}
              pageSizeOptions={[8, 12, 24]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ teacher, onLeave }: { teacher: Teacher; onLeave: boolean }) {
  if (teacher.status === "left") return <Badge tone="neutral">Left</Badge>;
  if (onLeave)
    return (
      <Badge tone="warning" dot>
        On leave
      </Badge>
    );
  return (
    <Badge tone="success" dot>
      Active
    </Badge>
  );
}
