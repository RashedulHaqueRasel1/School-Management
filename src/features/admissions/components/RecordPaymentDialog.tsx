"use client";

import { useState } from "react";
import { CheckCircle2, Mail, MessageSquareText, Printer, Wallet } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { CURRENT_USER, PAYMENT_METHODS, PAYMENT_METHOD_KEYS } from "../constants";
import { useAdmissionsStore } from "../store/admissions.store";
import type { Admission, NotificationChannel, Payment, PaymentMethod } from "../types/types";
import {
  buildPaymentMessage,
  contactOf,
  dueAmount,
  formatTaka,
  paidAmount,
  receiptHref,
  todayIso,
  type FormErrors,
} from "../utils";

type RecordPaymentDialogProps = {
  admission: Admission;
  onClose: () => void;
};

/**
 * Record money received for the admission fee.
 *
 * BACKEND CONTRACT:
 *   POST /admissions/:id/payments
 *   { amount, method, transactionId, paidOn, receivedBy, note, notify: { channels: ["sms","email"] } }
 *   → { payment: { id, receiptNo, … } }   (server generates the receipt number)
 * The email should carry the money receipt as a PDF attachment (same layout as /receipts/:receiptNo).
 * For bKash / Nagad / Rocket the server should verify the TrxID with the provider
 * (or a payment-gateway callback) before marking it as received.
 */
