"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, FileSearch, GraduationCap, Printer } from "lucide-react";

import { cn } from "@/lib/utils";

import { ACADEMIC_SESSION, PAYMENT_METHODS, SCHOOL_INFO } from "../../constants";
import { useAdmissionsHydrated, useAdmissionsStore } from "../../store/admissions.store";
import type { Admission, Payment } from "../../types/types";
import { admissionHref, amountInWords, contactOf, formatDate, formatDateTime, formatTaka } from "../../utils";

/*
 * Money receipt — designed for A4 printing / "Save as PDF".
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
    <article className="relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-lg bg-white text-slate-900 shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
      <div className="h-2 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-500 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]" />

      <div className="p-8 sm:p-12 print:p-0 print:pt-6">
        {/* School header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white print:[print-color-adjust:exact]">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{SCHOOL_INFO.name}</h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {SCHOOL_INFO.address}
                <br />
                {SCHOOL_INFO.phone} · {SCHOOL_INFO.email}
                <br />
                EIIN {SCHOOL_INFO.eiin} · {SCHOOL_INFO.website}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white print:[print-color-adjust:exact]">
              Money Receipt
            </p>
            <dl className="mt-3 space-y-0.5 text-sm">
              <div className="flex gap-2 sm:justify-end">
                <dt className="text-slate-500">Receipt no.</dt>
                <dd className="font-mono font-semibold">{p.receiptNo}</dd>
              </div>
              <div className="flex gap-2 sm:justify-end">
                <dt className="text-slate-500">Date</dt>
                <dd className="font-semibold">{formatDate(p.paidOn)}</dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="my-8 h-px bg-slate-200" />

        {/* Parties */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Received from</p>
            <p className="mt-2 font-semibold">{contact.name}</p>
            <p className="text-sm text-slate-600">{contact.relation} of the student</p>
            <p className="mt-1 text-sm text-slate-600">{contact.phone}</p>
            {contact.email && <p className="text-sm text-slate-600">{contact.email}</p>}
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Student</p>
            <p className="mt-2 font-semibold">{a.studentName}</p>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-sm text-slate-600">
              <dt>Application ID</dt>
              <dd className="font-mono">{a.id}</dd>
              <dt>Class</dt>
              <dd>
                {a.applyingClass} · {a.version} · {a.shift}
              </dd>
              <dt>Session</dt>
              <dd>{ACADEMIC_SESSION}</dd>
            </dl>
          </div>
        </section>

        {/* Line items */}
        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 print:[print-color-adjust:exact]">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Payment details</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200 align-top">
                <td className="px-4 py-4">
                  <p className="font-semibold">Admission fee</p>
                  <p className="text-xs text-slate-500">
                    {a.applyingClass}, session {ACADEMIC_SESSION}
                    {paidBefore > 0 && " (instalment)"}
                  </p>
                </td>
                <td className="px-4 py-4 text-slate-600">
                  <p className="font-medium text-slate-900">{method.label}</p>
                  {p.transactionId && <p className="font-mono text-xs">Ref: {p.transactionId}</p>}
                  {p.note && <p className="mt-1 text-xs italic">{p.note}</p>}
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">{formatTaka(p.amount)}</td>
              </tr>
            </tbody>
          </table>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm print:[print-color-adjust:exact]">
            <span className="text-slate-500">In words: </span>
            <span className="font-semibold">{amountInWords(p.amount)}</span>
          </div>
        </section>

        {/* Totals + status */}
        <section className="mt-8 flex flex-col-reverse gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center sm:pt-4">
            <span
              className={cn(
                "-rotate-6 rounded-lg border-[3px] px-5 py-2 text-xl font-black uppercase tracking-[0.2em]",
                fullyPaid ? "border-emerald-600 text-emerald-600" : "border-amber-500 text-amber-600",
              )}
            >
              {fullyPaid ? "Paid" : "Partially paid"}
            </span>
          </div>
          <dl className="w-full space-y-2 text-sm sm:max-w-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total admission fee</dt>
              <dd className="tabular-nums">{formatTaka(a.admissionFee)}</dd>
            </div>
            {paidBefore > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Paid earlier</dt>
                <dd className="tabular-nums">{formatTaka(paidBefore)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Paid with this receipt</dt>
              <dd className="font-semibold tabular-nums">{formatTaka(p.amount)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="font-semibold">Total paid</dt>
              <dd className="font-bold tabular-nums">{formatTaka(paidToDate)}</dd>
            </div>
            <div
              className={cn(
                "flex justify-between rounded-lg px-3 py-2 print:[print-color-adjust:exact]",
                fullyPaid ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
              )}
            >
              <dt className="font-semibold">Balance due</dt>
              <dd className="font-bold tabular-nums">{formatTaka(balance)}</dd>
            </div>
          </dl>
        </section>

        {/* Signatures */}
        <section className="mt-16 grid grid-cols-2 gap-10 text-sm">
          <div>
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">{p.receivedBy}</p>
            <p className="text-xs text-slate-500">Received by (school office)</p>
          </div>
          <div className="text-right">
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">{contact.name}</p>
            <p className="text-xs text-slate-500">Guardian&apos;s signature</p>
          </div>
        </section>

        <footer className="mt-12 border-t border-dashed border-slate-300 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
          This is a computer-generated receipt. Please keep it for your records — quote receipt no. {p.receiptNo} for any query.
          <br />
          Generated {formatDateTime(new Date().toISOString())} · {SCHOOL_INFO.website}
        </footer>
      </div>
    </article>
  );
}
