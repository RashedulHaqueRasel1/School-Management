"use client";

import { DualCopySlip } from "@/components/shared/DualCopySlip";
import { PAYMENT_METHODS } from "@/features/admissions/constants";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { PrintNotFound, PrintSkeleton, PrintToolbar, usePrintTitle } from "@/features/students/components/print/PrintShell";

import { useTeacher } from "../../hooks/use-teacher";
import { useTeachers } from "../../hooks/use-teachers";
import { teacherHref, teacherSlug } from "../../utils";

function monthName(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Salary payslip (office copy + employee copy on one A4), e.g. /payslips/PS-001-202603 */
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
      <DualCopySlip
        data={{
          title: "Salary Payslip",
          meta: [
            ["Slip no.", slipNo],
            ["Month", monthName(payment.month)],
            ["Paid on", formatDate(payment.paidOn)],
          ],
          parties: [
            {
              label: "Employee",
              name: teacher.name,
              lines: [<span key="id" className="font-mono">{teacher.id}</span>, teacher.designation, teacher.department],
            },
            {
              label: "Payment",
              name: PAYMENT_METHODS[payment.method].label,
              lines: [
                ...(payment.method === "bank" ? [teacher.bankAccount] : []),
                ...(payment.reference ? [<span key="r" className="font-mono">{payment.reference}</span>] : []),
                `Salary for ${monthName(payment.month)}`,
              ],
            },
          ],
          itemsLabel: "Earnings",
          items: earnings.map(([k, v]) => ({ description: k, amount: v })),
          totalLabel: "Gross",
          total: gross,
          inWords: payment.net,
          summary: [
            { label: "Gross", value: formatTaka(gross) },
            { label: "PF, tax & other", value: `− ${formatTaka(payment.deductions)}` },
            { label: "Net pay", value: formatTaka(payment.net), tone: "ok" },
          ],
          stamp: { label: "Paid", tone: "ok" },
          note: payment.note || undefined,
          signatures: [
            [payment.paidBy, "Accounts office"],
            [teacher.name, "Employee's signature"],
          ],
          holderCopy: "Employee copy",
          reference: slipNo,
        }}
      />
    </>
  );
}
