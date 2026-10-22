"use client";

import { useState } from "react";
import { CalendarCog, Clock, HeartPulse, LogIn, LogOut, Plane, RotateCcw, Sun, Users, XCircle, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { LEAVE_TYPES, minutesToTime } from "../../../demoData/profile-data";
import type { AttendanceDay, AttendanceOverride, LeaveType, Shift } from "../../../types/types";
import { ATTENDANCE_STYLE } from "../attendance-utils";
import { toDisplayTime, toInputTime } from "./time";

type Choice = { key: string; label: string; icon: LucideIcon; accent: string; status: AttendanceOverride["status"]; leave?: LeaveType };

const CHOICES: Choice[] = [
  { key: "present", label: "Present", icon: Sun, accent: "text-emerald-600", status: "present" },
  { key: "late", label: "Late", icon: Clock, accent: "text-amber-600", status: "late" },
  { key: "absent", label: "Absent", icon: XCircle, accent: "text-rose-600", status: "absent" },
  { key: "sick", label: "Sick leave", icon: HeartPulse, accent: "text-violet-600", status: "leave", leave: "sick" },
  { key: "casual", label: "Casual leave", icon: Plane, accent: "text-violet-600", status: "leave", leave: "casual" },
  { key: "family", label: "Family leave", icon: Users, accent: "text-violet-600", status: "leave", leave: "family" },
];

function initialChoice(day?: AttendanceDay) {
  if (!day) return "present";
  if (day.status !== "leave") return day.status;
  const match = (Object.keys(LEAVE_TYPES) as LeaveType[]).find((t) => day.note?.startsWith(LEAVE_TYPES[t]));
  return match ?? "sick";
}

type Props = {
  /** Person whose attendance is edited (student or staff). */
  name: string;
  date: string;
  current?: AttendanceDay;
  shift: Shift;
  /** An admin correction already exists for this day. */
  corrected: boolean;
  /** Persist the correction (null = remove it). `detail` is for the audit log. */
  onSave: (value: AttendanceOverride | null, detail: string) => void;
  onClose: () => void;
};

/**
 * Admin correction of one day's attendance.
 * BACKEND: PUT /students|teachers/:id/attendance/:date  { status, checkIn, checkOut, note }  (DELETE to undo)
 */
export function EditAttendanceDialog({ name, date, current, shift, corrected, onSave, onClose }: Props) {
  const [choice, setChoice] = useState<string>(initialChoice(current));
  const [checkIn, setCheckIn] = useState(toInputTime(current?.checkIn ?? minutesToTime(shift.start - 5)));
  const [checkOut, setCheckOut] = useState(toInputTime(current?.checkOut ?? minutesToTime(shift.end)));
  const [note, setNote] = useState(current?.status === "leave" || current?.status === "absent" ? "" : (current?.note ?? ""));
  const [error, setError] = useState("");

  const selected = CHOICES.find((c) => c.key === choice)!;
  const needsTimes = selected.status === "present" || selected.status === "late";
  const before = current ? (current.status === "leave" ? current.note ?? "Leave" : ATTENDANCE_STYLE[current.status].label) : "No record";

  function save() {
    if (needsTimes && !checkIn) return setError("Enter the check-in time.");
    if (needsTimes && checkOut && checkOut <= checkIn) return setError("Check-out must be after check-in.");
    const override: AttendanceOverride = {
      status: selected.status,
      checkIn: needsTimes ? toDisplayTime(checkIn) : undefined,
      checkOut: needsTimes ? toDisplayTime(checkOut) : undefined,
      note: selected.leave ? `${LEAVE_TYPES[selected.leave]}${note ? ` — ${note}` : ""}` : note || undefined,
    };
    onSave(override, `${formatDate(date)}: ${before} → ${selected.label}`);
    toast("Attendance updated", { description: `${name} · ${formatDate(date)} · ${selected.label}` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Edit attendance"
      description={`${name} · ${new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <CalendarCog className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          {corrected && (
            <Button
              variant="ghost"
              className="sm:mr-auto"
              onClick={() => {
                onSave(null, `${formatDate(date)}: correction removed`);
                toast("Correction removed", { description: "The original record is back.", tone: "info" });
                onClose();
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Undo correction
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save attendance</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-xl bg-subtle px-4 py-3 text-sm">
          <span className="text-fg-muted">Current record</span>
          <span className="font-semibold text-fg">
            {before}
            {current?.checkIn && <span className="font-normal text-fg-muted"> · {current.checkIn}{current.checkOut ? ` – ${current.checkOut}` : ""}</span>}
          </span>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-fg-secondary">Mark as</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CHOICES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setChoice(c.key);
                    setError("");
                  }}
                  aria-pressed={choice === c.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                    choice === c.key ? "border-indigo-500 bg-indigo-50/60 text-fg ring-2 ring-indigo-500/20" : "border-line-strong text-fg-secondary hover:bg-subtle",
                  )}
                >
                  <Icon className={cn("h-4 w-4", c.accent)} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {needsTimes && (
          <FieldGrid>
            <FormField label="Check-in" required error={error && !checkIn ? error : undefined}>
              <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} leftIcon={<LogIn />} />
            </FormField>
            <FormField label="Check-out" hint="Leave empty if still on campus.">
              <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} leftIcon={<LogOut />} />
            </FormField>
          </FieldGrid>
        )}
        {error && checkIn && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}

        <FormField label={selected.status === "leave" || selected.status === "absent" ? "Reason" : "Note"}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Gate scanner was offline — verified with class teacher." className="min-h-20" />
        </FormField>

        <p className="text-xs text-fg-subtle">The change is saved with your name in the activity log.</p>
      </div>
    </Dialog>
  );
}
