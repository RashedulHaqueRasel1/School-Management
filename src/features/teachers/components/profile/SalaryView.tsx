"use client";

import { useState } from "react";
import { Banknote, CircleDollarSign, FileText, Printer, Settings2, TrendingDown, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PAYMENT_METHODS } from "@/features/admissions/constants";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import { salaryBreakdown } from "../../demoData/mock-data";
import { useTeacher } from "../../hooks/use-teacher";
import { PaySalaryDialog, SalarySettingsDialog, payslipHref } from "./admin/SalaryDialogs";

const STATUS = {
  paid: { label: "Paid", tone: "success" },
  pending: { label: "Due", tone: "warning" },
  upcoming: { label: "Upcoming", tone: "neutral" },
} as const;

export function SalaryView({ slug }: { slug: string }) {
  const { teacher, salary } = useTeacher(slug);
  const [paying, setPaying] = useState<string | "any" | null>(null);
  const [editing, setEditing] = useState(false);
  if (!teacher || !salary) return null;

  const s = salary.settings;
  const b = salaryBreakdown(s);
  const left = teacher.status === "left";

  const tiles = [
    { label: "Net / month", value: formatTaka(salary.net), icon: Wallet, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Paid this year", value: formatTaka(salary.paidThisYear), icon: CircleDollarSign, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Due now", value: formatTaka(salary.pending), icon: TrendingDown, accent: salary.pending > 0 ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600" },
    { label: "Payslips", value: salary.payments.length, icon: FileText, accent: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Salary structure</h2>
              <p className="mt-0.5 text-xs text-fg-muted">{teacher.bankAccount || "No bank account on file"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Settings2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            {(
              [
                ["Basic", s.basic],
                [`House rent (${s.houseRentPercent}%)`, Math.round((s.basic * s.houseRentPercent) / 100)],
                ["Medical", s.medical],
                ["Transport", s.transport],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="tabular-nums text-fg">{formatTaka(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2.5 font-semibold">
              <dt className="text-fg">Gross</dt>
              <dd className="tabular-nums text-fg">{formatTaka(b.gross)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">Provident fund ({s.pfPercent}%)</dt>
              <dd className="tabular-nums text-rose-600">− {formatTaka(Math.round((s.basic * s.pfPercent) / 100))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">Income tax ({s.taxPercent}%)</dt>
              <dd className="tabular-nums text-rose-600">− {formatTaka(Math.round((b.gross * s.taxPercent) / 100))}</dd>
            </div>
            <div className="flex justify-between rounded-xl bg-subtle px-3 py-2.5 font-semibold">
              <dt className="text-fg">Net pay</dt>
              <dd className="tabular-nums text-emerald-600">{formatTaka(b.net)}</dd>
            </div>
          </dl>
          <Button className="mt-4 w-full" onClick={() => setPaying("any")} disabled={left && salary.pending === 0}>
            <Banknote className="h-4 w-4" />
            Pay salary
          </Button>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Monthly ledger · {salary.months[0]?.month.slice(0, 4)}</h2>
            <p className="mt-0.5 text-xs text-fg-muted">Salary is paid by the 5th of the following month. Payment history can&apos;t be deleted.</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
              <thead>
                <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <th className="py-3 pl-5 pr-3 sm:pl-6">Month</th>
                  <th className="px-3 py-3 text-right">Gross</th>
                  <th className="px-3 py-3 text-right">Net</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Paid</th>
                  <th className="py-3 pl-3 pr-5 text-right sm:pr-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {salary.months.map((m) => (
                  <tr key={m.month}>
                    <td className="py-3 pl-5 pr-3 font-medium text-fg sm:pl-6">{m.label}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-fg-secondary">{formatTaka(m.gross + (m.payment?.bonus ?? 0))}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatTaka(m.net)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS[m.status].tone} dot>
                        {STATUS[m.status].label}
                      </Badge>
                      {m.payment && m.payment.bonus > 0 && (
                        <Badge tone="violet" className="ml-1.5">
                          Bonus
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-fg-muted">
                      {m.payment ? `${formatDate(m.payment.paidOn)} · ${PAYMENT_METHODS[m.payment.method].label}` : "—"}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                      {m.payment ? (
                        <a href={payslipHref(m.payment.slipNo)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                          <Printer className="h-3.5 w-3.5" />
                          Payslip
                        </a>
                      ) : m.status === "pending" ? (
                        <Button size="sm" onClick={() => setPaying(m.month)}>
                          Pay
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {paying && <PaySalaryDialog teacher={teacher} ledger={salary} initialMonth={paying === "any" ? undefined : paying} onClose={() => setPaying(null)} />}
      {editing && <SalarySettingsDialog teacher={teacher} settings={s} onClose={() => setEditing(false)} />}
    </div>
  );
}
