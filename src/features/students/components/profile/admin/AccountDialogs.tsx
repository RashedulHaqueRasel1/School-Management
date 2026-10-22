"use client";

import { useState } from "react";
import { Ban, CalendarClock, Check, Copy, KeyRound, PowerOff, RefreshCw, ShieldAlert, ShieldCheck, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { localToday } from "../../../demoData/profile-data";
import type { AccountStatus, StudentAccount } from "../../../types/types";

/** Who the dialogs act on — a student or a staff member. */
export type AccountSubject = {
  name: string;
  /** "student" | "teacher" — used in the wording. */
  kind: string;
  /** SMS recipient for credentials / notices (guardian for students, self for staff). */
  smsTo: { name: string; phone: string };
  /** Persist an account change; `action` / `detail` go to the audit log. */
  onUpdate: (patch: Partial<StudentAccount>, action: string, detail?: string) => void;
};

const WORDS = ["Mango", "River", "Tiger", "Lotus", "Cloud", "Falcon", "Jasmine", "Comet", "Pearl", "Maple", "Orbit", "Delta"];

/** Easy to read out over the phone, hard to guess: Word-1234-Word! */
function generatePassword() {
  const pick = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0]! % n;
  const digits = String(1000 + pick(9000));
  return `${WORDS[pick(WORDS.length)]}-${digits}-${WORDS[pick(WORDS.length)]}!`;
}

/**
 * Generate a temporary portal password. It is shown once and never stored.
 * BACKEND: POST /{students|teachers}/:id/account/reset-password  { mustChange, sendSmsTo }
 *          → server generates + hashes the password and sends the SMS itself.
 */
