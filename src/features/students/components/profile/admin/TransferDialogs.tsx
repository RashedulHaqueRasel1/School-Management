"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileBadge2, Printer, RotateCcw } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER } from "@/features/admissions/constants";
import { formatTaka } from "@/features/admissions/utils";
import { toast } from "@/store/toast.store";

import { localToday } from "../../../demoData/profile-data";
import { useStudentAdminStore } from "../../../store/student-admin.store";
import type { Student, TransferRecord, TuitionLedger } from "../../../types/types";

export function tcHref(tcNo: string, autoPrint = false) {
  return `/certificates/tc/${tcNo}${autoPrint ? "?print=1" : ""}`;
}

export function tcNumberFor(student: Pick<Student, "id">) {
  return `TC-${localToday().slice(0, 4)}-${student.id.split("-").pop()}`;
}

const REASONS = ["Transfer to another school", "Family relocation", "Completed final class", "Admission abroad", "Financial reasons", "Other"];
const CONDUCT = ["Excellent", "Very good", "Good", "Satisfactory"];

/**
 * Issue a Transfer Certificate. Dues must be cleared first (or waived by the admin).
 * The student becomes "Left" and the record is archived; the TC can be printed /
 * saved as PDF here and downloaded by the student from the portal.
 * BACKEND: POST /students/:id/transfer-certificate  { leavingDate, reason, destinationSchool, conduct, lastClass, remarks, waiveDues }
 *          → 409 when dues > 0 and waiveDues is false
 */
export function IssueTCDialog({ student, tuition, onClose }: { student: Student; tuition: TuitionLedger; onClose: () => void }) {
  const issueTC = useStudentAdminStore((s) => s.issueTC);
  const dues = tuition.outstanding + student.feeDue;
  const [leavingDate, setLeavingDate] = useState(localToday());
  const [reason, setReason] = useState(REASONS[0]!);
  const [destination, setDestination] = useState("");
  const [conduct, setConduct] = useState(CONDUCT[1]!);
  const [lastClass, setLastClass] = useState(student.className);
  const [remarks, setRemarks] = useState("");
  const [waive, setWaive] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<TransferRecord | null>(null);

  function save() {
    if (dues > 0 && !waive) return setError(`Clear the dues of ${formatTaka(dues)} first, or waive them to continue.`);
    if (reason.startsWith("Transfer") && destination.trim().length < 3) return setError("Enter the school the student is moving to.");
    const record: TransferRecord = {
      tcNo: tcNumberFor(student),
      issuedOn: localToday(),
      leavingDate,
      reason,
      destinationSchool: destination.trim(),
      conduct,
      lastClass,
      remarks: remarks.trim(),
      duesAtIssue: dues,
      duesWaived: dues > 0,
      issuedBy: CURRENT_USER,
    };
    issueTC(student.id, record);
    toast("Transfer certificate issued", { description: `${record.tcNo} · ${student.name} is now archived as “Left”.` });
    setIssued(record);
  }

  if (issued) {
    return (
      <Dialog
        open
        onClose={onClose}
        size="md"
        title="Transfer certificate issued"
        description={`${student.name} · ${issued.tcNo}`}
        icon={
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        }
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
            <a href={tcHref(issued.tcNo, true)} target="_blank" rel="noopener" className={buttonStyles()}>
              <Printer className="h-4 w-4" />
              Print TC
            </a>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">
          The student is marked <span className="font-semibold">Left</span> and moved to the “Left (TC)” list. The certificate can be printed or saved as PDF, and the
          student can download it from the portal.
        </p>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title="Issue transfer certificate"
      description={`${student.name} · ${student.id} · ${student.className} · Section ${student.section}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <FileBadge2 className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Issue TC & archive</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Dues clearance */}
        {dues > 0 ? (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              Outstanding dues: {formatTaka(dues)}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-rose-700/90">
              {tuition.outstanding > 0 && <li>Tuition: {formatTaka(tuition.outstanding)} ({tuition.months.filter((m) => m.due > 0 && m.status !== "upcoming").map((m) => m.label.split(" ")[0]).join(", ")})</li>}
              {student.feeDue > 0 && <li>Admission fee: {formatTaka(student.feeDue)}</li>}
            </ul>
            <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3">
              <span className="text-sm">
                <span className="font-medium text-fg">Waive dues and issue anyway</span>
                <span className="block text-xs text-fg-muted">Recorded on the certificate and in the audit log</span>
              </span>
              <Switch checked={waive} onCheckedChange={(on) => { setWaive(on); setError(""); }} aria-label="Waive dues" />
            </label>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            No dues — tuition and admission fee are fully cleared.
          </p>
        )}

        <FieldGrid className="lg:grid-cols-3">
          <FormField label="Leaving date" required>
            <Input type="date" value={leavingDate} max={localToday()} onChange={(e) => setLeavingDate(e.target.value)} />
          </FormField>
          <FormField label="Reason" required>
            <Select value={reason} onChange={(e) => setReason(e.target.value)} className="h-11">
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Last class attended" required>
            <Input value={lastClass} onChange={(e) => setLastClass(e.target.value)} />
          </FormField>
          <FormField label="Moving to (school)" required={reason.startsWith("Transfer")} className="sm:col-span-2">
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Ideal School & College, Motijheel" />
          </FormField>
          <FormField label="Conduct & character" required>
            <Select value={conduct} onChange={(e) => setConduct(e.target.value)} className="h-11">
              {CONDUCT.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
        </FieldGrid>
        <FormField label="Remarks">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Printed on the certificate, e.g. “A sincere and regular student.”" className="min-h-16" />
        </FormField>
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}

/**
 * Cancel a TC and re-admit the student (e.g. issued by mistake or the family stayed).
 * BACKEND: DELETE /students/:id/transfer-certificate  { reason }
 */
export function RevokeTCDialog({ student, transfer, onClose }: { student: Student; transfer: TransferRecord; onClose: () => void }) {
  const revokeTC = useStudentAdminStore((s) => s.revokeTC);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title="Cancel TC & re-admit"
      description={`${transfer.tcNo} · ${student.name}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <RotateCcw className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Keep TC
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!reason.trim()) return setError("Write why the TC is cancelled.");
              revokeTC(student.id, reason.trim());
              toast("TC cancelled", { description: `${student.name} is an active student again.` });
              onClose();
            }}
          >
            Cancel TC
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-fg-secondary">The certificate number is voided and the student returns to the active list with all previous records.</p>
        <FormField label="Reason" required error={error}>
          <Textarea value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} className="min-h-16" invalid={!!error} placeholder="e.g. Family decided to stay in Dhaka." />
        </FormField>
      </div>
    </Dialog>
  );
}
