"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Lock, Plus, Printer, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { PAYMENT_METHODS } from "../../constants";
import type { Admission } from "../../types/types";
import { PAYMENT_STATUS_BADGE, dueAmount, formatDate, formatTaka, paidAmount, paymentStatusOf, receiptHref } from "../../utils";

const STEPS = [
  { title: "Approval", text: "The fee becomes payable once the application is approved — the approval SMS tells the guardian the amount." },
  { title: "Guardian pays", text: "At the office in cash, or by bKash / Nagad / Rocket / bank transfer to the school account (they keep the TrxID)." },
  { title: "Office records it", text: "Staff checks the TrxID or cash, then clicks “Record payment”. Partial payments are allowed." },
  { title: "Receipt", text: "A receipt number is generated; SMS / email confirmation goes to the guardian, and a printable receipt (Print → Save as PDF) can be handed over." },
  { title: "Enrolment", text: "The first payment enrols the applicant — they appear on the Students page and the admission decision becomes final." },
];

export function PaymentCard({ admission, onRecord }: { admission: Admission; onRecord: () => void }) {
  const [showHelp, setShowHelp] = useState(false);

  const paid = paidAmount(admission);
  const due = dueAmount(admission);
  const status = paymentStatusOf(admission);
  const percent = admission.admissionFee ? Math.min(100, (paid / admission.admissionFee) * 100) : 100;
  const payable = admission.status === "approved";

  return (
    <Card className="overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Admission fee</h2>
          <Badge tone={PAYMENT_STATUS_BADGE[status].tone} dot>
            {PAYMENT_STATUS_BADGE[status].label}
          </Badge>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight tabular-nums text-fg">{formatTaka(paid)}</p>
          <p className="text-sm text-fg-muted">of {formatTaka(admission.admissionFee)}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
          <div
            className={cn("h-full rounded-full transition-all duration-500", status === "paid" ? "bg-emerald-500" : "bg-linear-to-r from-indigo-500 to-violet-500")}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-fg-muted">{Math.round(percent)}% paid</span>
          <span className={cn("font-semibold", due === 0 ? "text-emerald-600" : payable ? "text-rose-600 dark:text-rose-400" : "text-fg-muted")}>
            {due === 0 ? "Nothing due" : payable ? `${formatTaka(due)} due` : admission.status === "rejected" ? "Not required" : "Payable after approval"}
          </span>
        </div>

        <div className="mt-5">
          {due === 0 ? (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Fully paid
            </p>
          ) : payable ? (
            <Button className="w-full" onClick={onRecord}>
              <Plus className="h-4 w-4" />
              Record payment
            </Button>
          ) : (
            <p className="rounded-xl bg-subtle px-3 py-2.5 text-center text-xs text-fg-muted">
              {admission.status === "rejected"
                ? "No fee is collected for rejected applications."
                : "Payments can be recorded after the application is approved."}
            </p>
          )}
        </div>
      </div>

      {/* Payment history */}
      <div className="border-t border-line">
        <div className="flex items-center justify-between px-5 pb-2 pt-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Payments</p>
          <span className="inline-flex items-center gap-1 text-[11px] text-fg-subtle" title="Payment records are permanent and cannot be edited or deleted by anyone.">
            <Lock className="h-3 w-3" />
            Permanent record
          </span>
        </div>
        {admission.payments.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-fg-muted sm:px-6">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {admission.payments.map((p) => {
              const m = PAYMENT_METHODS[p.method];
              const MethodIcon = m.icon;
              return (
                <li key={p.id} className="flex items-start gap-3 px-5 py-3 sm:px-6">
                  <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", m.accent)}>
                    <MethodIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tabular-nums text-fg">
                      {formatTaka(p.amount)} <span className="font-normal text-fg-muted">· {m.label}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-muted">
                      <Receipt className="h-3 w-3" />
                      {p.receiptNo} · {formatDate(p.paidOn)}
                    </p>
                    {p.transactionId && <p className="mt-0.5 font-mono text-[11px] text-fg-subtle">TrxID {p.transactionId}</p>}
                    <p className="text-[11px] text-fg-subtle">Received by {p.receivedBy}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  <a
                    href={receiptHref(p.receiptNo)}
                    target="_blank"
                    rel="noopener"
                    title="Print / download receipt"
                    aria-label={`Print receipt ${p.receiptNo}`}
                    className="shrink-0 rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600"
                  >
                    <Printer className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* How it works */}
      <div className="border-t border-line bg-subtle/50">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
          className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-fg-secondary hover:text-fg sm:px-6"
        >
          How admission fee payment works
          <ChevronDown className={cn("h-4 w-4 transition-transform", showHelp && "rotate-180")} />
        </button>
        {showHelp && (
          <ol className="space-y-3 px-5 pb-5 sm:px-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{i + 1}</span>
                <p className="text-xs leading-relaxed text-fg-muted">
                  <span className="font-semibold text-fg">{step.title}.</span> {step.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

    </Card>
  );
}
