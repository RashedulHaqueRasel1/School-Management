"use client";

import { useState } from "react";
import { Printer, Settings2, Wallet } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER, PAYMENT_METHODS } from "@/features/admissions/constants";
import type { PaymentMethod } from "@/features/admissions/types/types";
import { formatTaka, uid } from "@/features/admissions/utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { toast } from "@/store/toast.store";

import { salaryBreakdown, slipPrefix } from "../../../demoData/mock-data";
import { useTeacherAdminStore } from "../../../store/teacher-admin.store";
import type { SalaryLedger, SalarySettings, Teacher } from "../../../types/types";

export const payslipHref = (slipNo: string, autoPrint = false) => `/payslips/${encodeURIComponent(slipNo)}${autoPrint ? "?print=1" : ""}`;

const METHODS: PaymentMethod[] = ["bank", "cash", "bkash", "nagad"];

/**
 * Pay one month's salary and issue a payslip.
 * BACKEND: POST /teachers/:id/salary/payments  → { slipNo }
 */
export function PaySalaryDialog({ teacher, ledger, initialMonth, onClose }: { teacher: Teacher; ledger: SalaryLedger; initialMonth?: string; onClose: () => void }) {
  const paySalary = useTeacherAdminStore((s) => s.paySalary);
  const payable = ledger.months.filter((m) => m.status !== "paid");
  const [month, setMonth] = useState(initialMonth ?? payable[0]?.month ?? "");
  const [bonus, setBonus] = useState(0);
  const [extraDeduction, setExtraDeduction] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [paidOn, setPaidOn] = useState(localToday());
  const [error, setError] = useState("");
  const [paidSlip, setPaidSlip] = useState<string | null>(null);

  const { allowances, deductions, net } = salaryBreakdown(ledger.settings);
  const total = net + bonus - extraDeduction;
  const label = payable.find((m) => m.month === month)?.label ?? month;

  function submit() {
    if (!month) return;
    if (PAYMENT_METHODS[method].needsReference && reference.trim().length < 3) {
      setError(`Enter the ${PAYMENT_METHODS[method].referenceLabel.toLowerCase()}.`);
      return;
    }
    if (total <= 0) {
      setError("Net pay must be more than zero.");
      return;
    }
    const slipNo = `${slipPrefix(teacher.id)}${month.replace("-", "")}`;
    paySalary(teacher.id, {
      id: uid(),
      slipNo,
      month,
      basic: ledger.settings.basic,
      allowances,
      deductions: deductions + extraDeduction,
      bonus,
      net: total,
      method,
      reference: reference.trim(),
      paidOn,
      paidBy: CURRENT_USER,
      note: note.trim(),
    });
    toast("Salary paid", { description: `${teacher.name} · ${label} · ${formatTaka(total)} · SMS sent` });
    setPaidSlip(slipNo);
  }

  if (paidSlip) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="Salary paid"
        description={`${label} · ${formatTaka(total)} to ${teacher.name}`}
        icon={
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet className="h-5 w-5" />
          </span>
        }
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
            <a href={payslipHref(paidSlip, true)} target="_blank" rel="noopener" className={buttonStyles()}>
              <Printer className="h-4 w-4" />
              Print payslip
            </a>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">
          Payslip <span className="font-mono font-semibold text-fg">{paidSlip}</span> was issued. The teacher received an SMS and can download the payslip from the teacher portal.
        </p>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Pay salary"
      description={`${teacher.name} · ${teacher.bankAccount || "no bank account on file"}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Wallet className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!month}>
            Pay {formatTaka(Math.max(0, total))}
          </Button>
        </>
      }
    >
      {payable.length === 0 ? (
        <p className="text-sm text-fg-muted">Every month of this year is already paid.</p>
      ) : (
        <div className="space-y-4">
          <FieldGrid>
            <FormField label="Month" required>
              <Select value={month} onChange={(e) => setMonth(e.target.value)} className="h-11">
                {payable.map((m) => (
                  <option key={m.month} value={m.month}>
                    {m.label} {m.status === "pending" ? "· due" : m.month === localToday().slice(0, 7) ? "· this month" : "· advance"}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Payment date" required>
              <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </FormField>
            <FormField label="Bonus / arrears (৳)" hint="Festival bonus, overtime…">
              <Input type="number" min={0} value={bonus} onChange={(e) => setBonus(Math.max(0, e.target.valueAsNumber || 0))} />
            </FormField>
            <FormField label="Extra deduction (৳)" hint="Leave without pay, advance recovery…">
              <Input type="number" min={0} value={extraDeduction} onChange={(e) => setExtraDeduction(Math.max(0, e.target.valueAsNumber || 0))} />
            </FormField>
            <FormField label="Method" required>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="h-11">
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHODS[m].label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={PAYMENT_METHODS[method].referenceLabel} required={PAYMENT_METHODS[method].needsReference} error={error}>
              <Input
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  setError("");
                }}
                invalid={!!error}
              />
            </FormField>
          </FieldGrid>
          <FormField label="Note">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </FormField>
          <dl className="divide-y divide-line rounded-2xl border border-line text-sm">
            {(
              [
                ["Basic", ledger.settings.basic, false],
                ["Allowances", allowances, false],
                ["Bonus", bonus, false],
                ["Deductions (PF, tax)", deductions, true],
                ["Extra deduction", extraDeduction, true],
              ] as const
            ).map(([k, v, minus]) => (
              <div key={k} className="flex justify-between px-4 py-2.5">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="tabular-nums text-fg">{minus && v > 0 ? `− ${formatTaka(v)}` : formatTaka(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between bg-subtle px-4 py-3 font-semibold">
              <dt className="text-fg">Net pay</dt>
              <dd className="tabular-nums text-emerald-600">{formatTaka(total)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Dialog>
  );
}

/** BACKEND: PUT /teachers/:id/salary */
export function SalarySettingsDialog({ teacher, settings, onClose }: { teacher: Teacher; settings: SalarySettings; onClose: () => void }) {
  const save = useTeacherAdminStore((s) => s.setSalarySettings);
  const [v, setV] = useState(settings);
  const b = salaryBreakdown(v);
  const field = (key: keyof SalarySettings, label: string, hint?: string) => (
    <FormField label={label} hint={hint}>
      <Input type="number" min={0} value={v[key]} onChange={(e) => setV({ ...v, [key]: Math.max(0, e.target.valueAsNumber || 0) })} />
    </FormField>
  );

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Salary structure"
      description={`${teacher.name} · applies to months not yet paid`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Settings2 className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (v.basic < 1000) {
                toast("Basic salary is too low", { tone: "error" });
                return;
              }
              save(teacher.id, v);
              toast("Salary structure saved", { description: `Net ${formatTaka(b.net)} / month` });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid className="lg:grid-cols-3">
          {field("basic", "Basic (৳)")}
          {field("houseRentPercent", "House rent (% of basic)")}
          {field("medical", "Medical (৳)")}
          {field("transport", "Transport (৳)")}
          {field("pfPercent", "Provident fund (% of basic)")}
          {field("taxPercent", "Income tax (% of gross)")}
        </FieldGrid>
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-subtle p-4 text-center">
          <div>
            <p className="text-xs text-fg-muted">Gross</p>
            <p className="mt-1 font-bold tabular-nums text-fg">{formatTaka(b.gross)}</p>
          </div>
          <div>
            <p className="text-xs text-fg-muted">Deductions</p>
            <p className="mt-1 font-bold tabular-nums text-rose-600">{formatTaka(b.deductions)}</p>
          </div>
          <div>
            <p className="text-xs text-fg-muted">Net / month</p>
            <p className="mt-1 font-bold tabular-nums text-emerald-600">{formatTaka(b.net)}</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
