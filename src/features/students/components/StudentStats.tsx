import { GraduationCap, Sparkles, Users, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatTaka } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import type { Student } from "../types/types";

export function StudentStats({ students }: { students: Student[] }) {
  const boys = students.filter((s) => s.gender === "Male").length;
  const girls = students.length - boys;
  const admitted = students.filter((s) => s.source === "admission");
  const withDue = admitted.filter((s) => s.feeDue > 0);
  const totalDue = withDue.reduce((sum, s) => sum + s.feeDue, 0);

  const cards = [
    { label: "Total Students", value: students.length.toString(), hint: "Active this session", icon: GraduationCap, accent: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
    { label: "New Admissions", value: admitted.length.toString(), hint: "Joined after fee payment", icon: Sparkles, accent: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
    { label: "Boys / Girls", value: `${boys} / ${girls}`, hint: `${students.length ? Math.round((girls / students.length) * 100) : 0}% girls`, icon: Users, accent: "bg-sky-50 text-sky-600 ring-sky-100" },
    { label: "Admission Fee Due", value: formatTaka(totalDue), hint: `${withDue.length} student${withDue.length === 1 ? "" : "s"} with balance`, icon: Wallet, accent: "bg-amber-50 text-amber-600 ring-amber-100" },
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
