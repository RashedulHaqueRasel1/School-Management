"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  FileText,
  GraduationCap,
  FileBadge2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Phone,
  Printer,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  UserPen,
  UserRound,
  UserX,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClickOutside } from "@/hooks/use-click-outside";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import { useStudentAccountSubject } from "../../hooks/use-account-subject";
import { useStudent } from "../../hooks/use-student";
import type { Student, StudentAccount, StudentProfile, TransferRecord, TuitionLedger } from "../../types/types";
import { studentHref, studentSlug, type StudentTab } from "../../utils";
import { FeeBadge, NewAdmissionBadge } from "../StudentBadges";
import { EditAcademicDialog } from "./admin/AcademicDialogs";
import { ACCOUNT_STATUS_LABEL, AccessControlDialog, ResetPasswordDialog } from "./admin/AccountDialogs";
import { CollectTuitionDialog } from "./admin/FeeDialogs";
import { IssueTCDialog, RevokeTCDialog, tcHref } from "./admin/TransferDialogs";
import { EditPersonalDialog } from "./admin/InfoDialogs";
import { NewLeaveDialog } from "./admin/LeaveDialogs";

type TabDef = { tab?: StudentTab; label: string; icon: LucideIcon };

const TABS: TabDef[] = [
  { label: "Overview", icon: LayoutDashboard },
  { tab: "attendance", label: "Attendance", icon: CalendarCheck },
  { tab: "leave", label: "Leave", icon: CalendarPlus },
  { tab: "academics", label: "Results", icon: BookOpen },
  { tab: "fees", label: "Fees", icon: Wallet },
  { tab: "guardians", label: "Guardians", icon: Users },
  { tab: "profile", label: "Profile", icon: UserRound },
  { tab: "account", label: "Account", icon: ShieldCheck },
];

/** Header + tab navigation shared by every /students/[slug]/* page. */
export function StudentProfileShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { hydrated, student, profile, account, leaveRequests, tuition, transfer } = useStudent(slug);

  if (!hydrated) return <ProfileSkeleton />;
  if (!student || !profile || !account || !tuition) {
    return (
      <Card>
        <EmptyState
          icon={UserX}
          title="Student not found"
          description="The link may be outdated — the profile URL changes if the student's name is edited."
          action={
            <Link href="/students" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All students
            </Link>
          }
        />
      </Card>
    );
  }

  const pendingLeave = leaveRequests.filter((r) => r.stage === "admin").length;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          All students
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin view · full access
        </span>
      </div>

      <ProfileHeader student={student} profile={profile} account={account} tuition={tuition} transfer={transfer} />

      <Suspense fallback={<TabsNav student={student} pathname="" pendingLeave={pendingLeave} />}>
        <ActiveTabsNav student={student} pendingLeave={pendingLeave} />
      </Suspense>

      {children}
    </div>
  );
}

type ManageAction = "personal" | "academic" | "leave" | "fees" | "tc" | "revoke" | "password" | "status";

