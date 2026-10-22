import { CheckCircle2, ClipboardList, Hourglass, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Admission } from "../types/types";
import { dueAmount, formatTaka, paidAmount } from "../utils";

export function AdmissionStats({ admissions }: { admissions: Admission[] }) {
  const total = admissions.length;
  const awaiting = admissions.filter((a) => a.status === "pending" || a.status === "in_review").length;
  const approved = admissions.filter((a) => a.status === "approved");
  const decided = admissions.filter((a) => a.status === "approved" || a.status === "rejected").length;
  const collected = admissions.reduce((sum, a) => sum + paidAmount(a), 0);
  const outstanding = approved.reduce((sum, a) => sum + dueAmount(a), 0);

  const cards = [
    { label: "Total Applications", value: total.toString(), hint: "This admission season", icon: ClipboardList, accent: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
    { label: "Awaiting Review", value: awaiting.toString(), hint: "Pending + in review", icon: Hourglass, accent: "bg-amber-50 text-amber-600 ring-amber-100" },
    {
      label: "Approved",
      value: approved.length.toString(),
      hint: `${decided ? Math.round((approved.length / decided) * 100) : 0}% approval rate`,
      icon: CheckCircle2,
      accent: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    },
    { label: "Fees Collected", value: formatTaka(collected), hint: `${formatTaka(outstanding)} still due from approved`, icon: Wallet, accent: "bg-violet-50 text-violet-600 ring-violet-100" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, accent }) => (
        <Card key={label} className="flex items-center gap-4 p-5">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset", accent)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg-muted">{label}</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-fg">{value}</p>
            <p className="truncate text-xs text-fg-subtle">{hint}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
