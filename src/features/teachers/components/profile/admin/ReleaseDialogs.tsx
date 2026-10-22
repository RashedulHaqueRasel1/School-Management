"use client";

import { useState } from "react";
import { FileBadge2, LogOut, RotateCcw } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER } from "@/features/admissions/constants";
import { formatTaka } from "@/features/admissions/utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { toast } from "@/store/toast.store";

import { useTeacherAdminStore } from "../../../store/teacher-admin.store";
import type { ReleaseType, SalaryLedger, Teacher } from "../../../types/types";

export const experienceCertHref = (certNo: string, autoPrint = false) => `/certificates/experience/${encodeURIComponent(certNo)}${autoPrint ? "?print=1" : ""}`;

const TYPES: ReleaseType[] = ["Resignation", "Termination", "Retirement", "Contract ended"];

/**
 * Record resignation / termination / retirement. The teacher moves to the
 * "Left" list, portal access is disabled, and an experience certificate is issued.
 * BACKEND: POST /teachers/:id/release
 */
export function ReleaseDialog({ teacher, salary, onClose }: { teacher: Teacher; salary: SalaryLedger; onClose: () => void }) {
  const release = useTeacherAdminStore((s) => s.release);
  const updateAccount = useTeacherAdminStore((s) => s.updateAccount);
  const [type, setType] = useState<ReleaseType>("Resignation");
  const [lastWorkingDay, setLastWorkingDay] = useState(localToday());
  const [reason, setReason] = useState("");
  const [noticeServed, setNoticeServed] = useState(true);
  const [handoverNote, setHandoverNote] = useState("");
  const [conduct, setConduct] = useState("His/her conduct and character were good.");
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<string | null>(null);

  function submit() {
    if (reason.trim().length < 3) return setError("Enter the reason.");
    const certNo = `EXP-${teacher.id.split("-").pop()}-${lastWorkingDay.slice(0, 4)}`;
    release(teacher.id, {
      certNo,
      type,
      lastWorkingDay,
      reason: reason.trim(),
      noticeServed,
      settlement: salary.pending,
      handoverNote: handoverNote.trim(),
      conduct: conduct.trim(),
      issuedOn: localToday(),
      issuedBy: CURRENT_USER,
    });
    updateAccount(teacher.id, { status: "disabled", statusReason: `${type} — last working day ${lastWorkingDay}`, statusChangedAt: new Date().toISOString() }, "Portal disabled on release");
    toast(`${type} recorded`, { description: `${teacher.name} moved to the Left list · ${certNo}` });
    setIssued(certNo);
  }

  if (issued) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="Experience certificate issued"
        description={issued}
        icon={
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FileBadge2 className="h-5 w-5" />
          </span>
        }
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
            <a href={experienceCertHref(issued, true)} target="_blank" rel="noopener" className={buttonStyles()}>
              Print certificate
            </a>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">The record is archived, portal access is disabled and the teacher moves to the Left list. You can cancel the release later from the profile if needed.</p>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Release teacher"
      description={`${teacher.name} · ${teacher.id}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <LogOut className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit}>
            Record {type.toLowerCase()}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid>
          <FormField label="Type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as ReleaseType)} className="h-11">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Last working day" required>
            <Input type="date" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} />
          </FormField>
        </FieldGrid>
        <FormField label="Reason" required error={error}>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            rows={2}
            invalid={!!error}
            placeholder="e.g. Joined a government college"
          />
        </FormField>
        <FormField label="Handover note" hint="Classes, exam scripts, keys, library books…">
          <Textarea value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} rows={2} />
        </FormField>
        <FormField label="Conduct (printed on the certificate)">
          <Input value={conduct} onChange={(e) => setConduct(e.target.value)} />
        </FormField>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
          <span className="text-sm font-medium text-fg">Notice period served</span>
          <Switch checked={noticeServed} onCheckedChange={setNoticeServed} aria-label="Notice period served" />
        </label>
        <p className={salary.pending > 0 ? "rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700" : "text-sm text-fg-muted"}>
          {salary.pending > 0 ? `Unpaid salary of ${formatTaka(salary.pending)} will be recorded as the final settlement.` : "No unpaid salary — nothing to settle."}
        </p>
      </div>
    </Dialog>
  );
}

/** BACKEND: DELETE /teachers/:id/release */
export function RejoinDialog({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const rejoin = useTeacherAdminStore((s) => s.rejoin);
  const updateAccount = useTeacherAdminStore((s) => s.updateAccount);
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open
      onClose={onClose}
      title="Cancel release"
      description="The teacher returns to the active list and portal access is restored."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <RotateCcw className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={reason.trim().length < 3}
            onClick={() => {
              rejoin(teacher.id, reason.trim());
              updateAccount(teacher.id, { status: "active", statusReason: undefined, suspendedUntil: undefined, statusChangedAt: new Date().toISOString() }, "Portal access restored");
              toast("Teacher re-activated", { description: teacher.name });
              onClose();
            }}
          >
            Re-activate
          </Button>
        </>
      }
    >
      <FormField label="Reason" required>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Resignation withdrawn" />
      </FormField>
    </Dialog>
  );
}
