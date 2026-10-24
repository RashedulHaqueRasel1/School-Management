"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER } from "@/features/admissions/constants";
import { formatDate, uid } from "@/features/admissions/utils";
import { addDaysIso, localToday } from "@/features/students/demoData/profile-data";
import { toast } from "@/store/toast.store";

import { MEETING_MODES, buildTemplate } from "../../../demoData/mock-data";
import { useParentAdminStore } from "../../../store/parent-admin.store";
import type { MeetingMode, Parent, ParentMeeting } from "../../../types/types";

const to12h = (time: string) => {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export const formatMeetingTime = (m: Pick<ParentMeeting, "date" | "time">) => `${formatDate(m.date)} · ${to12h(m.time)}`;

/**
 * Schedule a parent–teacher meeting; optionally SMS the invitation.
 * BACKEND: POST /parents/:id/meetings  (+ notify)
 */
export function ScheduleMeetingDialog({ parent, teacherOf, onClose }: { parent: Parent; teacherOf: (studentId: string) => string; onClose: () => void }) {
  const addMeeting = useParentAdminStore((s) => s.addMeeting);
  const sendMessages = useParentAdminStore((s) => s.sendMessages);
  const children = parent.links.filter((l) => l.student.status !== "left");
  const [studentId, setStudentId] = useState(children[0]?.student.id ?? "");
  const [date, setDate] = useState(addDaysIso(localToday(), 3));
  const [time, setTime] = useState("10:30");
  const [mode, setMode] = useState<MeetingMode>("In person");
  const [withWhom, setWithWhom] = useState(children[0] ? teacherOf(children[0].student.id) : "");
  const [agenda, setAgenda] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState("");
  const student = children.find((l) => l.student.id === studentId)?.student;

  function submit() {
    if (!student) return;
    if (date < localToday()) return setError("Pick today or a later date.");
    if (agenda.trim().length < 3) return setError("Write the agenda.");
    const meeting: ParentMeeting = {
      id: uid(),
      parentKey: parent.key,
      studentId: student.id,
      studentName: student.name,
      date,
      time,
      mode,
      withWhom: withWhom.trim() || "Class teacher",
      agenda: agenda.trim(),
      status: "scheduled",
      createdAt: new Date().toISOString(),
      createdBy: CURRENT_USER,
    };
    addMeeting(meeting);
    if (notify) {
      const t = buildTemplate("meeting", { guardian: parent.name, child: student.name.split(" ")[0], date: `${formatMeetingTime(meeting)} (${mode.toLowerCase()})` });
      sendMessages([{ id: uid(), parentKey: parent.key, template: "meeting", channel: "sms", ...t, studentName: student.name, sentAt: new Date().toISOString(), sentBy: CURRENT_USER, status: "sent" }]);
    }
    toast("Meeting scheduled", { description: `${formatMeetingTime(meeting)}${notify ? " · invitation SMS sent" : ""}` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Schedule meeting"
      description={`With ${parent.name}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <CalendarClock className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!student}>
            Schedule
          </Button>
        </>
      }
    >
      {children.length === 0 ? (
        <p className="text-sm text-fg-muted">No current students linked to this guardian.</p>
      ) : (
        <div className="space-y-4">
          <FieldGrid>
            <FormField label="About" required>
              <Select
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setWithWhom(teacherOf(e.target.value));
                }}
                className="h-11"
              >
                {children.map((l) => (
                  <option key={l.student.id} value={l.student.id}>
                    {l.student.name} · {l.student.className} {l.student.section}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="With" hint="Class teacher by default">
              <Input value={withWhom} onChange={(e) => setWithWhom(e.target.value)} />
            </FormField>
            <FormField label="Date" required>
              <Input type="date" value={date} min={localToday()} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label="Time" required>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </FormField>
            <FormField label="Mode">
              <Select value={mode} onChange={(e) => setMode(e.target.value as MeetingMode)} className="h-11">
                {MEETING_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </FormField>
          </FieldGrid>
          <FormField label="Agenda" required error={error}>
            <Textarea
              value={agenda}
              onChange={(e) => {
                setAgenda(e.target.value);
                setError("");
              }}
              rows={3}
              invalid={!!error}
              placeholder="e.g. Repeated late arrivals and maths homework"
            />
          </FormField>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
            <span className="text-sm font-medium text-fg">Send invitation SMS</span>
            <Switch checked={notify} onCheckedChange={setNotify} aria-label="Send invitation SMS" />
          </label>
        </div>
      )}
    </Dialog>
  );
}

/** Mark a meeting completed (with notes), cancelled or no-show. BACKEND: PATCH /parent-meetings/:id */
export function MeetingOutcomeDialog({ meeting, onClose }: { meeting: ParentMeeting; onClose: () => void }) {
  const updateMeeting = useParentAdminStore((s) => s.updateMeeting);
  const [status, setStatus] = useState<ParentMeeting["status"]>("completed");
  const [outcome, setOutcome] = useState("");
  const [error, setError] = useState("");

  return (
    <Dialog
      open
      onClose={onClose}
      title="Update meeting"
      description={`${formatMeetingTime(meeting)} · ${meeting.studentName}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              if (status === "completed" && outcome.trim().length < 3) return setError("Write what was discussed / agreed.");
              const label = { completed: "Meeting completed", cancelled: "Meeting cancelled", "no-show": "Guardian did not attend", scheduled: "Meeting rescheduled" }[status];
              updateMeeting(meeting, { status, outcome: outcome.trim() || undefined }, label);
              toast(label);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Result">
          <Select value={status} onChange={(e) => setStatus(e.target.value as ParentMeeting["status"])} className="h-11">
            <option value="completed">Completed</option>
            <option value="no-show">Guardian did not attend</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FormField>
        <FormField label={status === "completed" ? "Discussion & agreed actions" : "Note"} required={status === "completed"} error={error}>
          <Textarea
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              setError("");
            }}
            rows={4}
            invalid={!!error}
          />
        </FormField>
      </div>
    </Dialog>
  );
}
