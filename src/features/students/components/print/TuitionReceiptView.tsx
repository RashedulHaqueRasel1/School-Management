"use client";

import { ACADEMIC_SESSION, PAYMENT_METHODS, SCHOOL_INFO } from "@/features/admissions/constants";
import { amountInWords, formatDate, formatDateTime, formatTaka } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import { monthLabel } from "../../demoData/fee-data";
import { useStudent } from "../../hooks/use-student";
import { useStudents } from "../../hooks/use-students";
import { studentHref, studentSlug } from "../../utils";
import { PaperSheet, PrintNotFound, PrintSkeleton, PrintToolbar, SchoolLetterhead, usePrintTitle } from "./PrintShell";

/** Tuition payment slip, e.g. /receipts/tuition/TF-0310-202603 */
export function TuitionReceiptView({ receiptNo }: { receiptNo: string }) {
  const number = receiptNo.split("-")[1];
  const { students, hydrated } = useStudents();
  const target = students.find((s) => s.id.endsWith(`-${number}`));
  const { student, tuition, profile } = useStudent(target ? studentSlug(target) : "");
  const payment = tuition?.payments.find((p) => p.receiptNo === receiptNo);
  usePrintTitle(payment && student ? `Tuition slip ${receiptNo} - ${student.name}` : null);

  if (!hydrated) return <PrintSkeleton />;
  if (!student || !tuition || !profile || !payment) {
    return <PrintNotFound title="Slip not found" text={`No tuition payment with receipt number ${receiptNo}.`} />;
  }

  const method = PAYMENT_METHODS[payment.method];
  const outstanding = tuition.outstanding;

  return (
    <>
      <PrintToolbar backHref={studentHref(student, "fees")} backLabel={`Back to ${student.name}`} title={`Tuition slip ${receiptNo} - ${student.name}`} />
      <PaperSheet>
        <SchoolLetterhead
          badge="Tuition Fee Slip"
          meta={[
            ["Receipt no.", receiptNo],
            ["Date", formatDate(payment.paidOn)],
          ]}
        />
        <div className="my-8 h-px bg-slate-200" />

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Student</p>
            <p className="mt-2 font-semibold">{student.name}</p>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-sm text-slate-600">
              <dt>Student ID</dt>
              <dd className="font-mono">{student.id}</dd>
              <dt>Class</dt>
              <dd>
                {student.className} · Section {student.section} · Roll {student.roll}
              </dd>
              <dt>Session</dt>
              <dd>{profile.session ?? ACADEMIC_SESSION}</dd>
            </dl>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Paid by</p>
            <p className="mt-2 font-semibold">{student.guardianName}</p>
            <p className="text-sm text-slate-600">{student.guardianRelation} · {student.phone}</p>
            <p className="mt-2 text-sm text-slate-600">
              {method.label}
              {payment.transactionId && <span className="font-mono"> · {payment.transactionId}</span>}
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 print:[print-color-adjust:exact]">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payment.allocations.map((a) => (
                <tr key={a.month} className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    Tuition fee — <span className="font-semibold">{monthLabel(a.month)}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTaka(a.amount)}</td>
                </tr>
              ))}
              <tr className="border-t border-slate-200 bg-slate-50 font-bold print:[print-color-adjust:exact]">
                <td className="px-4 py-3">Total paid</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatTaka(payment.total)}</td>
              </tr>
            </tbody>
          </table>
          <div className="border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">In words: </span>
            <span className="font-semibold">{amountInWords(payment.total)}</span>
          </div>
        </section>

        <section className="mt-8 flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="-rotate-6 self-start rounded-lg border-[3px] border-emerald-600 px-5 py-2 text-xl font-black uppercase tracking-[0.2em] text-emerald-600">Received</span>
          <dl className="w-full space-y-2 text-sm sm:max-w-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">Monthly fee</dt>
              <dd className="tabular-nums">{formatTaka(tuition.months[0]?.fee ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Paid this session</dt>
              <dd className="tabular-nums">{formatTaka(tuition.paidTotal)}</dd>
            </div>
            <div className={cn("flex justify-between rounded-lg px-3 py-2 print:[print-color-adjust:exact]", outstanding ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800")}>
              <dt className="font-semibold">Current outstanding</dt>
              <dd className="font-bold tabular-nums">{formatTaka(outstanding)}</dd>
            </div>
          </dl>
        </section>

        {payment.note && <p className="mt-6 text-sm text-slate-600">Note: {payment.note}</p>}

        <section className="mt-16 grid grid-cols-2 gap-10 text-sm">
          <div>
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">{payment.receivedBy}</p>
            <p className="text-xs text-slate-500">Received by (accounts office)</p>
          </div>
          <div className="text-right">
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">{student.guardianName}</p>
            <p className="text-xs text-slate-500">Guardian&apos;s signature</p>
          </div>
        </section>

        <footer className="mt-12 border-t border-dashed border-slate-300 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Computer-generated slip — quote {receiptNo} for any query.
          <br />
          Generated {formatDateTime(new Date().toISOString())} · {SCHOOL_INFO.website}
        </footer>
      </PaperSheet>
    </>
  );
}
