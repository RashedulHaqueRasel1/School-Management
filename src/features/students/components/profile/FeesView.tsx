"use client";

import { useState } from "react";
import { AlertTriangle, BadgePercent, CalendarClock, CheckCircle2, Printer, Receipt, Wallet, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PAYMENT_METHODS } from "@/features/admissions/constants";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import { TUITION_DUE_DAY } from "../../demoData/fee-data";
import { localToday } from "../../demoData/profile-data";
import { useStudent } from "../../hooks/use-student";
import type { TuitionMonth } from "../../types/types";
import { CollectTuitionDialog, FeeSettingsDialog, tuitionReceiptHref } from "./admin/FeeDialogs";

const STATUS: Record<TuitionMonth["status"], { label: string; tone: BadgeTone; card: string }> = {
  paid: { label: "Paid", tone: "success", card: "border-emerald-200/70 bg-emerald-50/50" },
  partial: { label: "Partial", tone: "warning", card: "border-amber-200/70 bg-amber-50/50" },
  due: { label: "Due", tone: "info", card: "border-indigo-200/70 bg-indigo-50/40" },
  overdue: { label: "Overdue", tone: "danger", card: "border-rose-200/70 bg-rose-50/50" },
  upcoming: { label: "Upcoming", tone: "neutral", card: "border-line bg-surface" },
  waived: { label: "Waived", tone: "violet", card: "border-violet-200/70 bg-violet-50/40" },
};

