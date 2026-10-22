"use client";

import { useState } from "react";
import { CalendarCheck, CalendarPlus, CalendarX, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER } from "@/features/admissions/constants";
import { formatDate, uid } from "@/features/admissions/utils";
import { localToday, schoolDaysBetween } from "@/features/students/demoData/profile-data";
import { putFile } from "@/lib/indexed-db-storage";
import { toast } from "@/store/toast.store";

import { TEACHER_LEAVE_LABEL } from "../../../demoData/mock-data";
import { teacherLeaveFileKey } from "../../../files";
import { useTeacherAdminStore } from "../../../store/teacher-admin.store";
import type { Teacher, TeacherLeave, TeacherLeaveType } from "../../../types/types";

type Usage = { type: TeacherLeaveType; label: string; quota: number; used: number; left: number };

/** Substitute candidates: active colleagues, same department first. */
function SubstituteSelect({ teacher, teachers, value, onChange }: { teacher: Teacher; teachers: Teacher[]; value: string; onChange: (v: string) => void }) {
  const others = teachers.filter((t) => t.id !== teacher.id && t.status !== "left");
  const same = others.filter((t) => t.department === teacher.department);
  const rest = others.filter((t) => t.department !== teacher.department);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-11">
      <option value="">No substitute needed</option>
      {same.length > 0 && (
        <optgroup label={`${teacher.department} department`}>
          {same.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name} · {t.subjects.join(", ")}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="Other teachers">
        {rest.map((t) => (
          <option key={t.id} value={t.name}>
            {t.name} · {t.subjects.join(", ")}
          </option>
        ))}
      </optgroup>
    </Select>
  );
}

/**
 * Approve / reject a teacher's leave request. On approval a substitute can be
 * assigned to cover the classes and the days show as leave in attendance.
 * BACKEND: POST /teacher-leaves/:id/decision  { approved, note, substitute }
 */
export function LeaveDecisionDialog({
  leave,
  approve,
  teacher,
  teachers,
  usage,
  onClose,
}: {
  leave: TeacherLeave;
  approve: boolean;
  teacher: Teacher;
  teachers: Teacher[];
  usage: Usage[];
  onClose: () => void;
}) {
  const decideLeave = useTeacherAdminStore((s) => s.decideLeave);
  const [note, setNote] = useState("");
  const [substitute, setSubstitute] = useState(leave.substitute ?? "");
  const [error, setError] = useState("");
  const days = schoolDaysBetween(leave.from, leave.to).length;
  const balance = usage.find((u) => u.type === leave.type);
  const overQuota = approve && balance && balance.quota > 0 && days > balance.left;

  function submit() {
    if (!approve && note.trim().length < 3) {
      setError("Tell the teacher why the leave was rejected.");
      return;
    }
    decideLeave(leave, approve, note.trim(), approve ? substitute || undefined : undefined);
    toast(approve ? "Leave approved" : "Leave rejected", {
      description: `${teacher.name} · ${formatDate(leave.from)}${leave.to !== leave.from ? ` → ${formatDate(leave.to)}` : ""} · SMS sent`,
      tone: approve ? "success" : "info",
    });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={approve ? "Approve leave" : "Reject leave"}
      description={`${TEACHER_LEAVE_LABEL[leave.type]} · ${days} school day(s) · ${formatDate(leave.from)}${leave.to !== leave.from ? ` → ${formatDate(leave.to)}` : ""}`}
      icon={
        <span className={approve ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"}>
          {approve ? <CalendarCheck className="h-5 w-5" /> : <CalendarX className="h-5 w-5" />}
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={approve ? "primary" : "danger"} onClick={submit}>
            {approve ? "Approve leave" : "Reject leave"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-subtle p-3.5 text-sm text-fg-secondary">“{leave.reason}”</div>
        {balance && balance.quota > 0 && (
          <p className={overQuota ? "rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700" : "text-sm text-fg-muted"}>
            {balance.label} balance: <span className="font-semibold">{balance.left}</span> of {balance.quota} day(s) left this year.
            {overQuota && " This request is over the balance — extra days will count as leave without pay."}
          </p>
        )}
        {approve && (
          <FormField label="Substitute teacher" hint="Covers this teacher's classes during the leave. Notified by SMS.">
            <SubstituteSelect teacher={teacher} teachers={teachers} value={substitute} onChange={setSubstitute} />
          </FormField>
        )}
        <FormField label={approve ? "Note (optional)" : "Reason for rejection"} required={!approve} error={error}>
          <Textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError("");
            }}
            rows={3}
            invalid={!!error}
            placeholder={approve ? "e.g. Get well soon." : "e.g. Half-yearly exams are running that week."}
          />
        </FormField>
      </div>
    </Dialog>
  );
}

/**
 * Leave filed by the admin on the teacher's behalf (phone call, paper form).
 * BACKEND: POST /teachers/:id/leaves (multipart for the attachment)
 */
export function NewTeacherLeaveDialog({ teacher, teachers, usage, onClose }: { teacher: Teacher; teachers: Teacher[]; usage: Usage[]; onClose: () => void }) {
  const addLeave = useTeacherAdminStore((s) => s.addLeave);
  const decideLeave = useTeacherAdminStore((s) => s.decideLeave);
  const today = localToday();
  const types = (Object.keys(TEACHER_LEAVE_LABEL) as TeacherLeaveType[]).filter((t) => t !== "maternity" || teacher.gender === "Female");
  const [type, setType] = useState<TeacherLeaveType>("casual");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [approveNow, setApproveNow] = useState(true);
  const [substitute, setSubstitute] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const days = from && to && to >= from ? schoolDaysBetween(from, to).length : 0;
  const balance = usage.find((u) => u.type === type);

  async function submit() {
    const next: Record<string, string> = {};
    if (!from) next.from = "Pick the first day.";
    if (!to || to < from) next.to = "Must be on or after the first day.";
    if (reason.trim().length < 3) next.reason = "Enter the reason.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const id = `TL-${uid().slice(0, 6).toUpperCase()}`;
    if (file) await putFile(teacherLeaveFileKey(id), file).catch(() => undefined);
    const leave: TeacherLeave = {
      id,
      teacherId: teacher.id,
      type,
      from,
      to,
      reason: reason.trim(),
      attachment: file?.name,
      submittedAt: new Date().toISOString(),
      submittedBy: CURRENT_USER,
      status: "pending",
    };
    addLeave(leave);
    if (approveNow) decideLeave(leave, true, "Filed and approved by admin.", substitute || undefined);
    toast(approveNow ? "Leave recorded & approved" : "Leave request added", { description: `${teacher.name} · ${days} school day(s)` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Add leave"
      description={`On behalf of ${teacher.name}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <CalendarPlus className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()}>{approveNow ? "Save & approve" : "Save as pending"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid className="lg:grid-cols-3">
          <FormField label="Leave type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as TeacherLeaveType)} className="h-11">
              {types.map((t) => (
                <option key={t} value={t}>
                  {TEACHER_LEAVE_LABEL[t]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="From" required error={errors.from}>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} invalid={!!errors.from} />
          </FormField>
          <FormField label="To" required error={errors.to}>
            <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} invalid={!!errors.to} />
          </FormField>
        </FieldGrid>
        <p className="text-sm text-fg-muted">
          <span className="font-semibold text-fg">{days}</span> school day(s)
          {balance && balance.quota > 0 && (
            <>
              {" "}
              · balance {balance.left}/{balance.quota}
              {days > balance.left && <span className="font-medium text-amber-600"> — over the balance</span>}
            </>
          )}
        </p>
        <FormField label="Reason" required error={errors.reason}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} invalid={!!errors.reason} />
        </FormField>
        <FormField label="Attachment" hint="Medical certificate, application letter… (PDF or image)">
          {file ? (
            <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm">
              <Paperclip className="h-4 w-4 text-fg-subtle" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment" className="rounded p-1 text-fg-subtle hover:bg-soft">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="pt-2.5" />
          )}
        </FormField>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-fg">Approve immediately</span>
            <span className="block text-xs text-fg-muted">Marks the days as leave in attendance</span>
          </span>
          <Switch checked={approveNow} onCheckedChange={setApproveNow} aria-label="Approve immediately" />
        </label>
        {approveNow && (
          <FormField label="Substitute teacher">
            <SubstituteSelect teacher={teacher} teachers={teachers} value={substitute} onChange={setSubstitute} />
          </FormField>
        )}
      </div>
    </Dialog>
  );
}