export function RecordPaymentDialog({ admission, onClose }: RecordPaymentDialogProps) {
  const recordPayment = useAdmissionsStore((s) => s.recordPayment);
  const due = dueAmount(admission);
  const contact = contactOf(admission);

  const [amount, setAmount] = useState(due);
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [paidOn, setPaidOn] = useState(todayIso());
  const [receivedBy, setReceivedBy] = useState(CURRENT_USER);
  const [note, setNote] = useState("");
  const [sms, setSms] = useState(Boolean(contact.phone));
  const [email, setEmail] = useState(Boolean(contact.email));
  const [errors, setErrors] = useState<FormErrors>({});
  /** Set after saving — the dialog switches to the "print receipt" step. */
  const [recorded, setRecorded] = useState<{ payment: Payment; channels: NotificationChannel[] } | null>(null);

  const methodConfig = PAYMENT_METHODS[method];
  const channels: NotificationChannel[] = [...(sms ? (["sms"] as const) : []), ...(email ? (["email"] as const) : [])];
  const preview = buildPaymentMessage(admission, { amount: amount || 0, method, receiptNo: "RCT-…" }, Math.max(0, due - (amount || 0)));

  function submit() {
    const e: FormErrors = {};
    if (!Number.isFinite(amount) || amount <= 0) e.amount = "Enter the amount received.";
    else if (amount > due) e.amount = `Cannot be more than the due amount (${formatTaka(due)}).`;
    if (methodConfig.needsReference && !transactionId.trim()) e.transactionId = `${methodConfig.referenceLabel} is required to verify the payment.`;
    if (!paidOn) e.paidOn = "Select the payment date.";
    if (!receivedBy.trim()) e.receivedBy = "Who received the payment?";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payment = recordPayment(
      admission.id,
      { amount, method, transactionId: transactionId.trim(), paidOn, receivedBy: receivedBy.trim(), note: note.trim() },
      channels,
    );
    if (!payment) return;
    toast(`Payment recorded · ${payment.receiptNo}`, { description: `${formatTaka(amount)} via ${methodConfig.label}` });
    setRecorded({ payment, channels });
  }

  if (recorded) {
    const sentTo = recorded.channels.map((c) => (c === "sms" ? `SMS to ${contact.phone}` : `email to ${contact.email}`));
    return (
      <Dialog
        open
        onClose={onClose}
        size="md"
        title="Payment recorded"
        description={`${admission.studentName} · ${admission.id}`}
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
            <a href={receiptHref(recorded.payment.receiptNo, true)} target="_blank" rel="noopener" className={buttonStyles()}>
              <Printer className="h-4 w-4" />
              Print receipt
            </a>
          </>
        }
      >
        <div className="rounded-2xl border border-line p-5 text-center">
          <p className="text-xs font-medium text-fg-muted">Receipt {recorded.payment.receiptNo}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-fg">{formatTaka(recorded.payment.amount)}</p>
          <p className="mt-1 text-sm text-fg-muted">
            via {PAYMENT_METHODS[recorded.payment.method].label}
            {recorded.payment.transactionId && ` · ${recorded.payment.transactionId}`}
          </p>
        </div>
        <p className="mt-4 text-sm text-fg-secondary">
          {sentTo.length
            ? `Receipt queued: ${sentTo.join(" and ")}.`
            : "The guardian was not notified."}{" "}
          Print the receipt for the guardian, or choose <strong>“Save as PDF”</strong> in the print dialog to share it digitally.
        </p>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Record payment"
      description={`${admission.studentName} · ${admission.id}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Wallet className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Record {amount > 0 ? formatTaka(amount) : "payment"}</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Fee summary */}
        <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line text-center">
          {[
            { label: "Admission fee", value: admission.admissionFee },
            { label: "Already paid", value: paidAmount(admission) },
            { label: "Due now", value: due, strong: true },
          ].map((item) => (
            <div key={item.label} className="px-3 py-3">
              <p className="text-[11px] font-medium text-fg-muted">{item.label}</p>
              <p className={cn("mt-0.5 font-bold tabular-nums", item.strong ? "text-lg text-indigo-600" : "text-sm text-fg")}>{formatTaka(item.value)}</p>
            </div>
          ))}
        </div>

        {/* Method */}
        <div>
          <p className="mb-2 text-sm font-medium text-fg-secondary">Payment method</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PAYMENT_METHOD_KEYS.map((key) => {
              const m = PAYMENT_METHODS[key];
              const MethodIcon = m.icon;
              const active = key === method;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMethod(key);
                    setErrors((er) => ({ ...er, transactionId: "" }));
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition",
                    active ? "border-indigo-500 bg-indigo-50/60 text-fg ring-2 ring-indigo-500/20" : "border-line-strong text-fg-secondary hover:bg-subtle",
                  )}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", m.accent)}>
                    <MethodIcon className="h-4 w-4" />
                  </span>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <FieldGrid>
          <FormField label="Amount received (৳)" required error={errors.amount}>
            <Input type="number" min={1} max={due} value={Number.isNaN(amount) ? "" : amount} onChange={(e) => setAmount(e.target.valueAsNumber)} invalid={!!errors.amount} />
          </FormField>
          <FormField label="Payment date" required error={errors.paidOn}>
            <Input type="date" value={paidOn} max={todayIso()} onChange={(e) => setPaidOn(e.target.value)} invalid={!!errors.paidOn} />
          </FormField>
          {methodConfig.needsReference && (
            <FormField label={methodConfig.referenceLabel} required error={errors.transactionId} hint="Copy it from the guardian's confirmation SMS or bank slip.">
              <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value.toUpperCase())} placeholder="e.g. 9F7A6B2C1D" className="font-mono" invalid={!!errors.transactionId} />
            </FormField>
          )}
          <FormField label="Received by" required error={errors.receivedBy}>
            <Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} invalid={!!errors.receivedBy} />
          </FormField>
          <FormField label="Note" className="sm:col-span-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 50% waiver approved by principal" />
          </FormField>
        </FieldGrid>

        {/* Send receipt */}
        <div className="rounded-2xl border border-line">
          <p className="border-b border-line px-4 py-3 text-sm font-semibold text-fg">Send receipt to {contact.name || "guardian"}</p>
          <div className="divide-y divide-line">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">SMS</p>
                <p className="truncate text-xs text-fg-muted">{contact.phone || "No mobile number on file"}</p>
              </div>
              <Switch checked={sms} onCheckedChange={setSms} disabled={!contact.phone} aria-label="Send receipt by SMS" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Mail className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">Email</p>
                <p className="truncate text-xs text-fg-muted">
                  {contact.email ? `${contact.email} · PDF receipt attached` : "No email on file — add one by editing the application"}
                </p>
              </div>
              <Switch checked={email} onCheckedChange={setEmail} disabled={!contact.email} aria-label="Send receipt by email" />
            </div>
          </div>
          {channels.length > 0 && (
            <div className="border-t border-line bg-subtle/60 p-4">
              <p className="max-w-md rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-sm leading-relaxed text-fg shadow-card">{preview}</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
