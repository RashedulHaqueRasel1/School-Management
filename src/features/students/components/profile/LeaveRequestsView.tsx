"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Clock,
  Download,
  FileText,
  GraduationCap,
  HeartPulse,
  Hourglass,
  Inbox,
  Paperclip,
  Plane,
  ShieldCheck,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { FilePreviewDialog } from "@/components/shared/FilePreviewDialog";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { LEAVE_TYPES, localToday, schoolDaysBetween } from "../../demoData/profile-data";
import { useStudent } from "../../hooks/use-student";
import { downloadLeaveAttachment, loadLeaveAttachment } from "../../leave-files";
import type { LeaveDecision, LeaveRequest, LeaveStage, LeaveType } from "../../types/types";
import { LeaveDecisionDialog, NewLeaveDialog } from "./admin/LeaveDialogs";

const TYPE_ICON: Record<LeaveType, { icon: LucideIcon; accent: string }> = {
  sick: { icon: HeartPulse, accent: "bg-rose-50 text-rose-600" },
  casual: { icon: Plane, accent: "bg-sky-50 text-sky-600" },
  family: { icon: Users, accent: "bg-violet-50 text-violet-600" },
  other: { icon: FileText, accent: "bg-soft text-fg-muted" },
};

const STAGE: Record<LeaveStage, { label: string; tone: BadgeTone }> = {
  teacher: { label: "With class teacher", tone: "neutral" },
  admin: { label: "Awaiting admin approval", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

type Filter = "all" | LeaveStage;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "admin", label: "Needs your approval" },
  { value: "teacher", label: "With class teacher" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

/**
 * Leave workflow: student applies in the portal → class teacher recommends →
 * admin gives the final decision. Approved days appear on the attendance calendar.
 */
export function LeaveRequestsView({ slug }: { slug: string }) {
  const { student, profile, leaveRequests } = useStudent(slug);
  const [filter, setFilter] = useState<Filter>("admin");
  const [deciding, setDeciding] = useState<{ request: LeaveRequest; approve: boolean } | null>(null);
  const [adding, setAdding] = useState(false);
  const [previewing, setPreviewing] = useState<LeaveRequest | null>(null);
  if (!student || !profile) return null;

  const count = (stage: LeaveStage) => leaveRequests.filter((r) => r.stage === stage).length;
  const visible = filter === "all" ? leaveRequests : leaveRequests.filter((r) => r.stage === filter);
  const approvedDays = leaveRequests.filter((r) => r.stage === "approved").reduce((sum, r) => sum + schoolDaysBetween(r.from, r.to).length, 0);

  const summary = [
    { label: "Needs your approval", value: count("admin"), icon: ShieldCheck, accent: "bg-amber-50 text-amber-600" },
    { label: "With class teacher", value: count("teacher"), icon: Hourglass, accent: "bg-soft text-fg-muted" },
    { label: "Approved requests", value: count("approved"), icon: Check, accent: "bg-emerald-50 text-emerald-600", hint: `${approvedDays} school day(s)` },
    { label: "Rejected", value: count("rejected"), icon: X, accent: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Workflow */}
      <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between sm:px-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { icon: UserRound, label: "Student applies (portal)" },
            { icon: GraduationCap, label: `Class teacher · ${profile.classTeacher.name}` },
            { icon: ShieldCheck, label: "Admin final approval" },
          ].map(({ icon: Icon, label }, i, all) => (
            <li key={label} className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-subtle px-3 py-1.5 font-medium text-fg-secondary">
                <Icon className="h-4 w-4 text-indigo-500" />
                {label}
              </span>
              {i < all.length - 1 && <ArrowRight className="h-4 w-4 text-fg-subtle" />}
            </li>
          ))}
        </ol>
        <Button onClick={() => setAdding(true)} className="shrink-0">
          <CalendarPlus className="h-4 w-4" />
          Add leave
        </Button>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, accent, hint }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-2xl font-bold tabular-nums text-fg">{value}</p>
              {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="-mx-1 overflow-x-auto px-6 pt-5">
          <div className="flex min-w-max gap-1">
            {FILTERS.map((f) => {
              const n = f.value === "all" ? leaveRequests.length : count(f.value);
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                    active ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg",
                  )}
                >
                  {f.label}
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] tabular-nums", active ? "bg-surface/20 text-surface" : "bg-soft text-fg-muted")}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={Inbox} title="Nothing here" description="No leave requests in this list." />
        ) : (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {visible.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                teacherName={profile.classTeacher.name}
                onDecide={(approve) => setDeciding({ request: r, approve })}
                onPreview={() => setPreviewing(r)}
                onDownload={() => {
                  downloadLeaveAttachment(r, student).catch(() => toast("Download failed", { tone: "error" }));
                }}
              />
            ))}
          </ul>
        )}
      </Card>

      {deciding && <LeaveDecisionDialog request={deciding.request} approve={deciding.approve} onClose={() => setDeciding(null)} />}
      {adding && <NewLeaveDialog student={student} onClose={() => setAdding(false)} />}
      {previewing?.attachment && (
        <FilePreviewDialog
          fileName={previewing.attachment}
          description={`${LEAVE_TYPES[previewing.type]} · ${student.name} · ${previewing.id}`}
          load={() => loadLeaveAttachment(previewing, student)}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}

function RequestRow({
  request: r,
  teacherName,
  onDecide,
  onPreview,
  onDownload,
}: {
  request: LeaveRequest;
  teacherName: string;
  onDecide: (approve: boolean) => void;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const { icon: Icon, accent } = TYPE_ICON[r.type];
  const days = schoolDaysBetween(r.from, r.to).length;
  const open = r.stage === "teacher" || r.stage === "admin";
  const upcoming = r.from > localToday();

  return (
    <li className="grid grid-cols-1 gap-5 px-5 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex gap-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", accent)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-fg">{LEAVE_TYPES[r.type]}</p>
            <Badge tone={STAGE[r.stage].tone} dot>
              {STAGE[r.stage].label}
            </Badge>
            {upcoming && r.stage === "approved" && <Badge tone="info">Upcoming</Badge>}
          </div>
          <p className="mt-1 text-sm font-medium text-fg-secondary">
            {formatDate(r.from)}
            {r.to !== r.from && ` → ${formatDate(r.to)}`} · {days} school day{days === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-sm text-fg-secondary">“{r.reason}”</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
            <span>
              {r.submittedBy === "Student portal" ? "Applied in student portal" : `Filed by ${r.submittedBy}`} · {formatDateTime(r.submittedAt)}
            </span>
            {r.attachment && (
              <span className="inline-flex items-center overflow-hidden rounded-lg border border-line-strong bg-surface text-fg-secondary">
                <button
                  type="button"
                  onClick={onPreview}
                  title="Preview attachment"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 font-medium transition hover:bg-soft hover:text-indigo-600"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {r.attachment}
                </button>
                <button
                  type="button"
                  onClick={onDownload}
                  aria-label={`Download ${r.attachment}`}
                  title="Download"
                  className="border-l border-line-strong px-2 py-1 transition hover:bg-soft hover:text-indigo-600"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            <span className="font-mono">{r.id}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <ol className="space-y-2">
          <Step
            label="Class teacher"
            person={r.teacherDecision?.by ?? teacherName}
            decision={r.teacherDecision}
            state={r.teacherDecision ? undefined : r.stage === "teacher" ? "pending" : "overridden"}
          />
          <Step
            label="Admin"
            person={r.adminDecision?.by ?? "You"}
            decision={r.adminDecision}
            state={r.adminDecision ? undefined : r.stage === "admin" ? "pending" : r.stage === "teacher" ? "next" : "not-needed"}
          />
        </ol>
        {open && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => onDecide(true)}>
              <Check className="h-3.5 w-3.5" />
              {r.stage === "teacher" ? "Approve (override)" : "Approve"}
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-rose-600 dark:text-rose-400" onClick={() => onDecide(false)}>
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

type StepState = "pending" | "next" | "overridden" | "not-needed";

function Step({ label, person, decision, state }: { label: string; person: string; decision?: LeaveDecision; state?: StepState }) {
  const key = decision ? (decision.approved ? "approved" : "rejected") : (state ?? "pending");
  const style = {
    approved: { icon: Check, className: "bg-emerald-500 text-white", text: "Approved" },
    rejected: { icon: X, className: "bg-rose-500 text-white", text: "Rejected" },
    pending: { icon: Clock, className: "bg-amber-100 text-amber-700", text: "Waiting for decision" },
    next: { icon: Hourglass, className: "bg-soft text-fg-subtle", text: "After class teacher" },
    overridden: { icon: ArrowRight, className: "bg-soft text-fg-subtle", text: "Skipped — admin decided" },
    "not-needed": { icon: ArrowRight, className: "bg-soft text-fg-subtle", text: "Not needed" },
  }[key];
  const Icon = style.icon;
  return (
    <li className="flex items-start gap-3 rounded-xl border border-line px-3 py-2.5">
      <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", style.className)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1 text-xs">
        <p className="text-sm font-semibold text-fg">
          {label} <span className="font-normal text-fg-muted">· {style.text}</span>
        </p>
        <p className="text-fg-muted">
          {person}
          {decision && ` · ${formatDateTime(decision.at)}`}
        </p>
        {decision?.note && <p className="mt-1 text-fg-secondary">“{decision.note}”</p>}
      </div>
    </li>
  );
}
