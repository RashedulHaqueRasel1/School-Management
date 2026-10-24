"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgePercent, CalendarClock, GraduationCap, Pencil, Plus, Receipt, School, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { defaultFeeFor } from "@/features/admissions/constants";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatTaka } from "@/features/admissions/utils";
import { classOrder, levelOf } from "@/features/classes/demoData/mock-data";
import { FeeSettingsDialog } from "@/features/students/components/profile/admin/FeeDialogs";
import { SESSION_END_MONTH, TUITION_DUE_DAY, monthlyFeeFor } from "@/features/students/demoData/fee-data";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";

import { useFees, type FeeAccount } from "../hooks/use-fees";

const LEVEL_ACCENT: Record<string, string> = {
  "Pre-primary": "bg-amber-50 text-amber-700",
  Primary: "bg-emerald-50 text-emerald-700",
  Secondary: "bg-indigo-50 text-indigo-700",
  Other: "bg-soft text-fg-secondary",
};

/**
 * Fee table by class + every student's discount (scholarship, sibling…).
 * BACKEND: GET /fees/structure · PUT /students/:id/tuition/settings
 */
export function StructureView() {
  const { accounts, hydrated } = useFees();
  const [editing, setEditing] = useState<FeeAccount | null>(null);
  const [picking, setPicking] = useState(false);
  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-soft" />;

  const classes = [...new Set([...CLASS_OPTIONS, ...accounts.map((a) => a.student.className)])].sort((a, b) => classOrder(a) - classOrder(b));
  const discounted = accounts.filter((a) => a.ledger.settings.discountPercent > 0).sort((a, b) => b.ledger.settings.discountPercent - a.ledger.settings.discountPercent);
  const monthlyWaiver = discounted.reduce((s, a) => s + (a.ledger.baseFee - (a.ledger.months[0]?.fee ?? a.ledger.baseFee)), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {(
          [
            [CalendarClock, "Due date", `${TUITION_DUE_DAY}th of every month`, "Unpaid after it shows as overdue", "bg-indigo-50 text-indigo-600"],
            [Receipt, "Billing", `January – ${new Date(`${SESSION_END_MONTH}-01`).toLocaleDateString("en-GB", { month: "long" })}`, "New students pay from their joining month", "bg-emerald-50 text-emerald-600"],
            [BadgePercent, "Discounts", `${discounted.length} students`, `${formatTaka(monthlyWaiver)} waived per month`, "bg-violet-50 text-violet-600"],
          ] as const
        ).map(([Icon, label, value, hint, accent]) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-lg font-bold tracking-tight text-fg">{value}</p>
              <p className="truncate text-xs text-fg-subtle">{hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-3">
          <div className="p-5 pb-3 sm:px-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <School className="h-4 w-4 text-fg-muted" />
              Fee table
            </h2>
            <p className="text-xs text-fg-muted">Standard fees per class for this session (before discounts).</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-y border-line bg-subtle/60 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <th className="px-5 py-2 sm:px-6">Class</th>
                  <th className="px-3 py-2 text-right">Admission</th>
                  <th className="px-3 py-2 text-right">Monthly tuition</th>
                  <th className="px-3 py-2 text-right">Year (12 mo)</th>
                  <th className="px-5 py-2 text-center sm:px-6">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {classes.map((c) => {
                  const fee = monthlyFeeFor(c);
                  const level = levelOf(c);
                  const n = accounts.filter((a) => a.student.className === c).length;
                  return (
                    <tr key={c} className="transition hover:bg-subtle/50">
                      <td className="px-5 py-3 sm:px-6">
                        <span className="font-medium text-fg">{c}</span>
                        <span className={cn("ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", LEVEL_ACCENT[level])}>{level}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-fg-secondary">{formatTaka(defaultFeeFor(c))}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatTaka(fee)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-fg-secondary">{formatTaka(fee * 12)}</td>
                      <td className="px-5 py-3 text-center tabular-nums text-fg-muted sm:px-6">{n || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <BadgePercent className="h-4 w-4 text-fg-muted" />
                Discounts & scholarships
              </h2>
              <p className="text-xs text-fg-muted">Applied to every month&apos;s tuition.</p>
            </div>
            <Button size="sm" onClick={() => setPicking(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {discounted.length === 0 ? (
            <p className="mt-4 rounded-xl bg-subtle py-10 text-center text-sm text-fg-muted">No discounts yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {discounted.map((a) => {
                const fee = a.ledger.months[0]?.fee ?? a.ledger.baseFee;
                return (
                  <li key={a.student.id} className="flex items-center gap-3 py-2.5">
                    <StudentAvatar name={a.student.name} photo={a.student.photo} />
                    <div className="min-w-0 flex-1">
                      <Link href={studentHref(a.student, "fees")} className="block truncate text-sm font-medium text-fg hover:text-indigo-600">
                        {a.student.name}
                      </Link>
                      <p className="truncate text-xs text-fg-muted">
                        {a.student.className} · {a.ledger.settings.discountReason || "—"} · {formatTaka(fee)}/mo
                      </p>
                    </div>
                    <Badge tone="violet">−{a.ledger.settings.discountPercent}%</Badge>
                    <button type="button" onClick={() => setEditing(a)} aria-label={`Edit discount for ${a.student.name}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-fg">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {picking && (
        <PickDialog
          accounts={accounts.filter((a) => a.ledger.settings.discountPercent === 0)}
          onPick={(a) => {
            setPicking(false);
            setEditing(a);
          }}
          onClose={() => setPicking(false)}
        />
      )}
      {editing && <FeeSettingsDialog student={editing.student} ledger={editing.ledger} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PickDialog({ accounts, onPick, onClose }: { accounts: FeeAccount[]; onPick: (a: FeeAccount) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = accounts.filter((a) => !term || [a.student.name, a.student.id, a.student.className].some((v) => v.toLowerCase().includes(term))).slice(0, 8);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a discount"
      description="Choose the student, then set the percentage and reason."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <GraduationCap className="h-5 w-5" />
        </span>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, ID or class..."
          aria-label="Find student"
          className="h-11 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
        {list.map((a) => (
          <li key={a.student.id}>
            <button type="button" onClick={() => onPick(a)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-subtle">
              <StudentAvatar name={a.student.name} photo={a.student.photo} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{a.student.name}</span>
                <span className="block truncate text-xs text-fg-muted">
                  {a.student.className} {a.student.section} · {formatTaka(a.ledger.baseFee)}/mo
                </span>
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="py-8 text-center text-sm text-fg-muted">No student found.</li>}
      </ul>
    </Dialog>
  );
}
