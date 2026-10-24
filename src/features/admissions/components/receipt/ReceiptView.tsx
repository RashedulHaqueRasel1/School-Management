"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, FileSearch, Printer } from "lucide-react";

import { DualCopySlip } from "@/components/shared/DualCopySlip";

import { ACADEMIC_SESSION, PAYMENT_METHODS } from "../../constants";
import { useAdmissionsHydrated, useAdmissionsStore } from "../../store/admissions.store";
import type { Admission, Payment } from "../../types/types";
import { admissionHref, contactOf, formatDate, formatTaka } from "../../utils";

/*
 * Money receipt — office copy + student copy on one A4 page (printing / "Save as PDF").
 * Uses fixed light colours (white / slate) instead of theme tokens so it
 * prints identically when the dashboard is in dark mode.
 * BACKEND: the same layout should be rendered server-side to PDF and attached
 * to the receipt email.
 */

type Found = { admission: Admission; payment: Payment };

function findReceipt(admissions: Admission[], receiptNo: string): Found | undefined {
  for (const admission of admissions) {
    const payment = admission.payments.find((p) => p.receiptNo === receiptNo);
    if (payment) return { admission, payment };
  }
  return undefined;
}

/** The browser uses the document title as the default PDF file name. */
function printReceipt({ admission, payment }: Found) {
  document.title = `Receipt ${payment.receiptNo} - ${admission.studentName}`;
  window.print();
}

export function ReceiptView({ receiptNo }: { receiptNo: string }) {
  const hydrated = useAdmissionsHydrated();
  const admissions = useAdmissionsStore((s) => s.admissions);
  // Select the stable list and derive here — a selector returning a new object would re-render forever.
  const found = useMemo(() => findReceipt(admissions, receiptNo), [admissions, receiptNo]);

  // Open the print dialog straight away when asked to (?print=1).
  useEffect(() => {
    if (!found || new URLSearchParams(window.location.search).get("print") !== "1") return;
    const timer = setTimeout(() => printReceipt(found), 400);
    return () => clearTimeout(timer);
  }, [found]);

  if (!hydrated) {
    return <div className="mx-auto h-[297mm] w-full max-w-[210mm] animate-pulse rounded-lg bg-white/60" aria-busy="true" />;
  }

  if (!found) {
    return (
      <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-10 text-center shadow-lg">
        <FileSearch className="mx-auto h-10 w-10 text-slate-400" />
        <h1 className="mt-4 text-lg font-semibold text-slate-900">Receipt not found</h1>
        <p className="mt-1 text-sm text-slate-500">No payment with receipt number {receiptNo} exists. It may have been voided.</p>
        <Link href="/admissions" className="mt-6 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500">
          Back to admissions
        </Link>
      </div>
    );
  }

  return (
    <>
      <Toolbar found={found} />
      <Receipt {...found} />
    </>
  );
}

function Toolbar({ found }: { found: Found }) {
  return (
    <div className="mx-auto mb-6 flex w-full max-w-[210mm] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <Link
        href={admissionHref(found.admission)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {found.admission.studentName}
      </Link>
      <div className="flex items-center gap-3">
        <p className="hidden text-xs text-slate-500 md:block dark:text-slate-400">Tip: choose “Save as PDF” as the printer to share it digitally.</p>
        <button
          type="button"
          onClick={() => printReceipt(found)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-b from-indigo-500 to-indigo-600 px-4 text-sm font-semibold text-white shadow-glow transition hover:from-indigo-500 hover:to-indigo-500"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

function Receipt({ admission: a, payment: p }: Found) {
  const contact = contactOf(a);
  const method = PAYMENT_METHODS[p.method];

  // Totals as of this receipt (payments are stored in the order they were made).
  const index = a.payments.findIndex((x) => x.id === p.id);
  const paidBefore = a.payments.slice(0, index).reduce((sum, x) => sum + x.amount, 0);
  const paidToDate = paidBefore + p.amount;
  const balance = Math.max(0, a.admissionFee - paidToDate);
  const fullyPaid = balance === 0;

  return (
    <DualCopySlip
      data={{
        title: "Money Receipt",
        meta: [
          ["Receipt no.", p.receiptNo],
          ["Date", formatDate(p.paidOn)],
        ],
        parties: [
          {
            label: "Student",
            name: a.studentName,
            lines: [<span key="id" className="font-mono">{a.id}</span>, `${a.applyingClass} · ${a.version} · ${a.shift}`, `Session ${ACADEMIC_SESSION}`],
          },
          {
            label: "Received from",
            name: contact.name,
            lines: [
              `${contact.relation} · ${contact.phone}`,
              <span key="m">
                {method.label}
                {p.transactionId && <span className="font-mono"> · {p.transactionId}</span>}
              </span>,
            ],
          },
        ],
        items: [
          {
            description: <b>Admission fee</b>,
            detail: `${a.applyingClass}, session ${ACADEMIC_SESSION}${paidBefore > 0 ? " (instalment)" : ""}`,
            amount: p.amount,
          },
        ],
        totalLabel: "Paid with this receipt",
        total: p.amount,
        summary: [
          { label: "Total admission fee", value: formatTaka(a.admissionFee) },
          ...(paidBefore > 0 ? [{ label: "Paid earlier", value: formatTaka(paidBefore) }] : []),
          { label: "Total paid", value: formatTaka(paidToDate), strong: true },
          { label: "Balance due", value: formatTaka(balance), tone: fullyPaid ? "ok" : "due" },
        ],
        stamp: fullyPaid ? { label: "Paid", tone: "ok" } : { label: "Partially paid", tone: "due" },
        note: p.note || undefined,
        signatures: [
          [p.receivedBy, "Received by (school office)"],
          [contact.name, "Guardian's signature"],
        ],
        holderCopy: "Student copy",
        reference: p.receiptNo,
      }}
    />
  );
}