export function ResetPasswordDialog({ subject, account, onClose }: { subject: AccountSubject; account: StudentAccount; onClose: () => void }) {
  const { smsTo } = subject;
  const [password, setPassword] = useState(generatePassword);
  const [mustChange, setMustChange] = useState(true);
  const [sendSms, setSendSms] = useState(Boolean(smsTo.phone));
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  function confirm() {
    subject.onUpdate(
      { passwordChangedAt: new Date().toISOString(), mustChangePassword: mustChange },
      "Password reset",
      `${sendSms ? `Sent by SMS to ${smsTo.phone}` : "Handed over by the office"}${mustChange ? " · must change at next login" : ""}`,
    );
    toast("Password reset", { description: sendSms ? `SMS queued to ${smsTo.phone}` : `Share the password with the ${subject.kind}.` });
    setDone(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy", { description: "Select the password and copy it manually.", tone: "error" });
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title={done ? "New password created" : "Reset portal password"}
      description={`${subject.name} · username ${account.username}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <KeyRound className="h-5 w-5" />
        </span>
      }
      footer={
        done ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={confirm}>Reset password</Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-dashed border-line-strong bg-subtle p-4">
          <p className="text-xs font-medium text-fg-muted">{done ? "Temporary password — shown only once" : "Temporary password"}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 select-all rounded-xl bg-surface px-4 py-3 font-mono text-lg font-bold tracking-wide text-fg shadow-card">{password}</code>
            {done ? (
              <Button variant="outline" size="icon" onClick={copy} aria-label="Copy password">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            ) : (
              <Button variant="outline" size="icon" onClick={() => setPassword(generatePassword())} aria-label="Generate another">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {done ? (
          <p className="text-sm text-fg-secondary">
            {sendSms ? `Sent to ${smsTo.name} (${smsTo.phone}). ` : ""}
            {mustChange ? `The ${subject.kind} must choose a new password at the next login.` : `The ${subject.kind} can keep using this password.`} The old password no longer works.
          </p>
        ) : (
          <>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <span className="text-sm">
                <span className="font-medium text-fg">Require change at next login</span>
                <span className="block text-xs text-fg-muted">Recommended</span>
              </span>
              <Switch checked={mustChange} onCheckedChange={setMustChange} aria-label="Require change" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <span className="text-sm">
                <span className="font-medium text-fg">Send by SMS</span>
                <span className="block text-xs text-fg-muted">{smsTo.phone ? `${smsTo.name} · ${smsTo.phone}` : "No mobile number on file"}</span>
              </span>
              <Switch checked={sendSms} onCheckedChange={setSendSms} disabled={!smsTo.phone} aria-label="Send by SMS" />
            </label>
          </>
        )}
      </div>
    </Dialog>
  );
}

const DURATIONS: { key: string; label: string; days?: number; months?: number; years?: number }[] = [
  { key: "1d", label: "1 day", days: 1 },
  { key: "3d", label: "3 days", days: 3 },
  { key: "1w", label: "1 week", days: 7 },
  { key: "2w", label: "2 weeks", days: 14 },
  { key: "1m", label: "1 month", months: 1 },
  { key: "3m", label: "3 months", months: 3 },
  { key: "6m", label: "6 months", months: 6 },
  { key: "1y", label: "1 year", years: 1 },
  { key: "custom", label: "Until a date…" },
];

/** Last day of the suspension (inclusive) for a duration starting today. */
function untilDate(key: string) {
  const d = DURATIONS.find((x) => x.key === key)!;
  const date = new Date(`${localToday()}T00:00:00Z`);
  if (d.days) date.setUTCDate(date.getUTCDate() + d.days - 1);
  if (d.months) date.setUTCMonth(date.getUTCMonth() + d.months);
  if (d.years) date.setUTCFullYear(date.getUTCFullYear() + d.years);
  return date.toISOString().slice(0, 10);
}

const MODES: { status: Exclude<AccountStatus, "active">; title: string; text: string; icon: typeof Ban; accent: string }[] = [
  { status: "suspended", title: "Suspend", text: "For a set time — access returns automatically", icon: Timer, accent: "text-amber-600" },
  { status: "blocked", title: "Block", text: "Until an admin unblocks — e.g. misuse, security", icon: Ban, accent: "text-rose-600" },
  { status: "disabled", title: "Disable", text: "Switch the account off — e.g. duplicate, left school", icon: PowerOff, accent: "text-fg-muted" },
];

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  blocked: "Blocked",
  disabled: "Disabled",
};

/**
 * Suspend (for a period), block or disable portal access — or restore it.
 * In every non-active state the person cannot sign in to the portal.
 * BACKEND: PATCH /{students|teachers}/:id/account  { status, reason, suspendedUntil }
 *          → revoke active sessions; reject logins while not active
 *          (suspensions end automatically after `suspendedUntil`).
 */
export function AccessControlDialog({ subject, account, onClose }: { subject: AccountSubject; account: StudentAccount; onClose: () => void }) {
  const restricted = account.status !== "active";
  const [mode, setMode] = useState<Exclude<AccountStatus, "active">>("suspended");
  const [duration, setDuration] = useState("1w");
  const [customUntil, setCustomUntil] = useState(untilDate("1m"));
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState("");

  const until = duration === "custom" ? customUntil : untilDate(duration);
  const days = Math.round((Date.parse(`${until}T00:00:00Z`) - Date.parse(`${localToday()}T00:00:00Z`)) / 86_400_000) + 1;

  function apply() {
    if (restricted) {
      subject.onUpdate(
        { status: "active", statusReason: undefined, suspendedUntil: undefined, statusChangedAt: new Date().toISOString() },
        `Portal access restored (was ${ACCOUNT_STATUS_LABEL[account.status].toLowerCase()})`,
        reason.trim() || undefined,
      );
      toast("Access restored", { description: `${subject.name} can sign in again.` });
      return onClose();
    }
    if (!reason.trim()) return setError(`Write a reason — it is shown to the ${subject.kind} and kept in the audit log.`);
    if (mode === "suspended" && (!until || until < localToday())) return setError("Choose an end date from today onwards.");
    subject.onUpdate(
      {
        status: mode,
        statusReason: reason.trim(),
        suspendedUntil: mode === "suspended" ? until : undefined,
        statusChangedAt: new Date().toISOString(),
      },
      mode === "suspended" ? `Portal suspended until ${formatDate(until)}` : mode === "blocked" ? "Portal access blocked" : "Portal account disabled",
      `${reason.trim()}${notify ? ` · SMS to ${subject.smsTo.name} (${subject.smsTo.phone})` : ""}`,
    );
    toast(mode === "suspended" ? `Suspended for ${days} day${days === 1 ? "" : "s"}` : mode === "blocked" ? "Account blocked" : "Account disabled", {
      description: `${subject.name} is signed out and can't log in.`,
      tone: "info",
    });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={restricted ? "Restore portal access" : "Restrict portal access"}
      description={`${subject.name} · ${account.username}`}
      icon={
        <span className={restricted ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"}>
          {restricted ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={restricted ? "primary" : "danger"} onClick={apply}>
            {restricted ? "Restore access" : mode === "suspended" ? `Suspend until ${formatDate(until)}` : mode === "blocked" ? "Block account" : "Disable account"}
          </Button>
        </>
      }
    >
      {restricted ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-subtle p-4 text-sm">
            <p className="font-semibold text-fg">
              Currently {ACCOUNT_STATUS_LABEL[account.status].toLowerCase()}
              {account.suspendedUntil && ` until ${formatDate(account.suspendedUntil)}`}
            </p>
            {account.statusReason && <p className="mt-1 text-fg-secondary">“{account.statusReason}”</p>}
          </div>
          <FormField label="Note">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional — why access is restored early" className="min-h-16" />
          </FormField>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.status;
              return (
                <button
                  key={m.status}
                  type="button"
                  onClick={() => setMode(m.status)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    active ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20" : "border-line-strong hover:bg-subtle",
                  )}
                >
                  <Icon className={cn("h-5 w-5", m.accent)} />
                  <p className="mt-2 text-sm font-semibold text-fg">{m.title}</p>
                  <p className="text-xs text-fg-muted">{m.text}</p>
                </button>
              );
            })}
          </div>

          {mode === "suspended" && (
            <div>
              <p className="mb-2 text-sm font-medium text-fg-secondary">Duration</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDuration(d.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      duration === d.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-secondary hover:bg-subtle",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {duration === "custom" && (
                <div className="mt-3 max-w-xs">
                  <Input type="date" value={customUntil} min={localToday()} onChange={(e) => setCustomUntil(e.target.value)} />
                </div>
              )}
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                <CalendarClock className="h-4 w-4 shrink-0" />
                From today to <span className="font-semibold">{until ? formatDate(until) : "—"}</span> ({days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "invalid"}). Access returns
                automatically the next day.
              </p>
            </div>
          )}

          <FormField label="Reason" required error={error}>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              className="min-h-20"
              invalid={!!error}
              placeholder={mode === "suspended" ? "e.g. Shared exam answers in the portal chat." : mode === "blocked" ? "e.g. Suspicious logins from unknown devices." : "e.g. Duplicate account created by mistake."}
            />
          </FormField>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
            <span className="text-sm">
              <span className="font-medium text-fg">Notify by SMS</span>
              <span className="block text-xs text-fg-muted">{subject.smsTo.name} · {subject.smsTo.phone}</span>
            </span>
            <Switch checked={notify} onCheckedChange={setNotify} aria-label="Notify guardian" />
          </label>
          <p className="text-xs text-fg-subtle">The {subject.kind} is signed out immediately. School records are not affected.</p>
        </div>
      )}
    </Dialog>
  );
}
