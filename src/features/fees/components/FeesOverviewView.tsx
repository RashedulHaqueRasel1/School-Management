"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2, Percent, Printer, Receipt, Wallet, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PAYMENT_METHODS, PAYMENT_METHOD_KEYS } from "@/features/admissions/constants";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { sortClasses } from "@/features/examinations/utils";
import { tuitionReceiptHref } from "@/features/students/components/profile/admin/FeeDialogs";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";

import { useFees } from "../hooks/use-fees";
import { useFeesStore } from "../store/fees.store";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/**
 * Fee collection at a glance: this month, the session, month-by-month billed vs
 * collected, methods, classes, recent payments and the largest dues.
 * BACKEND: GET /fees/summary?session=
 */
export function FeesOverviewView() {
  const { accounts, payments, hydrated, today } = useFees();
  const openCollect = useFeesStore((s) => s.openCollect);
  const setDuesClass = useFeesStore((s) => s.setDuesClass);
  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-[92px] animate-pulse rounded-2xl bg-soft" />
        <div className="h-80 animate-pulse rounded-2xl bg-soft" />
      </div>
    );
  }

  const month = today.slice(0, 7);
  const months = [...new Set(accounts.flatMap((a) => a.ledger.months.map((m) => m.month)))].sort();
  const byMonth = months.map((m) => {
    const rows = accounts.flatMap((a) => a.ledger.months.filter((x) => x.month === m));
    return { month: m, billed: rows.reduce((s, x) => s + x.fee, 0), paid: rows.reduce((s, x) => s + x.paid, 0) };
  });
  const max = Math.max(1, ...byMonth.map((m) => m.billed));
  const thisMonth = byMonth.find((m) => m.month === month) ?? { billed: 0, paid: 0 };
  const toDate = byMonth.filter((m) => m.month <= month);
  const billedToDate = toDate.reduce((s, m) => s + m.billed, 0);
  const paidToDate = toDate.reduce((s, m) => s + m.paid, 0);
  const receivedThisMonth = payments.filter((p) => p.paidOn.startsWith(month));
  const receivedToday = payments.filter((p) => p.paidOn === today);
  const overdue = accounts.filter((a) => a.overdue > 0);
  const overdueTotal = overdue.reduce((s, a) => s + a.overdue, 0);
  const sessionPaid = payments.reduce((s, p) => s + p.total, 0);

  const tiles: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    { label: "Received this month", value: formatTaka(receivedThisMonth.reduce((s, p) => s + p.total, 0)), hint: `${receivedThisMonth.length} payments · today ${formatTaka(receivedToday.reduce((s, p) => s + p.total, 0))}`, icon: Wallet, accent: "bg-emerald-50 text-emerald-600" },
    { label: "This month's fees paid", value: `${pct(thisMonth.paid, thisMonth.billed)}%`, hint: `${formatTaka(thisMonth.paid)} of ${formatTaka(thisMonth.billed)}`, icon: Percent, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Overdue", value: formatTaka(overdueTotal), hint: `${overdue.length} student(s) past the due date`, icon: AlertTriangle, accent: overdueTotal ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600" },
    { label: "Collected to date", value: `${pct(paidToDate, billedToDate)}%`, hint: `${formatTaka(paidToDate)} of ${formatTaka(billedToDate)} billed`, icon: CheckCircle2, accent: "bg-amber-50 text-amber-600" },
  ];

  const methods = PAYMENT_METHOD_KEYS.map((k) => ({ key: k, total: payments.filter((p) => p.method === k).reduce((s, p) => s + p.total, 0), n: payments.filter((p) => p.method === k).length })).filter((m) => m.n > 0).sort((a, b) => b.total - a.total);
  const classes = sortClasses([...new Set(accounts.map((a) => a.student.className))]).map((c) => {
    const list = accounts.filter((a) => a.student.className === c);
    const due = list.flatMap((a) => a.ledger.months.filter((m) => m.month <= month));
    return { className: c, students: list.length, billed: due.reduce((s, m) => s + m.fee, 0), paid: due.reduce((s, m) => s + m.paid, 0), overdue: list.reduce((s, a) => s + a.overdue, 0), defaulters: list.filter((a) => a.overdue > 0).length };
  });
  const top = [...overdue].sort((a, b) => b.overdue - a.overdue).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, hint, icon: Icon, accent }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums text-fg">{value}</p>
              <p className="truncate text-xs text-fg-subtle">{hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Monthly tuition · {month.slice(0, 4)}</h2>
              <p className="text-xs text-fg-muted">Billed vs collected for each month&apos;s fee.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-fg-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-200 dark:bg-indigo-500/40" /> Billed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600" /> Collected
              </span>
            </div>
          </div>
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <div className="flex h-52 min-w-[520px] items-end gap-2 sm:gap-3">
              {byMonth.map((m) => {
                const future = m.month > month;
                const rate = pct(m.paid, m.billed);
                return (
                  <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${MONTH_SHORT[Number(m.month.slice(5)) - 1]}: ${formatTaka(m.paid)} of ${formatTaka(m.billed)}`}>
                    <span className={cn("text-[10px] font-semibold tabular-nums", future ? "text-fg-subtle" : rate >= 90 ? "text-emerald-600" : rate >= 70 ? "text-amber-600" : "text-rose-600")}>{future ? "—" : `${rate}%`}</span>
                    <div className="relative flex w-full max-w-10 flex-1 items-end">
                      <div className={cn("absolute bottom-0 w-full rounded-lg", future ? "border border-dashed border-line" : "bg-indigo-100 dark:bg-indigo-500/20")} style={{ height: `${(m.billed / max) * 100}%` }} />
                      {!future && <div className={cn("relative w-full rounded-lg", m.month === month ? "bg-linear-to-t from-indigo-600 to-violet-500" : "bg-indigo-500")} style={{ height: `${(m.paid / max) * 100}%` }} />}
                    </div>
                    <span className={cn("text-[11px] font-medium", m.month === month ? "text-indigo-600" : "text-fg-subtle")}>{MONTH_SHORT[Number(m.month.slice(5)) - 1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Payment methods</h2>
          <p className="text-xs text-fg-muted">This session · {formatTaka(sessionPaid)}</p>
          <ul className="mt-5 space-y-4">
            {methods.map((m) => {
              const meta = PAYMENT_METHODS[m.key];
              const Icon = meta.icon;
              return (
                <li key={m.key} className="flex items-center gap-3">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-fg">{meta.label}</span>
                      <span className="text-xs tabular-nums text-fg-muted">
                        {formatTaka(m.total)} · {m.n}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct(m.total, sessionPaid)}%` }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5 pb-3 sm:px-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">By class</h2>
            <p className="text-xs text-fg-muted">Fees billed up to this month. Click a class to see who owes.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-y border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="px-5 py-2 sm:px-6">Class</th>
                <th className="px-3 py-2 text-right">Billed</th>
                <th className="px-3 py-2 text-right">Collected</th>
                <th className="px-3 py-2 text-right">Overdue</th>
                <th className="px-3 py-2 text-center">Defaulters</th>
                <th className="w-52 px-5 py-2 sm:px-6">Collection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {classes.map((c) => {
                const rate = pct(c.paid, c.billed);
                return (
                  <tr key={c.className} className="transition hover:bg-subtle/50">
                    <td className="px-5 py-3 sm:px-6">
                      <Link href="/fees/dues" onClick={() => setDuesClass(c.className)} className="font-medium text-fg hover:text-indigo-600">
                        {c.className}
                      </Link>
                      <p className="text-xs text-fg-muted">{c.students} students</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-fg-secondary">{formatTaka(c.billed)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600">{formatTaka(c.paid)}</td>
                    <td className={cn("px-3 py-3 text-right font-semibold tabular-nums", c.overdue ? "text-rose-600" : "text-fg-subtle")}>{c.overdue ? formatTaka(c.overdue) : "—"}</td>
                    <td className="px-3 py-3 text-center tabular-nums text-fg-secondary">{c.defaulters || "—"}</td>
                    <td className="px-5 py-3 sm:px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
                          <div className={cn("h-full rounded-full", rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${rate}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold tabular-nums text-fg-secondary">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <Receipt className="h-4 w-4 text-fg-muted" />
                Recent payments
              </h2>
              <p className="text-xs text-fg-muted">The latest tuition received.</p>
            </div>
            <Link href="/fees/payments" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All payments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {payments.slice(0, 7).map((p) => {
              const meta = PAYMENT_METHODS[p.method];
              return (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <StudentAvatar name={p.student.name} photo={p.student.photo} />
                  <div className="min-w-0 flex-1">
                    <Link href={studentHref(p.student, "fees")} className="block truncate text-sm font-medium text-fg hover:text-indigo-600">
                      {p.student.name}
                    </Link>
                    <p className="truncate text-xs text-fg-muted">
                      {formatDate(p.paidOn)} · {meta.label} · {p.allocations.map((a) => MONTH_SHORT[Number(a.month.slice(5)) - 1]).join(", ")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-fg">{formatTaka(p.total)}</span>
                  <a href={tuitionReceiptHref(p.receiptNo)} target="_blank" rel="noopener" aria-label={`Slip ${p.receiptNo}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600">
                    <Printer className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <CalendarCheck className="h-4 w-4 text-fg-muted" />
                Largest dues
              </h2>
              <p className="text-xs text-fg-muted">Overdue tuition, highest first.</p>
            </div>
            <Link href="/fees/dues" onClick={() => setDuesClass("all")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All dues
            </Link>
          </div>
          {top.length === 0 ? (
            <p className="mt-4 rounded-xl bg-emerald-50 py-8 text-center text-sm text-emerald-700">Nobody is overdue 🎉</p>
          ) : (
            <ul className="mt-4 space-y-1">
              {top.map((a) => (
                <li key={a.student.id} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-subtle">
                  <StudentAvatar name={a.student.name} photo={a.student.photo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{a.student.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {a.student.className} {a.student.section} · <Badge tone="danger">{a.overdueMonths} mo</Badge>
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openCollect({ studentId: a.student.id, months: a.ledger.months.filter((m) => m.due > 0 && m.dueDate < today).map((m) => m.month) })}>
                    {formatTaka(a.overdue)}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
