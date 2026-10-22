"use client";

import { useState } from "react";
import { Info, Mail, MessageSquareText, RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { QUICK_REASONS, REASON_REQUIRED, STATUS_CONFIG } from "../constants";
import { useAdmissionsStore } from "../store/admissions.store";
import type { Admission, AdmissionStatus, NotificationChannel } from "../types/types";
import { buildStatusMessage, contactOf, smsSegments } from "../utils";

type StatusUpdateDialogProps = {
  /** One or more applications (bulk). */
  admissions: Admission[];
  status: AdmissionStatus;
  onClose: () => void;
};

const TITLES: Record<AdmissionStatus, string> = {
  pending: "Move back to pending",
  in_review: "Start reviewing",
  approved: "Approve admission",
  waitlisted: "Move to waiting list",
  rejected: "Reject application",
};

/**
 * Change status + tell the guardian why.
 *
 * BACKEND CONTRACT — on confirm the UI calls (per application):
 *   PATCH /admissions/:id/status
 *   { status, note, notify: { channels: ["sms","email"], message } }
 * The server saves the status + activity entry, then queues the message to the
 * SMS gateway / email service and reports delivery back (queued → sent | failed).
 */
export function StatusUpdateDialog({ admissions, status, onClose }: StatusUpdateDialogProps) {
  const changeStatus = useAdmissionsStore((s) => s.changeStatus);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isBulk = admissions.length > 1;
  const first = admissions[0]!;
  const contact = contactOf(first);
  const reasonRequired = REASON_REQUIRED.includes(status);

  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(Boolean(contact.email) || isBulk);
  /** `null` = use the generated template; a string = the admin edited the text. */
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  const message = customMessage ?? buildStatusMessage(status, first, note);
  const channels: NotificationChannel[] = [...(sms ? (["sms"] as const) : []), ...(email ? (["email"] as const) : [])];

  function confirm() {
    if (reasonRequired && !note.trim()) {
      setNoteError(`Please write why — the guardian will see this reason.`);
      return;
    }
    changeStatus(
      admissions.map((a) => a.id),
      status,
      {
        note,
        channels,
        // Bulk updates personalise the template for every guardian.
        messageFor: (a) => (isBulk || customMessage === null ? buildStatusMessage(status, a, note) : customMessage),
      },
    );
    const who = isBulk ? `${admissions.length} applications` : first.studentName;
    toast(`${who} · ${config.label}`, {
      description: channels.length
        ? `${channels.map((c) => (c === "sms" ? "SMS" : "Email")).join(" & ")} queued for ${isBulk ? "each guardian" : contact.name || "the guardian"}.`
        : "Status updated without notifying the guardian.",
    });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={TITLES[status]}
      description={
        isBulk
          ? `${admissions.length} applications will be marked as ${config.label}.`
          : `${first.studentName} · ${first.id} · ${first.applyingClass}`
      }
      icon={
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", config.accent)}>
          <Icon className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={status === "rejected" ? "danger" : "primary"} onClick={confirm}>
            <Send className="h-4 w-4" />
            {channels.length ? `${config.action} & notify` : config.action}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Reason */}
        <div>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-fg-secondary">
              {status === "rejected" ? "Reason for rejection" : status === "waitlisted" ? "Reason for waitlisting" : "Note"}
              {reasonRequired ? <span className="text-rose-500">*</span> : <span className="text-xs font-normal text-fg-subtle">(optional)</span>}
            </span>
            <Textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteError("");
              }}
              invalid={!!noteError}
              placeholder={reasonRequired ? "Explain the decision clearly — it is included in the message to the guardian." : "Add a remark for the activity log."}
              className="min-h-20"
              autoFocus
            />
          </label>
          {noteError && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{noteError}</p>}
          {QUICK_REASONS[status] && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {QUICK_REASONS[status]!.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setNote(reason);
                    setNoteError("");
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    note === reason ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-secondary hover:bg-subtle",
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notify guardian */}
        <div className="rounded-2xl border border-line">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-fg">Notify guardian</p>
              <p className="text-xs text-fg-muted">
                {isBulk ? "Each guardian receives a personalised message." : `${contact.name || "Guardian"} (${contact.relation})`}
              </p>
            </div>
          </div>
          <div className="divide-y divide-line">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">SMS</p>
                <p className="truncate text-xs text-fg-muted">{isBulk ? "To each primary contact's mobile" : contact.phone || "No mobile number on file"}</p>
              </div>
              <Switch checked={sms} onCheckedChange={setSms} aria-label="Send SMS" disabled={!isBulk && !contact.phone} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Mail className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">Email</p>
                <p className="truncate text-xs text-fg-muted">{isBulk ? "Skipped automatically when no email is on file" : contact.email || "No email on file"}</p>
              </div>
              <Switch checked={email} onCheckedChange={setEmail} aria-label="Send email" disabled={!isBulk && !contact.email} />
            </div>
          </div>
        </div>

        {/* Message preview */}
        {channels.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-fg-secondary">{isBulk ? `Message preview (${first.studentName})` : "Message"}</p>
              {customMessage !== null && (
                <button type="button" onClick={() => setCustomMessage(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  <RotateCcw className="h-3 w-3" />
                  Use template
                </button>
              )}
            </div>
            <div className="rounded-2xl bg-subtle p-4">
              {isBulk ? (
                <p className="max-w-md rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-sm leading-relaxed text-fg shadow-card">{message}</p>
              ) : (
                <textarea
                  value={message}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  aria-label="Message to guardian"
                  rows={4}
                  className="w-full resize-none rounded-2xl rounded-bl-md border-0 bg-surface px-4 py-3 text-sm leading-relaxed text-fg shadow-card focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              )}
              <p className="mt-2 text-right text-[11px] text-fg-subtle">
                {message.length} characters · {smsSegments(message)} SMS {smsSegments(message) > 1 ? "parts" : "part"}
              </p>
            </div>
          </div>
        )}

        <p className="flex gap-2 rounded-xl bg-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-indigo-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Messages are <strong>queued</strong> when you save and delivered by the school&apos;s SMS / email service. Delivery status
            appears in the application&apos;s activity log.
          </span>
        </p>
      </div>
    </Dialog>
  );
}
