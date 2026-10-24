"use client";

import { DualCopySlip } from "@/components/shared/DualCopySlip";
import { ACADEMIC_SESSION, PAYMENT_METHODS } from "@/features/admissions/constants";
import { formatDate, formatTaka } from "@/features/admissions/utils";

import { monthLabel } from "../../demoData/fee-data";
import { useStudent } from "../../hooks/use-student";
import { useStudents } from "../../hooks/use-students";
import { studentHref, studentSlug } from "../../utils";
import { PrintNotFound, PrintSkeleton, PrintToolbar, usePrintTitle } from "./PrintShell";

/** Tuition payment slip (office copy + student copy on one A4), e.g. /receipts/tuition/TF-0310-202603 */
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
  const short = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const monthFee = tuition.months[0]?.fee ?? 0;
  // Many months on one slip: one line, so both copies fit on one A4 page.
  const items =
    payment.allocations.length > 4
      ? [{ description: <>Tuition fee — <b>{payment.allocations.length} months</b></>, detail: payment.allocations.map((a) => short(a.month)).join(", "), amount: payment.total }]
      : payment.allocations.map((a) => ({
          description: <>Tuition fee — <b>{monthLabel(a.month)}</b></>,
          detail: a.amount < monthFee ? "part payment" : undefined,
          amount: a.amount,
        }));

  return (
    <>
      <PrintToolbar backHref={studentHref(student, "fees")} backLabel={`Back to ${student.name}`} title={`Tuition slip ${receiptNo} - ${student.name}`} />
      <DualCopySlip
        data={{
          title: "Tuition Fee Slip",
          meta: [
            ["Receipt no.", receiptNo],
            ["Date", formatDate(payment.paidOn)],
          ],
          parties: [
            {
              label: "Student",
              name: student.name,
              lines: [
                <span key="id" className="font-mono">{student.id}</span>,
                `${student.className} · Section ${student.section} · Roll ${student.roll}`,
                `Session ${profile.session ?? ACADEMIC_SESSION}`,
              ],
            },
            {
              label: "Paid by",
              name: student.guardianName,
              lines: [
                `${student.guardianRelation} · ${student.phone}`,
                <span key="m">
                  {method.label}
                  {payment.transactionId && <span className="font-mono"> · {payment.transactionId}</span>}
                </span>,
              ],
            },
          ],
          items,
          totalLabel: "Total paid",
          total: payment.total,
          summary: [
            { label: "Monthly fee", value: formatTaka(monthFee) },
            { label: "Paid this session", value: formatTaka(tuition.paidTotal) },
            { label: "Current outstanding", value: formatTaka(outstanding), tone: outstanding ? "due" : "ok" },
          ],
          stamp: { label: "Received", tone: "ok" },
          note: payment.note || undefined,
          signatures: [
            [payment.receivedBy, "Received by (accounts office)"],
            [student.guardianName, "Guardian's signature"],
          ],
          holderCopy: "Student copy",
          reference: receiptNo,
        }}
      />
    </>
  );
}
