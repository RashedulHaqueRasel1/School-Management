"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Download, MessageSquareText, Search, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SCHOOL_INFO } from "@/features/admissions/constants";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate, formatDateTime, formatTaka, smsSegments } from "@/features/admissions/utils";
import { sortClasses } from "@/features/examinations/utils";
import { TUITION_DUE_DAY } from "@/features/students/demoData/fee-data";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useFees, type FeeAccount } from "../hooks/use-fees";
import { useFeesStore } from "../store/fees.store";

type View = "owing" | "overdue" | "due" | "clear";
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Who owes tuition: overdue / due this month, with collect and SMS reminders.
 * BACKEND: GET /fees/dues?classId=&status= · POST /fees/reminders { studentIds, message }
 */
export function DuesView() {
  const { accounts, hydrated, today } = useFees();
  const openCollect = useFeesStore((s) => s.openCollect);
  const className = useFeesStore((s) => s.duesClass);
  const setClassName = useFeesStore((s) => s.setDuesClass);
  const [view, setView] = useState<View>("owing");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reminding, setReminding] = useState<FeeAccount[] | null>(null);

  const inClass = useMemo(() => accounts.filter((a) => className === "all" || a.student.className === className), [accounts, className]);
  const counts = {
    owing: inClass.filter((a) => a.overdue + a.dueNow > 0).length,
    overdue: inClass.filter((a) => a.overdue > 0).length,
    due: inClass.filter((a) => a.dueNow > 0 && a.overdue === 0).length,
    clear: inClass.filter((a) => a.overdue + a.dueNow === 0).length,
  };
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inClass
      .filter((a) => (view === "owing" ? a.overdue + a.dueNow > 0 : view === "overdue" ? a.overdue > 0 : view === "due" ? a.dueNow > 0 && a.overdue === 0 : a.overdue + a.dueNow === 0))
      .filter((a) => !q || [a.student.name, a.student.id, a.student.phone, a.student.guardianName].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => b.overdue - a.overdue || b.dueNow - a.dueNow);
  }, [inClass, view, search]);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-soft" />;

  const picked = visible.filter((a) => selected.has(a.student.id));
  const allPicked = visible.length > 0 && picked.length === visible.length;
  const totalOverdue = visible.reduce((s, a) => s + a.overdue, 0);
  const totalDue = visible.reduce((s, a) => s + a.dueNow, 0);
  const toggle = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));

  function exportCsv() {
    const rows = [["Student ID", "Name", "Class", "Section", "Roll", "Guardian", "Phone", "Monthly fee", "Overdue months", "Overdue", "Due this month", "Last paid", "Reminded"], ...visible.map((a) => [a.student.id, a.student.name, a.student.className, a.student.section, a.student.roll, a.student.guardianName, a.student.phone, a.ledger.months[0]?.fee ?? a.ledger.baseFee, a.overdueMonths, a.overdue, a.dueNow, a.lastPaid ?? "", a.remindedAt?.slice(0, 10) ?? ""])];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tuition-dues-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        {(
          [
            ["Students owing", String(counts.owing), "text-fg"],
            ["Overdue", formatTaka(totalOverdue), "text-rose-600"],
            ["Due this month", formatTaka(totalDue), "text-indigo-600"],
            ["Paid up", String(counts.clear), "text-emerald-600"],
          ] as const
        ).map(([label, value, cls]) => (
          <div key={label} className="px-5 py-4">
            <p className="text-xs font-medium text-fg-muted">{label}</p>
            <p className={cn("mt-1 text-2xl font-bold tabular-nums", cls)}>{value}</p>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {(
            [
              ["owing", "Owing"],
              ["overdue", "Overdue"],
              ["due", "Due this month"],
              ["clear", "Paid up"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => (setView(v), setSelected(new Set()))}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition", view === v ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}
            >
              {label}
              <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", view === v ? "bg-surface/20" : "bg-soft")}>{counts[v]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, guardian or phone..."
            aria-label="Search dues"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
        <div className="flex gap-2">
          <Select aria-label="Class" value={className} onChange={(e) => (setClassName(e.target.value), setSelected(new Set()))} className="w-40">
            <option value="all">All classes</option>
            {sortClasses([...new Set(accounts.map((a) => a.student.className))]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={exportCsv} aria-label="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {picked.length > 0 && (
        <Card className="flex flex-col gap-3 border-indigo-200 bg-indigo-50/60 p-3 sm:flex-row sm:items-center sm:px-5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <p className="flex-1 text-sm font-medium text-fg">
            {picked.length} selected · {formatTaka(picked.reduce((s, a) => s + a.overdue + a.dueNow, 0))} owed
          </p>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
          <Button size="sm" onClick={() => setReminding(picked)}>
            <BellRing className="h-3.5 w-3.5" />
            Send reminder ({picked.length})
          </Button>
        </Card>
      )}

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={view === "clear" ? Wallet : CheckCircle2} title={view === "clear" ? "Nobody is fully paid up here" : "No dues here 🎉"} description="Try another class, view or search." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="w-10 py-3 pl-5">{view !== "clear" && <Checkbox checked={allPicked} indeterminate={picked.length > 0 && !allPicked} onCheckedChange={(on) => setSelected(on ? new Set(visible.map((a) => a.student.id)) : new Set())} aria-label="Select all" />}</th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Unpaid months</th>
                  <th className="px-3 py-3 text-right">Overdue</th>
                  <th className="px-3 py-3 text-right">This month</th>
                  <th className="px-3 py-3">Last paid</th>
                  <th className="py-3 pl-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((a) => {
                  const open = a.ledger.months.filter((m) => m.due > 0 && m.month <= today.slice(0, 7));
                  const fee = a.ledger.months[0]?.fee ?? a.ledger.baseFee;
                  return (
                    <tr key={a.student.id} className={cn("transition hover:bg-subtle/50", selected.has(a.student.id) && "bg-indigo-50/40 dark:bg-indigo-500/5")}>
                      <td className="py-3 pl-5">{view !== "clear" && <Checkbox checked={selected.has(a.student.id)} onCheckedChange={() => toggle(a.student.id)} aria-label={`Select ${a.student.name}`} />}</td>
                      <td className="px-3 py-3">
                        <Link href={studentHref(a.student, "fees")} className="flex items-center gap-3">
                          <StudentAvatar name={a.student.name} photo={a.student.photo} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg hover:text-indigo-600">{a.student.name}</p>
                            <p className="truncate text-xs text-fg-muted">
                              {a.student.className} {a.student.section} · Roll {a.student.roll} · {formatTaka(fee)}/mo
                              {a.ledger.settings.discountPercent > 0 && ` (−${a.ledger.settings.discountPercent}%)`}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {open.length === 0 ? (
                          <span className="text-xs text-fg-subtle">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {open.map((m) => (
                              <span key={m.month} title={`${m.label}: ${formatTaka(m.due)} due`} className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", m.dueDate < today ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-700", m.status === "partial" && "ring-1 ring-inset ring-amber-300")}>
                                {MONTH_SHORT[Number(m.month.slice(5)) - 1]}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={cn("px-3 py-3 text-right font-semibold tabular-nums", a.overdue ? "text-rose-600" : "text-fg-subtle")}>{a.overdue ? formatTaka(a.overdue) : "—"}</td>
                      <td className={cn("px-3 py-3 text-right tabular-nums", a.dueNow ? "text-indigo-600" : "text-fg-subtle")}>{a.dueNow ? formatTaka(a.dueNow) : "—"}</td>
                      <td className="px-3 py-3 text-xs text-fg-muted">
                        {a.lastPaid ? formatDate(a.lastPaid) : "Never"}
                        {a.remindedAt && (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-indigo-600" title={formatDateTime(a.remindedAt)}>
                            <MessageSquareText className="h-3 w-3" /> Reminded {formatDate(a.remindedAt.slice(0, 10))}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-5">
                        <div className="flex justify-end gap-1.5">
                          {a.overdue + a.dueNow > 0 && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setReminding([a])} aria-label={`Remind ${a.student.name}`} title="Send reminder">
                                <BellRing className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" onClick={() => openCollect({ studentId: a.student.id, months: open.map((m) => m.month) })}>
                                <Wallet className="h-3.5 w-3.5" />
                                Collect
                              </Button>
                            </>
                          )}
                          {a.overdue + a.dueNow === 0 && <Badge tone="success">Paid up</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {reminding && (
        <ReminderDialog
          accounts={reminding}
          today={today}
          onClose={() => setReminding(null)}
          onSent={() => {
            setReminding(null);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}

function ReminderDialog({ accounts, today, onClose, onSent }: { accounts: FeeAccount[]; today: string; onClose: () => void; onSent: () => void }) {
  const remind = useFeesStore((s) => s.remind);
  const [template, setTemplate] = useState(
    `Dear guardian, {student}'s tuition of {amount} is due ({months}). Please pay by the ${TUITION_DUE_DAY}th to avoid a late notice. — ${SCHOOL_INFO.name}`,
  );
  const fill = (a: FeeAccount) => {
    const open = a.ledger.months.filter((m) => m.due > 0 && m.month <= today.slice(0, 7));
    return template
      .replaceAll("{student}", a.student.name)
      .replaceAll("{amount}", formatTaka(a.overdue + a.dueNow))
      .replaceAll("{months}", open.map((m) => MONTH_SHORT[Number(m.month.slice(5)) - 1]).join(", "));
  };
  const preview = fill(accounts[0]!);
  const recent = accounts.filter((a) => a.remindedAt && a.remindedAt.slice(0, 10) === today).length;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={accounts.length === 1 ? `Remind ${accounts[0]!.student.guardianName}` : `Send reminder to ${accounts.length} guardians`}
      description="An SMS goes to each guardian's phone with their own amount and months."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <BellRing className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <span className="text-xs text-fg-muted sm:mr-auto sm:self-center">
            {smsSegments(preview)} SMS each · {accounts.length * smsSegments(preview)} total
          </span>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              remind(accounts.map((a) => a.student.id));
              toast("Reminders sent", { description: `${accounts.length} guardian(s) · SMS` });
              onSent();
            }}
          >
            <BellRing className="h-4 w-4" />
            Send
          </Button>
        </>
      }
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-fg-secondary">Message</span>
        <Textarea rows={4} value={template} onChange={(e) => setTemplate(e.target.value)} />
        <span className="mt-1 block text-xs text-fg-subtle">{"{student}, {amount} and {months} are filled in for each guardian."}</span>
      </label>
      <div className="mt-4 rounded-2xl border border-line bg-subtle p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
          Preview · {accounts[0]!.student.phone}
        </p>
        <p className="mt-1.5 text-sm text-fg">{preview}</p>
      </div>
      {recent > 0 && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{recent} guardian(s) were already reminded today.</p>}
    </Dialog>
  );
}
