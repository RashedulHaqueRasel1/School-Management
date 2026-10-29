"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IdCard, Printer, Search, Unlock } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatTaka } from "@/features/admissions/utils";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useExam, type Candidate } from "../../hooks/use-exam";
import { useExamAdminStore } from "../../store/exam-admin.store";
import { sortClasses } from "../../utils";

export const admitCardHref = (slug: string, q: { className?: string; studentId?: string } = {}) => {
  const params = new URLSearchParams();
  if (q.className) params.set("class", q.className);
  if (q.studentId) params.set("student", q.studentId);
  const query = params.toString();
  return `/admit-cards/${slug}${query ? `?${query}` : ""}`;
};

/**
 * Admit cards per candidate — withheld while tuition is due unless released.
 * BACKEND: GET /exams/:id/admit-cards?classId= (PDF) · POST /exams/:id/admit-cards/:studentId/release
 */
export function ExamAdmitCardsView({ slug }: { slug: string }) {
  const { exam, candidates } = useExam(slug);
  const release = useExamAdminStore((s) => s.release);
  const [className, setClassName] = useState("all");
  const [status, setStatus] = useState<"all" | "ready" | "withheld">("all");
  const [search, setSearch] = useState("");
  const [releasing, setReleasing] = useState<Candidate | null>(null);

  const inClass = useMemo(() => (candidates ?? []).filter((c) => className === "all" || c.student.className === className), [candidates, className]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inClass
      .filter((c) => (status === "ready" ? c.eligible : status === "withheld" ? !c.eligible : true))
      .filter((c) => !q || [c.student.name, c.student.id, String(c.student.roll)].some((v) => v.toLowerCase().includes(q)));
  }, [inClass, status, search]);
  if (!exam || !candidates) return null;

  const ready = inClass.filter((c) => c.eligible).length;
  const withheld = inClass.length - ready;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Admit cards</h2>
          <p className="text-xs text-fg-muted">Each card shows the student&apos;s routine, room and seat. Cards are withheld when 2+ months of tuition are unpaid — release one to let the student sit.</p>
        </div>
        <a href={admitCardHref(exam.slug, { className: className === "all" ? undefined : className })} target="_blank" rel="noreferrer" className={cn(buttonStyles(), ready === 0 && "pointer-events-none opacity-50")}>
          <Printer className="h-4 w-4" />
          Print {className === "all" ? "all" : className} ({ready})
        </a>
      </Card>

      <Card className="grid grid-cols-3 divide-x divide-line">
        {(
          [
            ["Candidates", inClass.length, "text-fg"],
            ["Ready", ready, "text-emerald-600"],
            ["Withheld", withheld, "text-amber-600"],
          ] as const
        ).map(([label, value, cls]) => (
          <div key={label} className="px-5 py-4">
            <p className="text-xs font-medium text-fg-muted">{label}</p>
            <p className={cn("mt-1 text-2xl font-bold tabular-nums", cls)}>{value}</p>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex gap-1">
          {(["all", "ready", "withheld"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn("rounded-xl px-3.5 py-2 text-sm font-semibold capitalize transition", status === s ? "bg-fg text-surface shadow-sm" : "text-fg-muted hover:bg-soft hover:text-fg")}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID or roll..."
            aria-label="Search candidates"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
        <Select aria-label="Class" value={className} onChange={(e) => setClassName(e.target.value)} className="lg:w-40">
          <option value="all">All classes</option>
          {sortClasses(exam.classes).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={IdCard} title="No candidates found" description="Try another class, status or search." />
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {visible.map((c) => (
            <div key={c.student.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
              <Link href={studentHref(c.student, "fees")} className="flex min-w-0 flex-1 items-center gap-3">
                <StudentAvatar name={c.student.name} photo={c.student.photo} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg hover:text-indigo-600">{c.student.name}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {c.student.className} {c.student.section} · Roll {c.student.roll} · {c.student.id}
                  </p>
                </div>
              </Link>
              <p className="text-xs text-fg-muted sm:w-36">{c.room ? `${c.room} · seat ${c.seat}` : <span className="text-rose-600">No seat</span>}</p>
              <div className="flex items-center gap-2">
                {c.due > 0 && <span className="text-xs tabular-nums text-fg-muted">{formatTaka(c.due)} due</span>}
                {c.eligible ? (
                  <Badge tone="success" dot>
                    {c.released ? "Released" : "Ready"}
                  </Badge>
                ) : (
                  <Badge tone="warning" dot>
                    {c.monthsDue} months unpaid
                  </Badge>
                )}
                {c.eligible ? (
                  <a href={admitCardHref(exam.slug, { studentId: c.student.id })} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "outline", size: "sm" })}>
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </a>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setReleasing(c)}>
                    <Unlock className="h-3.5 w-3.5" />
                    Release
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(releasing)}
        onClose={() => setReleasing(null)}
        title={`Release ${releasing?.student.name}'s admit card?`}
        tone="primary"
        description={`${formatTaka(releasing?.due ?? 0)} tuition is still due. The student can sit the exam; the due stays on their fee account.`}
        confirmLabel="Release"
        onConfirm={() => {
          release(exam.id, releasing!.student.id, `${releasing!.student.name} · ${formatTaka(releasing!.due)} due`);
          toast("Admit card released", { description: releasing!.student.name });
          setReleasing(null);
        }}
      />
    </div>
  );
}
