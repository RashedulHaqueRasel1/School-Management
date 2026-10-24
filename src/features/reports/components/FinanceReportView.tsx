"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PAYMENT_METHODS, PAYMENT_METHOD_KEYS } from "@/features/admissions/constants";
import { formatTaka } from "@/features/admissions/utils";
import { classOrder } from "@/features/classes/demoData/mock-data";
import { cn } from "@/lib/utils";

import { useReportData } from "../hooks/use-report-data";
import { MONTH_SHORT, monthsToDate, pct } from "../utils";
import { Loading, Tiles } from "./ReportsOverviewView";

/**
 * Money in (tuition + admission fees) vs money out (salaries) per month, dues
 * and payment methods. BACKEND: GET /reports/finance?session=
 */
export function FinanceReportView() {
  const { hydrated, today, accounts, payments, staff, admissions } = useReportData();
  if (!hydrated) return <Loading />;

  const months = monthsToDate(today);
  const admissionPayments = admissions.flatMap((a) => a.payments);
  const salaryPayments = staff.flatMap((s) => s.salary.payments);
  const rows = months.map((m) => {
    const tuition = payments.filter((p) => p.paidOn.startsWith(m)).reduce((s, p) => s + p.total, 0);
    const admission = admissionPayments.filter((p) => p.paidOn.startsWith(m)).reduce((s, p) => s + p.amount, 0);
    const salary = salaryPayments.filter((p) => p.paidOn.startsWith(m)).reduce((s, p) => s + p.net, 0);
    return { month: m, tuition, admission, income: tuition + admission, salary, net: tuition + admission - salary };
  });
  const sum = (k: "tuition" | "admission" | "income" | "salary" | "net") => rows.reduce((s, r) => s + r[k], 0);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.income, r.salary)));
  const tuitionDue = accounts.reduce((s, a) => s + a.overdue + a.dueNow, 0);
  const admissionDue = admissions.filter((a) => a.payments.length > 0).reduce((s, a) => s + Math.max(0, a.admissionFee - a.payments.reduce((x, p) => x + p.amount, 0)), 0);
  const salaryPending = staff.reduce((s, x) => s + x.salary.pending, 0);

  const methods = PAYMENT_METHOD_KEYS.map((k) => ({
    k,
    total: payments.filter((p) => p.method === k).reduce((s, p) => s + p.total, 0) + admissionPayments.filter((p) => p.method === k).reduce((s, p) => s + p.amount, 0),
  }))
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);
  const classes = [...new Set(accounts.map((a) => a.student.className))].sort((a, b) => classOrder(a) - classOrder(b));
  const maxDue = Math.max(1, ...classes.map((c) => accounts.filter((a) => a.student.className === c).reduce((s, a) => s + a.overdue, 0)));

  return (
    <div className="space-y-6">
      <Tiles
        tiles={[
          { label: "Income this session", value: formatTaka(sum("income")), hint: `Tuition ${formatTaka(sum("tuition"))} · admission ${formatTaka(sum("admission"))}`, icon: ArrowUpRight, accent: "bg-emerald-50 text-emerald-600" },
          { label: "Salaries paid", value: formatTaka(sum("salary")), hint: `${staff.length} teachers · ${formatTaka(salaryPending)} pending`, icon: ArrowDownRight, accent: "bg-rose-50 text-rose-600" },
          { label: "Net", value: formatTaka(sum("net")), hint: `${pct(sum("salary"), sum("income"))}% of income goes to salaries`, icon: Scale, accent: "bg-indigo-50 text-indigo-600" },
          { label: "Still to collect", value: formatTaka(tuitionDue + admissionDue), hint: `Tuition ${formatTaka(tuitionDue)} · admission ${formatTaka(admissionDue)}`, icon: AlertTriangle, accent: "bg-amber-50 text-amber-600" },
        ]}
      />

      <Card className="p-5 sm:p-6 print:shadow-none">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Income vs salaries</h2>
            <p className="text-xs text-fg-muted">Money received and paid out each month (by payment date).</p>
          </div>
          <div className="flex gap-3 text-[11px] font-medium text-fg-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Tuition
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-300" /> Admission
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Salaries
            </span>
          </div>
        </div>
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <div className="flex h-56 min-w-[560px] items-end gap-3">
            {rows.map((r) => (
              <div key={r.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${MONTH_SHORT[Number(r.month.slice(5)) - 1]}: income ${formatTaka(r.income)} · salaries ${formatTaka(r.salary)}`}>
                <span className={cn("text-[10px] font-semibold tabular-nums", r.net >= 0 ? "text-emerald-600" : "text-rose-600")}>{r.net >= 0 ? "+" : "−"}{Math.round(Math.abs(r.net) / 1000)}k</span>
                <div className="flex w-full flex-1 items-end justify-center gap-1">
                  <div className="flex h-full w-3.5 flex-col justify-end overflow-hidden rounded-md bg-soft sm:w-5">
                    <div className="bg-teal-300 print:[print-color-adjust:exact]" style={{ height: `${(r.admission / max) * 100}%` }} />
                    <div className="bg-emerald-500 print:[print-color-adjust:exact]" style={{ height: `${(r.tuition / max) * 100}%` }} />
                  </div>
                  <div className="flex h-full w-3.5 items-end rounded-md bg-soft sm:w-5">
                    <div className="w-full rounded-md bg-rose-400 print:[print-color-adjust:exact]" style={{ height: `${(r.salary / max) * 100}%` }} />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-fg-subtle">{MONTH_SHORT[Number(r.month.slice(5)) - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 print:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2 print:col-span-2 print:shadow-none">
          <div className="p-5 pb-3 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Monthly statement</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-y border-line bg-subtle/60 text-right text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="px-5 py-2 text-left sm:px-6">Month</th>
                  <th className="px-3 py-2">Tuition</th>
                  <th className="px-3 py-2">Admission</th>
                  <th className="px-3 py-2">Income</th>
                  <th className="px-3 py-2">Salaries</th>
                  <th className="px-5 py-2 sm:px-6">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-right tabular-nums">
                {rows.map((r) => (
                  <tr key={r.month} className="transition hover:bg-subtle/50">
                    <td className="px-5 py-2.5 text-left font-medium text-fg sm:px-6">
                      {MONTH_SHORT[Number(r.month.slice(5)) - 1]} {r.month.slice(0, 4)}
                    </td>
                    <td className="px-3 py-2.5 text-fg-secondary">{formatTaka(r.tuition)}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{r.admission ? formatTaka(r.admission) : "—"}</td>
                    <td className="px-3 py-2.5 font-semibold text-fg">{formatTaka(r.income)}</td>
                    <td className="px-3 py-2.5 text-rose-600">{formatTaka(r.salary)}</td>
                    <td className={cn("px-5 py-2.5 font-semibold sm:px-6", r.net >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatTaka(r.net)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line bg-subtle/60 font-bold">
                  <td className="px-5 py-2.5 text-left text-fg sm:px-6">Total</td>
                  <td className="px-3 py-2.5">{formatTaka(sum("tuition"))}</td>
                  <td className="px-3 py-2.5">{formatTaka(sum("admission"))}</td>
                  <td className="px-3 py-2.5">{formatTaka(sum("income"))}</td>
                  <td className="px-3 py-2.5 text-rose-600">{formatTaka(sum("salary"))}</td>
                  <td className={cn("px-5 py-2.5 sm:px-6", sum("net") >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatTaka(sum("net"))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6 print:shadow-none">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Overdue tuition by class</h2>
            <ul className="mt-4 space-y-2">
              {classes.map((c) => {
                const due = accounts.filter((a) => a.student.className === c).reduce((s, a) => s + a.overdue, 0);
                return (
                  <li key={c} className="grid grid-cols-[64px_1fr_76px] items-center gap-2 text-xs">
                    <span className="truncate font-medium text-fg">{c}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-soft">
                      <div className="h-full rounded-full bg-rose-400 print:[print-color-adjust:exact]" style={{ width: `${(due / maxDue) * 100}%` }} />
                    </div>
                    <span className={cn("text-right tabular-nums", due ? "font-semibold text-rose-600" : "text-fg-subtle")}>{due ? formatTaka(due) : "—"}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="p-5 sm:p-6 print:shadow-none">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">How parents pay</h2>
            <ul className="mt-4 space-y-3">
              {methods.map((m) => {
                const meta = PAYMENT_METHODS[m.k];
                const Icon = meta.icon;
                return (
                  <li key={m.k} className="flex items-center gap-3 text-sm">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg print:[print-color-adjust:exact]", meta.accent)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 font-medium text-fg">{meta.label}</span>
                    <span className="tabular-nums text-fg-muted">{pct(m.total, sum("income"))}%</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