function ProfileHeader({
  student: s,
  profile,
  account,
  tuition,
  transfer,
}: {
  student: Student;
  profile: StudentProfile;
  account: StudentAccount;
  tuition: TuitionLedger;
  transfer?: TransferRecord;
}) {
  const router = useRouter();
  const [action, setAction] = useState<ManageAction | null>(null);
  const subject = useStudentAccountSubject(s)!;
  const restricted = account.status !== "active";

  const facts: { icon: LucideIcon; label: string }[] = [
    { icon: GraduationCap, label: `${s.className} · Section ${s.section} · Roll ${s.roll}` },
    { icon: BookOpen, label: `${s.version} version · ${s.shift} shift` },
    { icon: CalendarDays, label: `Since ${formatDate(s.enrolledOn)}` },
    { icon: UserRound, label: `Class teacher: ${profile.classTeacher.name}` },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="relative h-28 bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-500 sm:h-32">
        <div aria-hidden className="absolute inset-0 bg-grid-white" />
        <div aria-hidden className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      </div>
      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <StudentAvatar name={s.name} photo={s.photo} size="xl" className="ring-4 ring-surface shadow-card" />
            <div className="min-w-0 pb-1 sm:pt-14">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{s.name}</h1>
                <span className="rounded-md bg-soft px-2 py-0.5 font-mono text-xs font-semibold text-fg-secondary">{s.id}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {transfer ? null : restricted ? (
                  <Badge tone={account.status === "suspended" ? "warning" : "danger"} dot>
                    {account.status === "suspended" ? `Suspended until ${formatDate(account.suspendedUntil!)}` : `Portal ${ACCOUNT_STATUS_LABEL[account.status].toLowerCase()}`}
                  </Badge>
                ) : (
                  <Badge tone="success" dot>
                    Active
                  </Badge>
                )}
                {!transfer && tuition.outstanding > 0 && <Badge tone="danger">Tuition due {formatTaka(tuition.outstanding)}</Badge>}
                <NewAdmissionBadge student={s} />
                <FeeBadge student={s} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:shrink-0 lg:flex-nowrap lg:pb-1 print:hidden">
            <a href={`tel:${s.phone}`} className={buttonStyles({ variant: "outline" })} title={`${s.guardianName} · ${s.phone}`}>
              <Phone className="h-4 w-4" />
              Call guardian
            </a>
            <button type="button" onClick={() => window.print()} className={buttonStyles({ variant: "outline", size: "icon" })} aria-label="Print profile" title="Print profile">
              <Printer className="h-4 w-4" />
            </button>
            <ManageMenu onSelect={setAction} admissionHref={s.admissionHref} restricted={restricted} left={Boolean(transfer)} />
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

        {transfer && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-subtle p-4 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg text-surface">
              <LogOut className="h-5 w-5" />
            </span>
            <p className="flex-1 text-sm text-fg-secondary">
              <span className="font-semibold text-fg">Left the school on {formatDate(transfer.leavingDate)}</span> · {transfer.reason}
              {transfer.destinationSchool && ` → ${transfer.destinationSchool}`}. Record archived · TC <span className="font-mono">{transfer.tcNo}</span>.
            </p>
            <div className="flex gap-2 print:hidden">
              <a href={tcHref(transfer.tcNo)} target="_blank" rel="noopener" className={buttonStyles({ size: "sm" })}>
                <FileBadge2 className="h-3.5 w-3.5" />
                View TC
              </a>
              <button type="button" onClick={() => setAction("revoke")} className={buttonStyles({ size: "sm", variant: "outline" })}>
                Cancel TC
              </button>
            </div>
          </div>
        )}
      </div>

      {action === "personal" && (
        <EditPersonalDialog
          student={s}
          profile={profile}
          onClose={() => setAction(null)}
          onSaved={(name) => {
            const next = studentSlug({ id: s.id, name });
            if (next !== studentSlug(s)) router.replace(window.location.pathname.replace(studentSlug(s), next));
          }}
        />
      )}
      {action === "academic" && <EditAcademicDialog student={s} profile={profile} onClose={() => setAction(null)} />}
      {action === "leave" && <NewLeaveDialog student={s} onClose={() => setAction(null)} />}
      {action === "password" && <ResetPasswordDialog subject={subject} account={account} onClose={() => setAction(null)} />}
      {action === "status" && <AccessControlDialog subject={subject} account={account} onClose={() => setAction(null)} />}
      {action === "fees" && <CollectTuitionDialog student={s} ledger={tuition} onClose={() => setAction(null)} />}
      {action === "tc" && <IssueTCDialog student={s} tuition={tuition} onClose={() => setAction(null)} />}
      {action === "revoke" && transfer && <RevokeTCDialog student={s} transfer={transfer} onClose={() => setAction(null)} />}
    </Card>
  );
}

function ManageMenu({
  onSelect,
  admissionHref,
  restricted,
  left,
}: {
  onSelect: (a: ManageAction) => void;
  admissionHref?: string;
  restricted: boolean;
  left: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const items: { action: ManageAction; label: string; hint: string; icon: LucideIcon; danger?: boolean }[] = [
    { action: "personal", label: "Edit personal info", hint: "Name, birth date, address, health", icon: UserPen },
    { action: "academic", label: "Academic details", hint: "Class, section, roll, shift & timing, version, class teacher", icon: UserCog },
    { action: "leave", label: "Add leave", hint: "On the student's behalf", icon: CalendarPlus },
    { action: "fees", label: "Collect tuition", hint: "Record a monthly fee payment", icon: Wallet },
    { action: "password", label: "Reset password", hint: "Generate a new portal password", icon: KeyRound },
    {
      action: "status",
      label: restricted ? "Restore portal access" : "Suspend / block / disable",
      hint: restricted ? "Allow sign-in again" : "Stop portal sign-in for a period or indefinitely",
      icon: ShieldAlert,
      danger: !restricted,
    },
    left
      ? { action: "revoke", label: "Cancel TC & re-admit", hint: "Return the student to the active list", icon: FileBadge2 }
      : { action: "tc", label: "Issue transfer certificate", hint: "Checks dues, marks as Left, archives", icon: FileBadge2, danger: true },
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
          {admissionHref && (
            <>
              <div className="my-1 h-px bg-line" />
              <Link href={admissionHref} className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-soft">
                <FileText className="mt-0.5 h-4 w-4 text-fg-subtle" />
                <span>
                  <span className="block text-sm font-medium text-fg">Admission record</span>
                  <span className="block text-xs text-fg-muted">Application, payments, documents</span>
                </span>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActiveTabsNav(props: { student: Student; pendingLeave: number }) {
  return <TabsNav {...props} pathname={usePathname()} />;
}

function TabsNav({ student, pathname, pendingLeave }: { student: Student; pathname: string; pendingLeave: number }) {
  return (
    <nav aria-label="Student sections" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ tab, label, icon: Icon }) => {
          const href = studentHref(student, tab);
          const active = pathname === href;
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
    <div className="space-y-6" aria-busy="true" aria-label="Loading student">
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
