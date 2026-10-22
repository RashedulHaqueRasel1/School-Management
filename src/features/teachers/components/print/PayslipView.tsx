"use client";

import { PAYMENT_METHODS, SCHOOL_INFO } from "@/features/admissions/constants";
import { amountInWords, formatDate, formatDateTime, formatTaka } from "@/features/admissions/utils";
import { PaperSheet, PrintNotFound, PrintSkeleton, PrintToolbar, SchoolLetterhead, usePrintTitle } from "@/features/students/components/print/PrintShell";

import { useTeacher } from "../../hooks/use-teacher";
import { useTeachers } from "../../hooks/use-teachers";
import { teacherHref, teacherSlug } from "../../utils";

function monthName(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Salary payslip, e.g. /payslips/PS-001-202603 */
export function PayslipView({ slipNo }: { slipNo: string }) {
  const number = slipNo.split("-")[1];
  const { teachers, hydrated } = useTeachers();
  const target = teachers.find((t) => t.id === `TCH-${number}`);
  const { teacher, salary } = useTeacher(target ? teacherSlug(target) : "");
  const payment = salary?.payments.find((p) => p.slipNo === slipNo);
  usePrintTitle(payment && teacher ? `Payslip ${slipNo} - ${teacher.name}` : null);

  if (!hydrated) return <PrintSkeleton />;
  if (!teacher || !salary || !payment) return <PrintNotFound title="Payslip not found" text={`No salary payment with slip number ${slipNo}.`} />;

  const s = salary.settings;
  const houseRent = Math.round((payment.basic * s.houseRentPercent) / 100);
  const earnings: [string, number][] = [
    ["Basic salary", payment.basic],
    ["House rent", houseRent],
    ["Medical & transport", payment.allowances - houseRent],
    ...(payment.bonus ? ([["Festival bonus / arrears", payment.bonus]] as [string, number][]) : []),
  ];
  const gross = payment.basic + payment.allowances + payment.bonus;

  return (
    <>
      <PrintToolbar backHref={teacherHref(teacher, "salary")} backLabel={`Back to ${teacher.name}`} title={`Payslip ${slipNo} - ${teacher.name}`} />
      <PaperSheet>
        <SchoolLetterhead
          badge="Salary Payslip"
          meta={[
            ["Slip no.", slipNo],
            ["Month", monthName(payment.month)],
            ["Paid on", formatDate(payment.paidOn)],
          ]}
        />
        <div className="my-8 h-px bg-slate-200" />

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Employee</p>
            <p className="mt-2 font-semibold">{teacher.name}</p>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-sm text-slate-600">
              <dt>Staff ID</dt>
              <dd className="font-mono">{teacher.id}</dd>
              <dt>Designation</dt>
              <dd>{teacher.designation}</dd>
              <dt>Department</dt>
              <dd>{teacher.department}</dd>
            </dl>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Payment</p>
            <p className="mt-2 font-semibold">{PAYMENT_METHODS[payment.method].label}</p>
            {payment.method === "bank" && <p className="text-sm text-slate-600">{teacher.bankAccount}</p>}
            {payment.reference && <p className="font-mono text-sm text-slate-600">{payment.reference}</p>}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <table className="w-full overflow-hidden rounded-xl border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 print:[print-color-adjust:exact]">
                <th className="px-4 py-3">Earnings</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map(([k, v]) => (
                <tr key={k} className="border-t border-slate-200">
                  <td className="px-4 py-2.5">{k}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatTaka(v)}</td>
                </tr>
              ))}
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold print:[print-color-adjust:exact]">
                <td className="px-4 py-2.5">Gross</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatTaka(gross)}</td>
              </tr>
            </tbody>
          </table>
          <table className="w-full self-start overflow-hidden rounded-xl border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 print:[print-color-adjust:exact]">
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-2.5">Provident fund, tax & other</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatTaka(payment.deductions)}</td>
              </tr>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold print:[print-color-adjust:exact]">
                <td className="px-4 py-2.5">Total deductions</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatTaka(payment.deductions)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-6 flex flex-col gap-2 rounded-xl bg-emerald-50 px-5 py-4 text-emerald-900 sm:flex-row sm:items-center sm:justify-between print:[print-color-adjust:exact]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider">Net pay</p>
            <p className="text-sm">In words: {amountInWords(payment.net)}</p>
          </div>
          <p className="text-2xl font-black tabular-nums">{formatTaka(payment.net)}</p>
        </section>

        {payment.note && <p className="mt-6 text-sm text-slate-600">Note: {payment.note}</p>}

        <section className="mt-16 grid grid-cols-2 gap-10 text-sm">
          <div>
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">{payment.paidBy}</p>
            <p className="text-xs text-slate-500">Accounts office</p>
          </div>
          <div className="text-right">
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">{teacher.name}</p>
            <p className="text-xs text-slate-500">Employee&apos;s signature</p>
          </div>
        </section>

        <footer className="mt-12 border-t border-dashed border-slate-300 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Computer-generated payslip — quote {slipNo} for any query. Confidential.
          <br />
          Generated {formatDateTime(new Date().toISOString())} · {SCHOOL_INFO.website}
        </footer>
      </PaperSheet>
    </>
  );
}