export function FeesView({ slug }: { slug: string }) {
  const { student, tuition } = useStudent(slug);
  const [collect, setCollect] = useState<string[] | null>(null);
  const [settings, setSettings] = useState(false);
  if (!student || !tuition) return null;

  const fee = tuition.months[0]?.fee ?? tuition.baseFee;
  // Past the due date and not fully paid (includes part-paid months).
  const today = localToday();
  const overdue = tuition.months.filter((m) => m.due > 0 && m.dueDate < today);
  const cards: { label: string; value: string; hint: string; icon: LucideIcon; accent: string }[] = [
    {
      label: "Monthly fee",
      value: formatTaka(fee),
      hint: tuition.settings.discountPercent ? `${tuition.settings.discountPercent}% off · ${tuition.settings.discountReason}` : `Standard for ${student.className}`,
      icon: Wallet,
      accent: "bg-indigo-50 text-indigo-600",
    },
    { label: "Paid this session", value: formatTaka(tuition.paidTotal), hint: `${tuition.payments.length} payment(s)`, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-600" },
    {
      label: "Outstanding",
      value: formatTaka(tuition.outstanding),
      hint: overdue.length ? `${overdue.length} month(s) overdue` : "Nothing overdue",
      icon: AlertTriangle,
      accent: tuition.outstanding ? "bg-rose-50 text-rose-600" : "bg-soft text-fg-muted",
    },
    {
      label: "Next due",
      value: tuition.nextDue ? formatTaka(tuition.nextDue.due) : "—",
      hint: tuition.nextDue ? `${tuition.nextDue.label} · by ${formatDate(tuition.nextDue.dueDate)}` : "Session fully paid",
      icon: CalendarClock,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          Tuition is due by the {TUITION_DUE_DAY}th of each month. Session total {formatTaka(tuition.sessionTotal)}.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettings(true)}>
            <BadgePercent className="h-4 w-4" />
            Discount
          </Button>
          <Button onClick={() => setCollect([])}>
            <Wallet className="h-4 w-4" />
            Collect payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon, accent }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-2xl font-bold tabular-nums text-fg">{value}</p>
              <p className="truncate text-xs text-fg-subtle">{hint}</p>
            </div>
          </Card>
        ))}
      </div>

      {overdue.length > 0 && (
        <Card className="flex flex-col gap-3 border-rose-200/70 bg-rose-50 p-4 sm:flex-row sm:items-center sm:px-6">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="flex-1 text-sm text-rose-700">
            <span className="font-semibold">{formatTaka(overdue.reduce((s, m) => s + m.due, 0))} overdue</span> for {overdue.map((m) => m.label.split(" ")[0]).join(", ")}.
          </p>
          <Button size="sm" variant="danger" onClick={() => setCollect(overdue.map((m) => m.month))}>
            Collect overdue
          </Button>
        </Card>
      )}

      {/* Month grid */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">Monthly fees · {tuition.months[0]?.month.slice(0, 4)}</h2>
        <p className="mt-0.5 text-xs text-fg-muted">Click a month that isn&apos;t fully paid to collect it.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tuition.months.map((m) => {
            const style = STATUS[m.status];
            const payable = m.due > 0;
            const Tag = payable ? "button" : "div";
            return (
              <Tag
                key={m.month}
                {...(payable ? { type: "button" as const, onClick: () => setCollect([m.month]) } : {})}
                className={cn("rounded-2xl border p-4 text-left transition", style.card, payable && "hover:-translate-y-0.5 hover:shadow-card-hover")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-fg">{m.label.split(" ")[0]}</p>
                  <Badge tone={style.tone}>{style.label}</Badge>
                </div>
                <p className="mt-3 text-lg font-bold tabular-nums text-fg">{formatTaka(m.paid)}</p>
                <p className="text-xs text-fg-muted">of {formatTaka(m.fee)}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
                  <div className={cn("h-full rounded-full", m.status === "paid" || m.status === "waived" ? "bg-emerald-500" : "bg-amber-400")} style={{ width: `${m.fee ? Math.min(100, (m.paid / m.fee) * 100) : 100}%` }} />
                </div>
                <p className={cn("mt-2 text-[11px]", m.due > 0 && m.dueDate < today ? "font-semibold text-rose-600" : "text-fg-subtle")}>{m.due > 0 ? `${formatTaka(m.due)} due · ${formatDate(m.dueDate)}` : m.payments[0] ? `Paid ${formatDate(m.payments[0].paidOn)}` : "—"}</p>
              </Tag>
            );
          })}
        </div>
      </Card>

      {/* History */}
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Payment history</h2>
          <p className="mt-0.5 text-xs text-fg-muted">Every tuition payment with its slip. Payments are permanent records.</p>
        </div>
        {tuition.payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet" description="Tuition payments will appear here." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] whitespace-nowrap text-sm">
              <thead>
                <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <th className="py-3 pl-5 pr-3 sm:pl-6">Receipt</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">For month(s)</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="w-24 py-3 pl-3 pr-5 sm:pr-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tuition.payments.map((p) => {
                  const m = PAYMENT_METHODS[p.method];
                  const MethodIcon = m.icon;
                  return (
                    <tr key={p.id} className="hover:bg-subtle/60">
                      <td className="py-3 pl-5 pr-3 font-mono text-xs font-semibold text-fg sm:pl-6">{p.receiptNo}</td>
                      <td className="px-3 py-3 text-fg-secondary">{formatDate(p.paidOn)}</td>
                      <td className="px-3 py-3 text-fg-secondary">
                        {p.allocations.map((a) => new Date(`${a.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })).join(", ")}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 text-fg-secondary">
                          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", m.accent)}>
                            <MethodIcon className="h-3.5 w-3.5" />
                          </span>
                          {m.label}
                          {p.transactionId && <span className="font-mono text-[11px] text-fg-subtle">{p.transactionId}</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatTaka(p.total)}</td>
                      <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                        <a href={tuitionReceiptHref(p.receiptNo)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                          <Printer className="h-3.5 w-3.5" />
                          Slip
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {collect && <CollectTuitionDialog student={student} ledger={tuition} initialMonths={collect.length ? collect : undefined} onClose={() => setCollect(null)} />}
      {settings && <FeeSettingsDialog student={student} ledger={tuition} onClose={() => setSettings(false)} />}
    </div>
  );
}
