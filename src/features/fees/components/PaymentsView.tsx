"use client";

import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Download, Printer, Receipt, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PAYMENT_METHODS, PAYMENT_METHOD_KEYS } from "@/features/admissions/constants";
import { formatDate, formatTaka } from "@/features/admissions/utils";
import { sortClasses } from "@/features/examinations/utils";
import { tuitionReceiptHref } from "@/features/students/components/profile/admin/FeeDialogs";
import { addDaysIso, weekdayOf } from "@/features/students/demoData/profile-data";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useFees } from "../hooks/use-fees";

type Period = "today" | "week" | "month" | "session" | "custom";
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Every tuition payment received — filter by period, method and class; daily
 * collection print and CSV. BACKEND: GET /fees/payments?from=&to=&method=&classId=&q=
 */
export function PaymentsView() {
  const { payments, hydrated, today } = useFees();
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState("all");
  const [className, setClassName] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  // The collection report prints every row, not just this page.
  const [printing, setPrinting] = useState(false);
  function printReport() {
    flushSync(() => setPrinting(true));
    window.print();
    setPrinting(false);
  }

  const range = useMemo((): [string, string] => {
    if (period === "today") return [today, today];
    if (period === "week") return [addDaysIso(today, -((weekdayOf(today) + 1) % 7)), today]; // week starts Saturday
    if (period === "month") return [`${today.slice(0, 7)}-01`, today];
    if (period === "custom") return [from || "0000", to || "9999"];
    return ["0000", "9999"];
  }, [period, today, from, to]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter(
      (p) =>
        p.paidOn >= range[0] &&
        p.paidOn <= range[1] &&
        (method === "all" || p.method === method) &&
        (className === "all" || p.student.className === className) &&
        (!q || [p.receiptNo, p.student.name, p.student.id, p.transactionId].some((v) => v.toLowerCase().includes(q))),
    );
  }, [payments, range, method, className, search]);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-soft" />;

  const total = visible.reduce((s, p) => s + p.total, 0);
  const byMethod = PAYMENT_METHOD_KEYS.map((k) => ({ k, sum: visible.filter((p) => p.method === k).reduce((s, p) => s + p.total, 0) })).filter((m) => m.sum > 0);
  const last = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, last);
  const rows = visible.slice((current - 1) * pageSize, current * pageSize);
  const periodLabel = period === "today" ? formatDate(today) : period === "session" ? "Whole session" : `${range[0] === "0000" ? "Start" : formatDate(range[0])} – ${range[1] === "9999" ? "today" : formatDate(range[1])}`;
  const reset = () => setPage(1);

  function exportCsv() {
    const lines = [["Receipt", "Date", "Student ID", "Name", "Class", "Section", "Months", "Method", "Transaction", "Received by", "Amount"], ...visible.map((p) => [p.receiptNo, p.paidOn, p.student.id, p.student.name, p.student.className, p.student.section, p.allocations.map((a) => a.month).join(" "), PAYMENT_METHODS[p.method].label, p.transactionId, p.receivedBy, p.total])];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const url = URL.createObjectURL(new Blob([lines.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tuition-payments-${range[0] === "0000" ? "all" : range[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast("Export ready", { description: `${visible.length} payments · ${formatTaka(total)}`, tone: "info" });
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:p-5 print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
            {(
              [
                ["today", "Today"],
                ["week", "This week"],
                ["month", "This month"],
                ["session", "Session"],
                ["custom", "Custom"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" onClick={() => (setPeriod(v), reset())} className={cn("shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition", period === v ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}>
                {label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={from} max={to || today} onChange={(e) => (setFrom(e.target.value), reset())} aria-label="From" className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm text-fg shadow-card focus:border-indigo-400 focus:outline-none" />
              <span className="text-fg-subtle">–</span>
              <input type="date" value={to} min={from} max={today} onChange={(e) => (setTo(e.target.value), reset())} aria-label="To" className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm text-fg shadow-card focus:border-indigo-400 focus:outline-none" />
            </div>
          )}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => (setSearch(e.target.value), reset())}
              placeholder="Receipt, student or transaction ID..."
              aria-label="Search payments"
              className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Method" value={method} onChange={(e) => (setMethod(e.target.value), reset())} className="w-40">
            <option value="all">All methods</option>
            {PAYMENT_METHOD_KEYS.map((k) => (
              <option key={k} value={k}>
                {PAYMENT_METHODS[k].label}
              </option>
            ))}
          </Select>
          <Select aria-label="Class" value={className} onChange={(e) => (setClassName(e.target.value), reset())} className="w-40">
            <option value="all">All classes</option>
            {sortClasses([...new Set(payments.map((p) => p.student.className))]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <div className="flex-1" />
          <Button variant="outline" onClick={exportCsv} disabled={!visible.length}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={printReport} disabled={!visible.length}>
            <Printer className="h-4 w-4" />
            Collection report
          </Button>
        </div>
      </Card>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Tuition collection report</h1>
        <p className="text-sm">
          {periodLabel} · {visible.length} payments · {formatTaka(total)}
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
        <div className="sm:w-56">
          <p className="text-xs font-medium text-fg-muted">{periodLabel}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-fg">{formatTaka(total)}</p>
          <p className="text-xs text-fg-subtle">{visible.length} payment(s)</p>
        </div>
        <div className="flex-1 sm:border-l sm:border-line sm:pl-6">
          <div className="flex h-3 overflow-hidden rounded-full bg-soft">
            {byMethod.map((m, i) => (
              <div key={m.k} className={cn(["bg-pink-500", "bg-emerald-500", "bg-orange-500", "bg-sky-500", "bg-purple-500", "bg-indigo-500"][i % 6])} style={{ width: `${(m.sum / Math.max(1, total)) * 100}%` }} title={`${PAYMENT_METHODS[m.k].label}: ${formatTaka(m.sum)}`} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {byMethod.map((m, i) => (
              <span key={m.k} className="flex items-center gap-1.5 text-xs text-fg-muted">
                <span className={cn("h-2 w-2 rounded-full", ["bg-pink-500", "bg-emerald-500", "bg-orange-500", "bg-sky-500", "bg-purple-500", "bg-indigo-500"][i % 6])} />
                {PAYMENT_METHODS[m.k].label} <b className="tabular-nums text-fg">{formatTaka(m.sum)}</b>
              </span>
            ))}
          </div>
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={Receipt} title="No payments" description="Nothing received for this period and filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden print:border-0 print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="py-3 pl-5 pr-3 sm:pl-6">Receipt</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">For</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="w-16 py-3 pl-3 pr-5 print:hidden" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(printing ? visible : rows).map((p) => {
                  const m = PAYMENT_METHODS[p.method];
                  const Icon = m.icon;
                  return (
                    <tr key={p.id} className="transition hover:bg-subtle/50">
                      <td className="py-3 pl-5 pr-3 font-mono text-xs font-semibold text-fg sm:pl-6">{p.receiptNo}</td>
                      <td className="px-3 py-3 text-fg-secondary">{formatDate(p.paidOn)}</td>
                      <td className="px-3 py-3">
                        <Link href={studentHref(p.student, "fees")} className="font-medium text-fg hover:text-indigo-600">
                          {p.student.name}
                        </Link>
                        <p className="text-xs text-fg-muted">
                          {p.student.className} {p.student.section} · Roll {p.student.roll}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-fg-secondary">{p.allocations.map((a) => MONTH_SHORT[Number(a.month.slice(5)) - 1]).join(", ")}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 text-fg-secondary">
                          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", m.accent)}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          {m.label}
                          {p.transactionId && <span className="font-mono text-[11px] text-fg-subtle">{p.transactionId}</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatTaka(p.total)}</td>
                      <td className="py-3 pl-3 pr-5 text-right print:hidden">
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
          <div className="border-t border-line px-5 py-4 sm:px-6 print:hidden">
            <Pagination page={current} pageSize={pageSize} total={visible.length} pageSizeOptions={[15, 30, 60]} onPageChange={setPage} onPageSizeChange={(size) => (setPageSize(size), setPage(1))} />
          </div>
        </Card>
      )}
    </div>
  );
}
