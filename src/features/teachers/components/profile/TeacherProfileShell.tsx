"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  FileBadge2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserPen,
  UserRound,
  UserX,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClickOutside } from "@/hooks/use-click-outside";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";
import { ACCOUNT_STATUS_LABEL, AccessControlDialog, ResetPasswordDialog } from "@/features/students/components/profile/admin/AccountDialogs";
import { localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { useTeacher } from "../../hooks/use-teacher";
import type { Teacher } from "../../types/types";
import { teacherHref, yearsOfService, type TeacherTab } from "../../utils";
import { NewTeacherLeaveDialog } from "./admin/LeaveDialogs";
import { RejoinDialog, ReleaseDialog, experienceCertHref } from "./admin/ReleaseDialogs";
import { PaySalaryDialog } from "./admin/SalaryDialogs";

type TabDef = { tab?: TeacherTab; label: string; icon: LucideIcon };

const TABS: TabDef[] = [
  { label: "Overview", icon: LayoutDashboard },
  { tab: "attendance", label: "Attendance", icon: CalendarCheck },
  { tab: "leave", label: "Leave", icon: CalendarPlus },
  { tab: "classes", label: "Classes & Routine", icon: BookOpen },
  { tab: "salary", label: "Salary", icon: Wallet },
  { tab: "profile", label: "Profile", icon: UserRound },
  { tab: "account", label: "Account", icon: ShieldCheck },
];

type ManageAction = "leave" | "salary" | "password" | "status" | "release" | "rejoin";

/** Header + tab navigation shared by every /teachers/[slug]/* page. */
export function TeacherProfileShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const data = useTeacher(slug);
  const { hydrated, teacher } = data;
  const [action, setAction] = useState<ManageAction | null>(null);

  if (!hydrated) return <ProfileSkeleton />;
  if (!teacher || !data.account || !data.salary || !data.subject || !data.leaveUsage) {
    return (
      <Card>
        <EmptyState
          icon={UserX}
          title="Teacher not found"
          description="The link may be outdated — the profile URL changes if the teacher's name is edited."
          action={
            <Link href="/teachers" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All teachers
            </Link>
          }
        />
      </Card>
    );
  }

  const { account, release, salary, leaves = [] } = data;
  const today = localToday();
  const pendingLeave = leaves.filter((l) => l.status === "pending").length;
  const onLeave = leaves.find((l) => l.status === "approved" && l.from <= today && l.to >= today);
  const restricted = account.status !== "active";
  const service = yearsOfService(teacher, today);

  const facts: { icon: LucideIcon; label: string }[] = [
    { icon: BriefcaseBusiness, label: `${teacher.designation} · ${teacher.department}` },
    { icon: BookOpen, label: teacher.subjects.join(", ") },
    { icon: CalendarDays, label: `Joined ${formatDate(teacher.joinedOn)} · ${service} yr${service === 1 ? "" : "s"}` },
    { icon: UserRound, label: `${teacher.employmentType} · ${teacher.shift} shift` },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/teachers" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          All teachers
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin view · full access
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="relative h-28 bg-linear-to-r from-violet-600 via-indigo-600 to-sky-500 sm:h-32">
          <div aria-hidden className="absolute inset-0 bg-grid-white" />
          <div aria-hidden className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <StudentAvatar name={teacher.name} photo={teacher.photo} size="xl" className="ring-4 ring-surface shadow-card" />
              <div className="min-w-0 pb-1 sm:pt-14">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{teacher.name}</h1>
                  <span className="rounded-md bg-soft px-2 py-0.5 font-mono text-xs font-semibold text-fg-secondary">{teacher.id}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {release ? (
                    <Badge tone="neutral" dot>
                      Left · {release.type}
                    </Badge>
                  ) : onLeave ? (
                    <Badge tone="violet" dot>
                      On leave until {formatDate(onLeave.to)}
                    </Badge>
                  ) : (
                    <Badge tone="success" dot>
                      Active
                    </Badge>
                  )}
                  {!release && restricted && (
                    <Badge tone={account.status === "suspended" ? "warning" : "danger"}>
                      {account.status === "suspended" ? `Suspended until ${formatDate(account.suspendedUntil!)}` : `Portal ${ACCOUNT_STATUS_LABEL[account.status].toLowerCase()}`}
                    </Badge>
                  )}
                  {data.classTeacherOf && data.classTeacherOf.length > 0 && (
                    <Badge tone="info">Class teacher · {data.classTeacherOf.map((c) => `${c.className} ${c.section}`).join(", ")}</Badge>
                  )}
                  {!release && salary.pending > 0 && <Badge tone="warning">Salary due</Badge>}
                  {pendingLeave > 0 && <Badge tone="warning">{pendingLeave} leave pending</Badge>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:shrink-0 lg:flex-nowrap lg:pb-1 print:hidden">
              <a href={`tel:${teacher.phone}`} className={buttonStyles({ variant: "outline", size: "icon" })} aria-label={`Call ${teacher.phone}`} title={teacher.phone}>
                <Phone className="h-4 w-4" />
              </a>
              <a href={`mailto:${teacher.email}`} className={buttonStyles({ variant: "outline", size: "icon" })} aria-label={`Email ${teacher.email}`} title={teacher.email}>
                <Mail className="h-4 w-4" />
              </a>
              <Link href={teacherHref(teacher, "edit")} className={buttonStyles({ variant: "outline" })}>
                <UserPen className="h-4 w-4" />
                Edit
              </Link>
              <ManageMenu onSelect={setAction} restricted={restricted} left={Boolean(release)} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-fg-muted">
            {facts.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-fg-subtle" />
                {label}
              </span>
            ))}
          </div>

          {release && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-subtle p-4 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg text-surface">
                <LogOut className="h-5 w-5" />
              </span>
              <p className="flex-1 text-sm text-fg-secondary">
                <span className="font-semibold text-fg">
                  {release.type} · last working day {formatDate(release.lastWorkingDay)}
                </span>{" "}
                · {release.reason}. Experience certificate <span className="font-mono">{release.certNo}</span>.
              </p>
              <div className="flex gap-2 print:hidden">
                <a href={experienceCertHref(release.certNo)} target="_blank" rel="noopener" className={buttonStyles({ size: "sm" })}>
                  <FileBadge2 className="h-3.5 w-3.5" />
                  Certificate
                </a>
                <button type="button" onClick={() => setAction("rejoin")} className={buttonStyles({ size: "sm", variant: "outline" })}>
                  Cancel release
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Suspense fallback={<TabsNav teacher={teacher} pathname="" pendingLeave={pendingLeave} />}>
        <ActiveTabsNav teacher={teacher} pendingLeave={pendingLeave} />
      </Suspense>

      {children}

      {action === "leave" && <NewTeacherLeaveDialog teacher={teacher} teachers={data.teachers} usage={data.leaveUsage} onClose={() => setAction(null)} />}
      {action === "salary" && <PaySalaryDialog teacher={teacher} ledger={salary} onClose={() => setAction(null)} />}
      {action === "password" && <ResetPasswordDialog subject={data.subject} account={account} onClose={() => setAction(null)} />}
      {action === "status" && <AccessControlDialog subject={data.subject} account={account} onClose={() => setAction(null)} />}
      {action === "release" && <ReleaseDialog teacher={teacher} salary={salary} onClose={() => setAction(null)} />}
      {action === "rejoin" && <RejoinDialog teacher={teacher} onClose={() => setAction(null)} />}
    </div>
  );
}

