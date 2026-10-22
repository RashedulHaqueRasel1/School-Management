"use client";

import { useState } from "react";
import { CalendarPlus, CheckCircle2, Paperclip, X, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER } from "@/features/admissions/constants";
import { formatDate, uid } from "@/features/admissions/utils";
import { putFile } from "@/lib/indexed-db-storage";
import { toast } from "@/store/toast.store";

import { LEAVE_TYPES, localToday, schoolDaysBetween } from "../../../demoData/profile-data";
import { useStudentAdminStore } from "../../../store/student-admin.store";
import { leaveFileKey } from "../../../leave-files";
import type { LeaveRequest, LeaveType, Student } from "../../../types/types";

/**
 * Approve / reject a leave request as admin (final decision). If the class
 * teacher hasn't decided yet, the admin overrides that step.
 * BACKEND: POST /leave-requests/:id/decision  { role: "admin", approved, note, notifyGuardian }
 */
export function LeaveDecisionDialog({ request, approve, onClose }: { request: LeaveRequest; approve: boolean; onClose: () => void }) {
  const decideLeave = useStudentAdminStore((s) => s.decideLeave);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState("");
  const days = schoolDaysBetween(request.from, request.to).length;
  const skipsTeacher = request.stage === "teacher";

  function save() {
    if (!approve && !note.trim()) return setError("Please give a reason — the student and guardian will see it.");
    decideLeave(request, "Admin", approve, note.trim());
    toast(approve ? "Leave approved" : "Leave rejected", {
      description: `${formatDate(request.from)}${request.to !== request.from ? ` – ${formatDate(request.to)}` : ""}${notify ? " · guardian notified" : ""}`,
      tone: approve ? "success" : "info",
    });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title={approve ? "Approve leave request" : "Reject leave request"}
      description={`${LEAVE_TYPES[request.type]} · ${days} school day${days === 1 ? "" : "s"}`}
      icon={
        <span className={approve ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"}>
          {approve ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={approve ? "primary" : "danger"} onClick={save}>
            {approve ? "Approve leave" : "Reject leave"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-subtle p-4 text-sm">
          <p className="font-semibold text-fg">
            {formatDate(request.from)}
            {request.to !== request.from && ` → ${formatDate(request.to)}`}
          </p>
          <p className="mt-1 text-fg-secondary">“{request.reason}”</p>
          {request.teacherDecision && (
            <p className="mt-2 text-xs text-fg-muted">
              Class teacher {request.teacherDecision.approved ? "recommended" : "did not recommend"} · {request.teacherDecision.by}
              {request.teacherDecision.note && ` — ${request.teacherDecision.note}`}
            </p>
          )}
        </div>
        {skipsTeacher && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
            The class teacher hasn&apos;t reviewed this yet. As admin your decision is final and the teacher step will be marked as overridden.
          </p>
        )}
        <FormField label={approve ? "Note" : "Reason for rejection"} required={!approve} error={error}>
          <Textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError("");
            }}
            placeholder={approve ? "Optional note for the student and guardian" : "e.g. Exam week — leave not possible on these dates."}
            className="min-h-20"
            invalid={!!error}
          />
        </FormField>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
          <span className="text-sm">
            <span className="font-medium text-fg">Notify student & guardian</span>
            <span className="block text-xs text-fg-muted">Portal notification + SMS to the primary guardian</span>
          </span>
          <Switch checked={notify} onCheckedChange={setNotify} aria-label="Notify" />
        </label>
      </div>
    </Dialog>
  );
}

/**
 * File a leave on the student's behalf (e.g. guardian phoned the office).
 * BACKEND: POST /students/:id/leave-requests  { type, from, to, reason, autoApprove }
 */
export function NewLeaveDialog({ student, onClose }: { student: Student; onClose: () => void }) {
  const addLeave = useStudentAdminStore((s) => s.addLeave);
  const today = localToday();
  const [type, setType] = useState<LeaveType>("sick");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");
  const [approveNow, setApproveNow] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const days = from && to && to >= from ? schoolDaysBetween(from, to).length : 0;

  function save() {
    if (!from || !to || to < from) return setError("Choose a valid date range.");
    if (!reason.trim()) return setError("Write the reason for the leave.");
    if (file && file.size > 10 * 1024 * 1024) return setError("Attachment must be smaller than 10 MB.");
    const now = new Date().toISOString();
    const id = `LV-${uid().slice(0, 8)}`;
    if (file) void putFile(leaveFileKey(id), file).catch(() => toast("Attachment could not be saved in this browser", { tone: "error" }));
    addLeave({
      id,
      attachment: file?.name,
      studentId: student.id,
      type,
      from,
      to,
      reason: reason.trim(),
      submittedAt: now,
      submittedBy: CURRENT_USER,
      stage: approveNow ? "approved" : "teacher",
      adminDecision: approveNow ? { by: CURRENT_USER, role: "Admin", at: now, approved: true, note: "Filed and approved by the office." } : undefined,
    });
    toast(approveNow ? "Leave recorded & approved" : "Leave request sent to class teacher", { description: `${days} school day(s) · ${LEAVE_TYPES[type]}` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Add leave"
      description={`On behalf of ${student.name} — e.g. when a guardian calls the office.`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <CalendarPlus className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{approveNow ? "Add & approve" : "Send for approval"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <FieldGrid className="lg:grid-cols-3">
          <FormField label="Leave type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as LeaveType)} className="h-11">
              {(Object.keys(LEAVE_TYPES) as LeaveType[]).map((t) => (
                <option key={t} value={t}>
                  {LEAVE_TYPES[t]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="From" required>
            <Input type="date" value={from} min={student.enrolledOn} onChange={(e) => setFrom(e.target.value)} />
          </FormField>
          <FormField label="To" required hint={days ? `${days} school day(s)` : undefined}>
            <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </FormField>
        </FieldGrid>
        <FormField label="Reason" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Guardian called — high fever, doctor advised rest." className="min-h-20" />
        </FormField>
        <FormField label="Attachment" hint="Medical certificate, invitation card… PDF or image, up to 10 MB.">
          {file ? (
            <span className="flex items-center gap-2 rounded-xl border border-line-strong px-3 py-2.5 text-sm">
              <Paperclip className="h-4 w-4 text-fg-subtle" />
              <span className="min-w-0 flex-1 truncate font-medium text-fg">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment" className="rounded-md p-1 text-fg-subtle hover:bg-soft hover:text-rose-600">
                <X className="h-4 w-4" />
              </button>
            </span>
          ) : (
            <Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-indigo-700" />
          )}
        </FormField>
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
          <span className="text-sm">
            <span className="font-medium text-fg">Approve immediately</span>
            <span className="block text-xs text-fg-muted">Off: goes through class teacher → admin like a student request</span>
          </span>
          <Switch checked={approveNow} onCheckedChange={setApproveNow} aria-label="Approve immediately" />
        </label>
      </div>
    </Dialog>
  );
}
