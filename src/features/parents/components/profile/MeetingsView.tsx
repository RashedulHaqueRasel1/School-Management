"use client";

import { useState } from "react";
import { CalendarClock, CalendarPlus, CheckCircle2, MapPin, UserRound, XCircle } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useParent } from "../../hooks/use-parent";
import { useParentAdminStore } from "../../store/parent-admin.store";
import type { ParentMeeting } from "../../types/types";
import { MeetingOutcomeDialog, ScheduleMeetingDialog, formatMeetingTime } from "./admin/MeetingDialogs";

const STATUS: Record<ParentMeeting["status"], { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Scheduled", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  "no-show": { label: "Did not attend", tone: "danger" },
};

export function ParentMeetingsView({ slug }: { slug: string }) {
  const { parent, meetings, teacherOf } = useParent(slug);
  const updateMeeting = useParentAdminStore((s) => s.updateMeeting);
  const [scheduling, setScheduling] = useState(false);
  const [updating, setUpdating] = useState<ParentMeeting | null>(null);
  if (!parent || !meetings || !teacherOf) return null;

  const today = localToday();
  const upcoming = meetings.filter((m) => m.status === "scheduled").reverse();
  const past = meetings.filter((m) => m.status !== "scheduled");
  const completed = past.filter((m) => m.status === "completed").length;

  const row = (m: ParentMeeting) => {
    const overdue = m.status === "scheduled" && m.date < today;
    return (
      <li key={m.id}>
        <Card className={cn("p-5", overdue && "ring-1 ring-amber-300")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", m.status === "scheduled" ? "bg-violet-50 text-violet-600" : "bg-soft text-fg-muted")}>
              <CalendarClock className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-fg">{formatMeetingTime(m)}</p>
                <Badge tone={STATUS[m.status].tone} dot>
                  {STATUS[m.status].label}
                </Badge>
                {overdue && <Badge tone="warning">Needs update</Badge>}
              </div>
              <p className="mt-1 text-sm text-fg-secondary">{m.agenda}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
                <span className="flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" />
                  {m.studentName} · with {m.withWhom}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {m.mode}
                </span>
              </p>
              {m.outcome && <p className="mt-3 rounded-xl bg-subtle px-3.5 py-2.5 text-sm text-fg-secondary">“{m.outcome}”</p>}
            </div>
            {m.status === "scheduled" && (
              <div className="flex gap-2 sm:flex-col">
                <Button size="sm" onClick={() => setUpdating(m)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Record result
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    updateMeeting(m, { status: "cancelled" }, "Meeting cancelled");
                    toast("Meeting cancelled", { description: formatMeetingTime(m) });
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Parent–teacher meetings</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {upcoming.length} upcoming · {completed} completed · {past.length - completed} cancelled / missed
          </p>
        </div>
        <Button onClick={() => setScheduling(true)} disabled={parent.inactive}>
          <CalendarPlus className="h-4 w-4" />
          Schedule meeting
        </Button>
      </Card>

      {meetings.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarClock} title="No meetings yet" description="Schedule a meeting with this guardian and the class teacher." />
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Upcoming</h3>
              <ol className="space-y-3">{upcoming.map(row)}</ol>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">History</h3>
              <ol className="space-y-3">{past.map(row)}</ol>
            </section>
          )}
        </>
      )}

      {scheduling && <ScheduleMeetingDialog parent={parent} teacherOf={teacherOf} onClose={() => setScheduling(false)} />}
      {updating && <MeetingOutcomeDialog meeting={updating} onClose={() => setUpdating(null)} />}
    </div>
  );
}
