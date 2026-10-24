"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, LayoutDashboard, Receipt, Search, Table2, Wallet, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatTaka } from "@/features/admissions/utils";
import { CollectTuitionDialog } from "@/features/students/components/profile/admin/FeeDialogs";
import { cn } from "@/lib/utils";

import { useFees, type FeeAccount } from "../hooks/use-fees";
import { useFeesStore } from "../store/fees.store";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/fees", label: "Overview", icon: LayoutDashboard },
  { href: "/fees/dues", label: "Dues & reminders", icon: AlertTriangle },
  { href: "/fees/payments", label: "Payments", icon: Receipt },
  { href: "/fees/structure", label: "Fee structure", icon: Table2 },
];

/** Page header, tabs and the shared "Collect payment" flow for every /fees/* page. */
export function FeesShell({ children }: { children: React.ReactNode }) {
  const openCollect = useFeesStore((s) => s.openCollect);
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Fees & Payments"
        description="Monthly tuition for every student — collect payments, follow up dues, print slips and keep the fee structure and discounts in one place."
        actions={
          <Button onClick={() => openCollect("pick")}>
            <Wallet className="h-4 w-4" />
            Collect payment
          </Button>
        }
      />
      <Suspense fallback={<TabsNav pathname="" />}>
        <ActiveTabs />
      </Suspense>
      {children}
      <CollectFlow />
    </div>
  );
}

function ActiveTabs() {
  return <TabsNav pathname={usePathname()} />;
}

function TabsNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Fees pages" className="-mx-1 -mt-2 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow" : "text-fg-muted hover:bg-soft hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Student picker → the student's Collect tuition dialog (same as the profile's Fees tab). */
function CollectFlow() {
  const { accounts } = useFees();
  const collecting = useFeesStore((s) => s.collecting);
  const openCollect = useFeesStore((s) => s.openCollect);
  if (!collecting) return null;
  if (collecting === "pick") return <PickStudentDialog accounts={accounts} onPick={(a) => openCollect({ studentId: a.student.id })} onClose={() => openCollect(null)} />;
  const account = accounts.find((a) => a.student.id === collecting.studentId);
  if (!account) return null;
  return <CollectTuitionDialog student={account.student} ledger={account.ledger} initialMonths={collecting.months} onClose={() => openCollect(null)} />;
}

function PickStudentDialog({ accounts, onPick, onClose }: { accounts: FeeAccount[]; onPick: (a: FeeAccount) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const found = term
      ? accounts.filter((a) => [a.student.name, a.student.id, a.student.phone, a.student.guardianName, `${a.student.className} ${a.student.roll}`].some((v) => v.toLowerCase().includes(term)))
      : [...accounts].sort((a, b) => b.overdue + b.dueNow - (a.overdue + a.dueNow));
    return found.slice(0, 8);
  }, [accounts, q]);

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Collect payment"
      description="Find the student by name, ID, roll or guardian phone."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Wallet className="h-5 w-5" />
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
          placeholder="e.g. Rahim, STU-2026-0100, Class 6 12, 017…"
          aria-label="Find student"
          className="h-11 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>
      <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{q.trim() ? "Matches" : "Most due first"}</p>
      {list.length === 0 ? (
        <p className="rounded-xl bg-subtle py-8 text-center text-sm text-fg-muted">No student matches “{q}”.</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {list.map((a) => {
            const owed = a.overdue + a.dueNow;
            return (
              <li key={a.student.id}>
                <button type="button" onClick={() => onPick(a)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-subtle">
                  <StudentAvatar name={a.student.name} photo={a.student.photo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{a.student.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {a.student.className} {a.student.section} · Roll {a.student.roll} · {a.student.id}
                    </p>
                  </div>
                  {owed > 0 ? <Badge tone={a.overdue ? "danger" : "info"}>{formatTaka(owed)} due</Badge> : <Badge tone="success">Paid up</Badge>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