function ManageMenu({ onSelect, restricted, left }: { onSelect: (a: ManageAction) => void; restricted: boolean; left: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const items: { action: ManageAction; label: string; hint: string; icon: LucideIcon; danger?: boolean }[] = [
    { action: "leave", label: "Add leave", hint: "On the teacher's behalf, with substitute", icon: CalendarPlus },
    { action: "salary", label: "Pay salary", hint: "Record payment and issue a payslip", icon: Wallet },
    { action: "password", label: "Reset password", hint: "Generate a new portal password", icon: KeyRound },
    {
      action: "status",
      label: restricted ? "Restore portal access" : "Suspend / block / disable",
      hint: restricted ? "Allow sign-in again" : "Stop portal sign-in for a period or indefinitely",
      icon: ShieldAlert,
      danger: !restricted,
    },
    left
      ? { action: "rejoin", label: "Cancel release", hint: "Return the teacher to the active list", icon: FileBadge2 }
      : { action: "release", label: "Resign / terminate", hint: "Archive, disable portal, issue experience certificate", icon: LogOut, danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={buttonStyles()}>
        <Settings2 className="h-4 w-4" />
        Manage
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 origin-top-right animate-dropdown rounded-2xl border border-line bg-surface p-1.5 shadow-popover">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.action}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect(item.action);
                }}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-soft"
              >
                <Icon className={cn("mt-0.5 h-4 w-4", item.danger ? "text-rose-500" : "text-fg-subtle")} />
                <span>
                  <span className={cn("block text-sm font-medium", item.danger ? "text-rose-600 dark:text-rose-400" : "text-fg")}>{item.label}</span>
                  <span className="block text-xs text-fg-muted">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActiveTabsNav(props: { teacher: Teacher; pendingLeave: number }) {
  return <TabsNav {...props} pathname={usePathname()} />;
}

function TabsNav({ teacher, pathname, pendingLeave }: { teacher: Teacher; pathname: string; pendingLeave: number }) {
  return (
    <nav aria-label="Teacher sections" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ tab, label, icon: Icon }) => {
          const href = teacherHref(teacher, tab);
          const active = pathname === href || (tab === "profile" && pathname === teacherHref(teacher, "edit"));
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow" : "text-fg-muted hover:bg-soft hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {tab === "leave" && pendingLeave > 0 && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-amber-500 text-white")}>
                  {pendingLeave}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading teacher">
      <div className="h-5 w-28 animate-pulse rounded bg-soft" />
      <Card className="overflow-hidden">
        <div className="h-28 animate-pulse bg-soft" />
        <div className="flex items-end gap-4 px-6 pb-6">
          <div className="-mt-12 h-28 w-28 animate-pulse rounded-2xl bg-soft ring-4 ring-surface" />
          <div className="space-y-2">
            <div className="h-7 w-56 animate-pulse rounded bg-soft" />
            <div className="h-4 w-80 animate-pulse rounded bg-soft" />
          </div>
        </div>
      </Card>
      <div className="h-14 animate-pulse rounded-2xl bg-soft" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-[480px] animate-pulse" />
        <Card className="h-[480px] animate-pulse" />
      </div>
    </div>
  );
}
