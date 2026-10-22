"use client";

import { useState } from "react";
import { Baby, Briefcase, CalendarPlus, Check, Download, Eye, FileText, HeartPulse, Paperclip, Plane, UserCheck, X, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { FilePreviewDialog } from "@/components/shared/FilePreviewDialog";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/features/admissions/utils";
import { localToday, schoolDaysBetween } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { TEACHER_LEAVE_LABEL } from "../../demoData/mock-data";
import { downloadTeacherLeaveAttachment, loadTeacherLeaveAttachment } from "../../files";
import { useTeacher } from "../../hooks/use-teacher";
import type { TeacherLeave, TeacherLeaveType } from "../../types/types";
import { LeaveDecisionDialog, NewTeacherLeaveDialog } from "./admin/LeaveDialogs";

const TYPE_ICON: Record<TeacherLeaveType, { icon: LucideIcon; accent: string; bar: string }> = {
  casual: { icon: Plane, accent: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  sick: { icon: HeartPulse, accent: "bg-rose-50 text-rose-600", bar: "bg-rose-500" },
  earned: { icon: Briefcase, accent: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  maternity: { icon: Baby, accent: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  other: { icon: FileText, accent: "bg-soft text-fg-muted", bar: "bg-slate-400" },
};

const STATUS: Record<TeacherLeave["status"], { label: string; tone: BadgeTone }> = {
  pending: { label: "Awaiting approval", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

type Filter = "all" | TeacherLeave["status"];

export function TeacherLeaveView({ slug }: { slug: string }) {
  const { teacher, teachers, leaves, leaveUsage } = useTeacher(slug);
  const [filter, setFilter] = useState<Filter>("all");
  const [deciding, setDeciding] = useState<{ leave: TeacherLeave; approve: boolean } | null>(null);
  const [adding, setAdding] = useState(false);
  const [previewing, setPreviewing] = useState<TeacherLeave | null>(null);
  if (!teacher || !leaves || !leaveUsage) return null;

  const shown = filter === "all" ? leaves : leaves.filter((l) => l.status === filter);
  const counts = { all: leaves.length, pending: 0, approved: 0, rejected: 0 };
  for (const l of leaves) counts[l.status] += 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {leaveUsage.map((u) => {
          const { icon: Icon, accent, bar } = TYPE_ICON[u.type];
          return (
            <Card key={u.type} className="p-5">
              <div className="flex items-center gap-3">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accent)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg-muted">{u.label}</p>
                  <p className="text-xl font-bold tabular-nums text-fg">
                    {u.left}
                    <span className="text-sm font-medium text-fg-muted"> / {u.quota} left</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-soft">
                <div className={cn("h-full rounded-full", bar)} style={{ width: `${Math.min(100, (u.used / u.quota) * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-fg-subtle">{u.used} day(s) used this year</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  filter === f ? "bg-fg text-surface" : "bg-soft text-fg-muted hover:text-fg",
                )}
              >
                {f === "all" ? "All" : STATUS[f].label} · {counts[f]}
              </button>
            ))}
          </div>
          <Button onClick={() => setAdding(true)} disabled={teacher.status === "left"}>
            <CalendarPlus className="h-4 w-4" />
            Add leave
          </Button>
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={CalendarPlus} title="No leave requests" description="Requests from the teacher portal and leave added by admins appear here." />
        ) : (
          <ul className="mt-5 space-y-3">
            {shown.map((l) => {
              const { icon: Icon, accent } = TYPE_ICON[l.type];
              const days = schoolDaysBetween(l.from, l.to).length;
              return (
                <li key={l.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accent)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-fg">{TEACHER_LEAVE_LABEL[l.type]}</p>
                        <Badge tone={STATUS[l.status].tone} dot>
                          {STATUS[l.status].label}
                        </Badge>
                        {l.status === "approved" && l.from <= localToday() && l.to >= localToday() && <Badge tone="violet">On leave now</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-fg-secondary">
                        {formatDate(l.from)}
                        {l.to !== l.from && ` → ${formatDate(l.to)}`} · <span className="font-medium">{days} school day(s)</span>
                      </p>
                      <p className="mt-1 text-sm text-fg-muted">“{l.reason}”</p>
                      <p className="mt-1.5 text-xs text-fg-subtle">
                        {l.id} · via {l.submittedBy} · {formatDateTime(l.submittedAt)}
                      </p>
                      {l.substitute && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1 text-xs text-fg-secondary">
                          <UserCheck className="h-3.5 w-3.5" />
                          Substitute: <span className="font-semibold">{l.substitute}</span>
                        </p>
                      )}
                      {l.decision && (
                        <p className="mt-2 text-xs text-fg-muted">
                          {l.status === "approved" ? "Approved" : "Rejected"} by {l.decision.by} · {formatDateTime(l.decision.at)}
                          {l.decision.note && ` — “${l.decision.note}”`}
                        </p>
                      )}
                      {l.attachment && (
                        <div className="mt-3 inline-flex items-center gap-1 rounded-xl border border-line py-1 pl-3 pr-1 text-xs">
                          <Paperclip className="h-3.5 w-3.5 text-fg-subtle" />
                          <span className="mr-1 font-medium text-fg">{l.attachment}</span>
                          <button type="button" onClick={() => setPreviewing(l)} aria-label="Preview attachment" className="rounded-lg p-1 text-fg-subtle hover:bg-soft hover:text-indigo-600">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadTeacherLeaveAttachment(l, teacher).catch(() => toast("Download failed", { tone: "error" }))}
                            aria-label="Download attachment"
                            className="rounded-lg p-1 text-fg-subtle hover:bg-soft hover:text-indigo-600"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      {l.status === "pending" ? (
                        <>
                          <Button size="sm" onClick={() => setDeciding({ leave: l, approve: true })}>
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeciding({ leave: l, approve: false })}>
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        l.to >= localToday() && (
                          <Button size="sm" variant="ghost" onClick={() => setDeciding({ leave: l, approve: l.status !== "approved" })}>
                            {l.status === "approved" ? "Revoke" : "Approve instead"}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {deciding && (
        <LeaveDecisionDialog leave={deciding.leave} approve={deciding.approve} teacher={teacher} teachers={teachers} usage={leaveUsage} onClose={() => setDeciding(null)} />
      )}
      {adding && <NewTeacherLeaveDialog teacher={teacher} teachers={teachers} usage={leaveUsage} onClose={() => setAdding(false)} />}
      {previewing && (
        <FilePreviewDialog
          fileName={previewing.attachment ?? "attachment.pdf"}
          description={`${TEACHER_LEAVE_LABEL[previewing.type]} · ${teacher.name} · ${previewing.id}`}
          load={() => loadTeacherLeaveAttachment(previewing, teacher)}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
