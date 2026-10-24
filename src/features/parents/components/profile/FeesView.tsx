"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, CircleDollarSign, ExternalLink, Printer, TrendingDown, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { CollectTuitionDialog, tuitionReceiptHref } from "@/features/students/components/profile/admin/FeeDialogs";
import { monthLabel } from "@/features/students/demoData/fee-data";
import type { Student, TuitionLedger } from "@/features/students/types/types";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";

import { useParent } from "../../hooks/use-parent";
import { MessageDialog } from "./admin/MessageDialog";

export function ParentFeesView({ slug }: { slug: string }) {
  const { parent, ledgers, outstanding = 0 } = useParent(slug);
  const [collecting, setCollecting] = useState<{ student: Student; ledger: TuitionLedger } | null>(null);
  const [reminding, setReminding] = useState<{ student: Student; ledger: TuitionLedger } | null>(null);
  if (!parent || !ledgers) return null;

  const current = parent.links.filter((l) => l.student.status !== "left");
  const paid = current.reduce((sum, l) => sum + (ledgers.get(l.student.id)?.paidTotal ?? 0), 0);
  const monthly = current.reduce((sum, l) => sum + (ledgers.get(l.student.id)?.months[0]?.fee ?? 0), 0);
  const payments = parent.links
    .flatMap((l) => (ledgers.get(l.student.id)?.payments ?? []).map((p) => ({ ...p, student: l.student })))
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn));

  const tiles = [
    { label: "Family dues now", value: formatTaka(outstanding), icon: TrendingDown, accent: outstanding > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600" },
    { label: "Monthly tuition (all)", value: formatTaka(monthly), icon: Wallet, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Paid this session", value: formatTaka(paid), icon: CircleDollarSign, accent: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums text-fg">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {current.map((l) => {
          const ledger = ledgers.get(l.student.id)!;
          const unpaid = ledger.months.filter((m) => m.status === "due" || m.status === "overdue" || m.status === "partial");
          return (
            <Card key={l.student.id} className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={studentHref(l.student, "fees")} className="font-semibold text-fg hover:text-indigo-600">
                    {l.student.name}
                  </Link>
                  <p className="text-xs text-fg-muted">
                    {l.student.className} {l.student.section} · {formatTaka(ledger.months[0]?.fee ?? ledger.baseFee)}/month
                    {ledger.settings.discountPercent > 0 && ` · ${ledger.settings.discountPercent}% discount`}
                  </p>
                </div>
                {ledger.outstanding > 0 ? <Badge tone="danger">{formatTaka(ledger.outstanding)} due</Badge> : <Badge tone="success">Clear</Badge>}
              </div>
              {unpaid.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {unpaid.map((m) => (
                    <li key={m.month}>
                      <Badge tone={m.status === "overdue" ? "danger" : "warning"}>
                        {monthLabel(m.month)} · {formatTaka(m.due)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-fg-muted">{ledger.nextDue ? `Next: ${monthLabel(ledger.nextDue.month)}, due ${formatDate(ledger.nextDue.dueDate)}` : "Session fully paid."}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setCollecting({ student: l.student, ledger })} disabled={ledger.outstanding === 0 && !ledger.nextDue}>
                  <Wallet className="h-3.5 w-3.5" />
                  Collect tuition
                </Button>
                {ledger.outstanding > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setReminding({ student: l.student, ledger })}>
                    <BellRing className="h-3.5 w-3.5" />
                    Send reminder
                  </Button>
                )}
                <Link href={studentHref(l.student, "fees")} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-fg-muted transition hover:bg-soft hover:text-fg">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Full ledger
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Payment history · all children</h2>
          <p className="mt-0.5 text-xs text-fg-muted">Tuition slips paid by this family. History can&apos;t be deleted.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                <th className="py-3 pl-5 pr-3 sm:pl-6">Date</th>
                <th className="px-3 py-3">Child</th>
                <th className="px-3 py-3">Months</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="py-3 pl-3 pr-5 text-right sm:pr-6">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.slice(0, 20).map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pl-5 pr-3 text-fg-secondary sm:pl-6">{formatDate(p.paidOn)}</td>
                  <td className="px-3 py-3 font-medium text-fg">{p.student.name}</td>
                  <td className="px-3 py-3 text-fg-muted">{p.allocations.map((a) => monthLabel(a.month)).join(", ")}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatTaka(p.total)}</td>
                  <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                    <a href={tuitionReceiptHref(p.receiptNo)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      <Printer className="h-3.5 w-3.5" />
                      {p.receiptNo}
                    </a>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-fg-muted">
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {collecting && <CollectTuitionDialog student={collecting.student} ledger={collecting.ledger} onClose={() => setCollecting(null)} />}
      {reminding && (
        <MessageDialog
          recipients={[parent]}
          initialTemplate="fee"
          context={{ studentName: reminding.student.name, className: reminding.student.className, amount: formatTaka(reminding.ledger.outstanding) }}
          onClose={() => setReminding(null)}
        />
      )}
    </div>
  );
}
