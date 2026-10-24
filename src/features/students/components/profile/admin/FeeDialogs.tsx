"use client";

import { useState } from "react";
import { BadgePercent, CheckCircle2, Mail, MessageSquareText, Printer, Wallet } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CURRENT_USER, PAYMENT_METHODS, PAYMENT_METHOD_KEYS } from "@/features/admissions/constants";
import type { PaymentMethod } from "@/features/admissions/types/types";
import { formatTaka, todayIso, uid } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { tuitionReceiptPrefix } from "../../../demoData/fee-data";
import { useStudentAdminStore } from "../../../store/student-admin.store";
import type { Student, TuitionLedger, TuitionPayment } from "../../../types/types";

export function tuitionReceiptHref(receiptNo: string, autoPrint = false) {
  return `/receipts/tuition/${receiptNo}${autoPrint ? "?print=1" : ""}`;
}

/**
 * Collect tuition for one or more months in a single receipt. The guardian may
 * pay less than the total: the amount fills the oldest month first and the rest
 * stays due (the last month reached becomes "partly paid").
 * BACKEND: POST /students/:id/tuition/payments
 *   { allocations: [{ month, amount }], method, transactionId, paidOn, note, notify: ["sms","email"] }
 */
export function CollectTuitionDialog({
  student,
  ledger,
  initialMonths,
  onClose,
}: {
  student: Student;
  ledger: TuitionLedger;
  /** Months pre-selected (e.g. the month card that was clicked). */
  initialMonths?: string[];
  onClose: () => void;
}) {
  const recordTuition = useStudentAdminStore((s) => s.recordTuition);
  const open = ledger.months.filter((m) => m.due > 0);
  const overdueOrDue = open.filter((m) => m.status !== "upcoming").map((m) => m.month);
  const [selected, setSelected] = useState<string[]>(initialMonths?.filter((m) => open.some((o) => o.month === m)) ?? overdueOrDue.slice(0, 1));
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [paidOn, setPaidOn] = useState(todayIso());
  const [note, setNote] = useState("");
  const [sms, setSms] = useState(Boolean(student.phone));
  const [email, setEmail] = useState(Boolean(student.email));
  const [error, setError] = useState("");
  const [done, setDone] = useState<(TuitionPayment & { balance: number }) | null>(null);
  // Amount received: follows the selected total until the admin types their own.
  const [amountText, setAmountText] = useState<string | null>(null);

  const chosen = open.filter((m) => selected.includes(m.month));
  const total = chosen.reduce((sum, m) => sum + m.due, 0);
  const amount = amountText === null ? total : Number(amountText);
  const amountInvalid = amountText !== null && (amountText.trim() === "" || !Number.isFinite(amount) || amount <= 0 || amount > total || !Number.isInteger(amount));
  const paying = amountInvalid ? 0 : amount;
  const balance = Math.max(0, total - paying);
  // Oldest month first; the last month reached may be paid in part.
  const plan = chosen.map((m, i) => {
    const before = chosen.slice(0, i).reduce((sum, x) => sum + x.due, 0);
    const pay = Math.max(0, Math.min(m.due, paying - before));
    return { ...m, pay, remaining: m.due - pay };
  });
  const methodConfig = PAYMENT_METHODS[method];

  function toggle(month: string) {
    setSelected((prev) => (prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort()));
    setError("");
  }

  function save() {
    if (selected.length === 0) return setError("Select at least one month.");
    if (amountInvalid) return setError(`Enter an amount from ৳1 to ${formatTaka(total)}.`);
    if (methodConfig.needsReference && !transactionId.trim()) return setError(`${methodConfig.referenceLabel} is required.`);
    const allocations = plan.filter((m) => m.pay > 0).map((m) => ({ month: m.month, amount: m.pay }));
    const payment: TuitionPayment = {
      id: `tf-${uid()}`,
      receiptNo: `${tuitionReceiptPrefix(student)}R${uid().replace(/-/g, "").slice(0, 6).toUpperCase()}`,
      allocations,
      total: paying,
      method,
      transactionId: transactionId.trim(),
      paidOn,
      receivedBy: CURRENT_USER,
      note: note.trim() || (balance > 0 ? `Part payment — ${formatTaka(balance)} still due` : ""),
    };
    const channels = [sms && "SMS", email && student.email && "email"].filter(Boolean).join(" & ");
    recordTuition(
      student.id,
      payment,
      `${formatTaka(paying)} via ${methodConfig.label} · ${allocations.length} month(s)${balance ? ` · ${formatTaka(balance)} left due` : ""}${channels ? ` · receipt sent by ${channels}` : ""}`,
    );
    toast(`Payment recorded · ${payment.receiptNo}`, { description: `${formatTaka(paying)} received${balance ? ` · ${formatTaka(balance)} still due` : ""}` });
    setDone({ ...payment, balance });
  }

  if (done) {
    return (
      <Dialog
        open
        onClose={onClose}
        size="md"
        title="Tuition payment recorded"
        description={`${student.name} · ${done.receiptNo}`}
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
            <a href={tuitionReceiptHref(done.receiptNo, true)} target="_blank" rel="noopener" className={buttonStyles()}>
              <Printer className="h-4 w-4" />
              Print slip
            </a>
          </>
        }
      >
        <div className="rounded-2xl border border-line p-5 text-center">
          <p className="text-3xl font-bold tabular-nums text-fg">{formatTaka(done.total)}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {done.allocations.map((a) => new Date(`${a.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })).join(", ")} · {PAYMENT_METHODS[done.method].label}
          </p>
          {done.balance > 0 && <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{formatTaka(done.balance)} still due</p>}
        </div>
        <p className="mt-4 text-sm text-fg-secondary">Print the payment slip for the guardian, or choose “Save as PDF” to share it digitally.</p>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Collect tuition fee"
      description={`${student.name} · ${student.className} · ${formatTaka(ledger.months[0]?.fee ?? 0)} per month`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Wallet className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <span className="text-sm text-fg-muted sm:mr-auto sm:self-center">
            Receiving: <span className="text-lg font-bold tabular-nums text-fg">{formatTaka(paying)}</span>
            {balance > 0 && paying > 0 && <span className="ml-2 text-xs font-semibold text-amber-600">{formatTaka(balance)} left due</span>}
          </span>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={total === 0 || paying === 0}>
            {balance > 0 && paying > 0 ? "Record part payment" : "Record payment"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-fg-secondary">Months</p>
            {overdueOrDue.length > 1 && (
              <button type="button" onClick={() => setSelected(overdueOrDue)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Select all due ({overdueOrDue.length})
              </button>
            )}
          </div>
          {open.length === 0 ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">All months of the session are paid.</p>
          ) : (
            <ul className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {open.map((m) => (
                <li key={m.month}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                      selected.includes(m.month) ? "border-indigo-500 bg-indigo-50/60" : "border-line-strong hover:bg-subtle",
                    )}
                  >
                    <Checkbox aria-label={m.label} checked={selected.includes(m.month)} onCheckedChange={() => toggle(m.month)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-fg">{m.label}</span>
                      <span className={cn("block text-xs", m.status === "overdue" ? "text-rose-600" : "text-fg-muted")}>
                        {m.status === "overdue" ? "Overdue" : m.status === "partial" ? "Partly paid" : m.status === "due" ? "Due now" : "Advance"}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-fg">{formatTaka(m.due)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {total > 0 && (
          <div className="rounded-2xl border border-line bg-subtle/60 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <FormField label="Amount received (৳)" required className="flex-1" error={amountInvalid ? `From ৳1 to ${formatTaka(total)}` : undefined}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={total}
                  step={1}
                  value={amountText ?? String(total)}
                  onChange={(e) => {
                    setAmountText(e.target.value);
                    setError("");
                  }}
                  invalid={amountInvalid}
                  className="text-lg font-semibold tabular-nums"
                  aria-label="Amount received"
                />
              </FormField>
              <div className="flex flex-wrap gap-1.5 sm:pb-1">
                {[
                  ["Full", total],
                  ["Half", Math.round(total / 2)],
                  ...(chosen.length > 1 ? [["1st month", chosen[0]!.due] as const] : []),
                ].map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAmountText(value === total ? null : String(value))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      paying === value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-line-strong bg-surface text-fg-secondary hover:bg-subtle",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-surface text-center">
              {(
                [
                  ["Total due", formatTaka(total), "text-fg"],
                  ["Paying now", formatTaka(paying), "text-emerald-600"],
                  ["Balance left", formatTaka(balance), balance ? "text-amber-600" : "text-fg-subtle"],
                ] as const
              ).map(([label, value, cls]) => (
                <div key={label} className="px-2 py-2.5">
                  <dt className="text-[11px] font-medium text-fg-muted">{label}</dt>
                  <dd className={cn("text-base font-bold tabular-nums", cls)}>{value}</dd>
                </div>
              ))}
            </dl>

            {balance > 0 && paying > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {plan.map((m) => (
                  <li key={m.month} className="flex items-center justify-between gap-3">
                    <span className="text-fg-secondary">{m.label}</span>
                    <span className="tabular-nums">
                      {m.pay > 0 && <span className="font-semibold text-emerald-600">{formatTaka(m.pay)} paid</span>}
                      {m.pay > 0 && m.remaining > 0 && <span className="text-fg-subtle"> · </span>}
                      {m.remaining > 0 && <span className="font-semibold text-amber-600">{formatTaka(m.remaining)} stays due</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <FieldGrid className="lg:grid-cols-3">
          <FormField label="Method" required>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="h-11">
              {PAYMENT_METHOD_KEYS.map((k) => (
                <option key={k} value={k}>
                  {PAYMENT_METHODS[k].label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={methodConfig.needsReference ? methodConfig.referenceLabel : "Reference"} required={methodConfig.needsReference}>
            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value.toUpperCase())} className="font-mono" placeholder={methodConfig.needsReference ? "e.g. 9F7A6B2C1D" : "Optional"} />
          </FormField>
          <FormField label="Payment date" required>
            <Input type="date" value={paidOn} max={todayIso()} onChange={(e) => setPaidOn(e.target.value)} />
          </FormField>
          <FormField label="Note" className="sm:col-span-2 lg:col-span-3">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </FormField>
        </FieldGrid>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <MessageSquareText className="h-4 w-4 text-emerald-600" />
            <span className="flex-1 text-sm font-medium text-fg">SMS receipt</span>
            <Switch checked={sms} onCheckedChange={setSms} disabled={!student.phone} aria-label="SMS receipt" />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <Mail className="h-4 w-4 text-sky-600" />
            <span className="flex-1 text-sm font-medium text-fg">Email slip (PDF)</span>
            <Switch checked={email} onCheckedChange={setEmail} disabled={!student.email} aria-label="Email slip" />
          </label>
        </div>
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}

/**
 * Scholarship / sibling / staff discount on the monthly fee.
 * BACKEND: PUT /students/:id/tuition/settings  { discountPercent, discountReason }
 */
export function FeeSettingsDialog({ student, ledger, onClose }: { student: Student; ledger: TuitionLedger; onClose: () => void }) {
  const setFeeSettings = useStudentAdminStore((s) => s.setFeeSettings);
  const [percent, setPercent] = useState(String(ledger.settings.discountPercent));
  const [reason, setReason] = useState(ledger.settings.discountReason || "Merit scholarship");
  const value = Number(percent);
  const invalid = !Number.isFinite(value) || value < 0 || value > 100;
  const newFee = invalid ? 0 : Math.round(ledger.baseFee * (1 - value / 100));

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title="Fee discount"
      description={`${student.name} · standard fee ${formatTaka(ledger.baseFee)} / month`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <BadgePercent className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={invalid}
            onClick={() => {
              setFeeSettings(student.id, { discountPercent: value, discountReason: value ? reason.trim() : "" });
              toast("Fee discount saved", { description: value ? `${value}% · ${formatTaka(newFee)} / month` : "Standard fee applies" });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {[0, 10, 25, 50, 100].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPercent(String(p))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                value === p ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-secondary hover:bg-subtle",
              )}
            >
              {p === 0 ? "No discount" : p === 100 ? "Full free" : `${p}%`}
            </button>
          ))}
        </div>
        <FieldGrid>
          <FormField label="Discount %" required error={invalid ? "0 to 100" : undefined}>
            <Input type="number" min={0} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} invalid={invalid} />
          </FormField>
          <FormField label="Reason">
            <Select value={reason} onChange={(e) => setReason(e.target.value)} className="h-11" disabled={value === 0}>
              {["Merit scholarship", "Sibling discount", "Staff child", "Financial hardship", "Freedom fighter quota", "Other"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>
        </FieldGrid>
        <p className="rounded-xl bg-subtle px-4 py-3 text-sm text-fg-secondary">
          New monthly fee: <span className="font-bold text-fg">{formatTaka(newFee)}</span>. Applies to every unpaid month of the session.
        </p>
      </div>
    </Dialog>
  );
}
