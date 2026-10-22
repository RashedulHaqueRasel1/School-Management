"use client";

import { useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Check,
  ClipboardPen,
  Copy,
  History,
  KeyRound,
  LogIn,
  LogOut,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate, formatDateTime } from "@/features/admissions/utils";
import { ACCOUNT_STATUS_LABEL, AccessControlDialog, ResetPasswordDialog } from "@/features/students/components/profile/admin/AccountDialogs";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useTeacher } from "../../hooks/use-teacher";
import type { TeacherAuditCategory } from "../../types/types";

const CATEGORY: Record<TeacherAuditCategory, { label: string; icon: LucideIcon; accent: string }> = {
  profile: { label: "Profile", icon: UserCog, accent: "bg-soft text-fg-muted" },
  attendance: { label: "Attendance", icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
  leave: { label: "Leave", icon: CalendarPlus, accent: "bg-violet-50 text-violet-600" },
  classes: { label: "Classes", icon: BookOpen, accent: "bg-indigo-50 text-indigo-600" },
  salary: { label: "Salary", icon: Wallet, accent: "bg-amber-50 text-amber-600" },
  account: { label: "Account", icon: KeyRound, accent: "bg-rose-50 text-rose-600" },
  release: { label: "Release", icon: LogOut, accent: "bg-slate-100 text-slate-600" },
};

const PORTAL_ACCESS = [
  { icon: CalendarCheck, label: "Take class attendance for assigned sections" },
  { icon: ClipboardPen, label: "Enter exam marks for assigned subjects" },
  { icon: CalendarPlus, label: "Apply for leave · recommend student leave" },
  { icon: BookOpen, label: "View routine, classes and student lists" },
  { icon: Wallet, label: "View salary and download payslips" },
  { icon: Megaphone, label: "Read and post class notices" },
];

export function TeacherAccountView({ slug }: { slug: string }) {
  const { teacher, account, audit, subject } = useTeacher(slug);
  const [dialog, setDialog] = useState<"reset" | "status" | null>(null);
  const [category, setCategory] = useState<TeacherAuditCategory | "all">("all");
  if (!teacher || !account || !subject || !audit) return null;

  const active = account.status === "active";
  const entries = category === "all" ? audit : audit.filter((e) => e.category === category);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className={cn("flex items-start gap-3 px-5 py-4 sm:px-6", active ? "bg-emerald-50" : account.status === "suspended" ? "bg-amber-50" : "bg-rose-50")}>
            {active ? <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" /> : <ShieldAlert className={cn("mt-0.5 h-5 w-5", account.status === "suspended" ? "text-amber-600" : "text-rose-600")} />}
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", active ? "text-emerald-700" : account.status === "suspended" ? "text-amber-700" : "text-rose-700")}>
                {active
                  ? "Portal access active"
                  : account.status === "suspended"
                    ? `Suspended until ${formatDate(account.suspendedUntil!)}`
                    : `Portal ${ACCOUNT_STATUS_LABEL[account.status].toLowerCase()} — can't sign in`}
              </p>
              {!active && account.statusReason && <p className="mt-0.5 text-xs text-fg-secondary">“{account.statusReason}”</p>}
              {!active && account.statusChangedAt && <p className="mt-0.5 text-[11px] text-fg-subtle">Since {formatDateTime(account.statusChangedAt)}</p>}
            </div>
          </div>
          <dl className="divide-y divide-line">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
              <dt className="text-sm text-fg-muted">Username</dt>
              <dd className="flex items-center gap-2">
                <code className="font-mono text-sm font-semibold text-fg">{account.username}</code>
                <button
                  type="button"
                  aria-label="Copy username"
                  onClick={() => {
                    void navigator.clipboard?.writeText(account.username);
                    toast("Username copied");
                  }}
                  className="rounded-md p-1 text-fg-subtle hover:bg-soft hover:text-fg"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </dd>
            </div>
            <Row icon={LogIn} label="Last login" value={formatDateTime(account.lastLoginAt)} />
            <Row icon={CalendarClock} label="Password changed" value={formatDateTime(account.passwordChangedAt)} />
            <Row icon={KeyRound} label="Next login" value={account.mustChangePassword ? <Badge tone="warning">Must change password</Badge> : <span className="text-fg-muted">Normal</span>} />
          </dl>
          <div className="grid grid-cols-1 gap-2 border-t border-line p-5 sm:px-6">
            <Button onClick={() => setDialog("reset")}>
              <KeyRound className="h-4 w-4" />
              Reset password
            </Button>
            <Button variant="outline" onClick={() => setDialog("status")} className={active ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}>
              {active ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {active ? "Suspend / block / disable" : "Restore access"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Teacher portal permissions</h2>
          <p className="mt-0.5 text-xs text-fg-muted">Limited to the classes assigned on the Classes & Routine tab.</p>
          <ul className="mt-4 space-y-2.5">
            {PORTAL_ACCESS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-fg-secondary">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-soft text-fg-muted">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">{label}</span>
                <Check className={cn("h-4 w-4", active ? "text-emerald-500" : "text-fg-subtle")} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5 sm:p-6 xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <History className="h-4 w-4 text-fg-muted" />
              Admin activity log
            </h2>
            <p className="mt-0.5 text-xs text-fg-muted">Every change made to this teacher — who, what and when.</p>
          </div>
          <Select aria-label="Filter log" value={category} onChange={(e) => setCategory(e.target.value as TeacherAuditCategory | "all")} className="w-44">
            <option value="all">All changes</option>
            {(Object.keys(CATEGORY) as TeacherAuditCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY[c].label}
              </option>
            ))}
          </Select>
        </div>

        {entries.length === 0 ? (
          <EmptyState icon={History} title="No changes yet" description="Edits to the profile, attendance, leave, classes, salary and account are recorded here." />
        ) : (
          <ol className="mt-6 space-y-5">
            {entries.map((e, i) => {
              const c = CATEGORY[e.category];
              const Icon = c.icon;
              return (
                <li key={e.id} className="relative flex gap-3.5">
                  {i < entries.length - 1 && <span aria-hidden className="absolute left-[17px] top-10 h-[calc(100%-0.25rem)] w-px bg-line-strong" />}
                  <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-surface", c.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{e.action}</p>
                      <Badge>{c.label}</Badge>
                    </div>
                    {e.detail && <p className="mt-0.5 text-sm text-fg-secondary">{e.detail}</p>}
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {e.by} · {formatDateTime(e.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {dialog === "reset" && <ResetPasswordDialog subject={subject} account={account} onClose={() => setDialog(null)} />}
      {dialog === "status" && <AccessControlDialog subject={subject} account={account} onClose={() => setDialog(null)} />}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
      <dt className="flex items-center gap-2 text-sm text-fg-muted">
        <Icon className="h-4 w-4" />
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}
