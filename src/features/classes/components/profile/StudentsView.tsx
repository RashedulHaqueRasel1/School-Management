"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, ListOrdered, UserPlus, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatTaka } from "@/features/admissions/utils";
import { summarize } from "@/features/students/components/profile/attendance-utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useSection } from "../../hooks/use-section";
import { useSectionActions } from "../../hooks/use-section-actions";
import { MoveStudentsDialog } from "./admin/SectionDialogs";

export function SectionStudentsView({ slug }: { slug: string }) {
  const { section, sections, members } = useSection(slug);
  const actions = useSectionActions();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);
  if (!section || !members) return null;

  const month = localToday().slice(0, 7);
  const chosen = section.students.filter((s) => selected.has(s.id));
  const all = members.length > 0 && members.every((m) => selected.has(m.student.id));
  const gaps = section.students.some((s, i) => s.roll !== i + 1);
  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Class roster</h2>
          <p className="text-xs text-fg-muted">
            {section.students.length} of {section.settings.capacity} seats · type a roll number to change it (swaps with whoever has it)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <Button onClick={() => setMoving(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              Move {selected.size}
            </Button>
          )}
          {gaps && (
            <Button
              variant="outline"
              onClick={() => {
                actions.renumber(section, "current");
                toast("Roll gaps closed");
              }}
            >
              <ListOrdered className="h-4 w-4" />
              Close roll gaps
            </Button>
          )}
          <Link href="/admissions/new-application" className={buttonStyles({ variant: "outline" })}>
            <UserPlus className="h-4 w-4" />
            Admit student
          </Link>
        </div>
      </Card>

      {members.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No students yet" description="Admit new students or move students here from another section." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <th className="w-12 py-3 pl-5 pr-2">
                    <Checkbox
                      checked={all}
                      indeterminate={!all && selected.size > 0}
                      onCheckedChange={(v) => setSelected(v ? new Set(members.map((m) => m.student.id)) : new Set())}
                      aria-label="Select all students"
                    />
                  </th>
                  <th className="w-20 px-3 py-3">Roll</th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Guardian</th>
                  <th className="px-3 py-3">Attendance ({new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })})</th>
                  <th className="px-3 py-3">Tuition</th>
                  <th className="py-3 pl-3 pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map(({ student: s, profile, ledger }) => {
                  const rate = summarize(profile.attendance.filter((d) => d.date.startsWith(month)));
                  return (
                    <tr key={s.id} className={cn("transition-colors hover:bg-subtle/60", selected.has(s.id) && "bg-indigo-50/40")}>
                      <td className="py-3 pl-5 pr-2">
                        <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${s.name}`} />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          key={`${s.id}-${s.roll}`}
                          type="number"
                          min={1}
                          defaultValue={s.roll}
                          aria-label={`Roll of ${s.name}`}
                          onBlur={(e) => {
                            const roll = e.currentTarget.valueAsNumber;
                            if (!roll || roll < 1 || roll === s.roll) {
                              e.currentTarget.value = String(s.roll);
                              return;
                            }
                            actions.setRoll(section, s, roll);
                            toast("Roll changed", { description: `${s.name}: ${s.roll} → ${roll}` });
                          }}
                          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                          className="h-8 w-14 rounded-lg border border-line-strong bg-surface px-2 text-center text-sm font-semibold tabular-nums text-fg focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Link href={studentHref(s)} className="flex items-center gap-3">
                          <StudentAvatar name={s.name} photo={s.photo} />
                          <div>
                            <p className="font-semibold text-fg hover:text-indigo-600">{s.name}</p>
                            <p className="font-mono text-xs text-fg-subtle">
                              {s.id} · {s.gender === "Male" ? "Boy" : "Girl"}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-fg-secondary">{s.guardianName}</p>
                        <p className="text-xs text-fg-subtle">{s.phone}</p>
                      </td>
                      <td className="px-3 py-3">
                        {rate.schoolDays ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-soft">
                              <div className={cn("h-full rounded-full", rate.rate >= 90 ? "bg-emerald-500" : rate.rate >= 75 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${rate.rate}%` }} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-fg-secondary">{rate.rate}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-fg-subtle">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">{ledger.outstanding > 0 ? <Badge tone="danger">{formatTaka(ledger.outstanding)}</Badge> : <Badge tone="success">Clear</Badge>}</td>
                      <td className="py-3 pl-3 pr-5">{s.source === "admission" ? <Badge tone="info">New admission</Badge> : <Badge>Continuing</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {moving && chosen.length > 0 && (
        <MoveStudentsDialog section={section} students={chosen} sections={sections} onClose={() => setMoving(false)} onDone={() => setSelected(new Set())} />
      )}
    </div>
  );
}
