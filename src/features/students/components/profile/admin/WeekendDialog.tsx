"use client";

import { useState } from "react";
import { ArrowLeftRight, CalendarOff, Lock, Plus, Repeat, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { CURRENT_USER } from "@/features/admissions/constants";
import { formatDate, uid } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { DEFAULT_WEEKEND, WEEKDAY_NAMES, holidayName, WEEKEND_DAYS, isOffDay, localToday, weekdayOf } from "../../../demoData/profile-data";
import type { WeekendPlan, WeekendSwap } from "../../../types/types";

/** Bangladesh week order: Saturday first. */
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
const short = (d: number) => WEEKDAY_NAMES[d]!.slice(0, 3);
const dayName = (iso: string) => WEEKDAY_NAMES[weekdayOf(iso)]!;
export const weeklyOffLabel = (plan: WeekendPlan) => (plan.days.length ? WEEK_ORDER.filter((d) => plan.days.includes(d)).map((d) => WEEKDAY_NAMES[d]).join(" + ") : "No weekly off day");

type Props = {
  /** Student / teacher name. */
  name: string;
  plan: WeekendPlan;
  /** Persist the whole plan; `action` / `detail` go to the audit log. */
  onSave: (plan: WeekendPlan, action: string, detail?: string) => void;
  onClose: () => void;
};

/**
 * Change someone's weekly off days, or swap one weekend day for a working day
 * (works on the weekend, takes another day off). Attendance, leave-day counts
 * and (for teachers) the routine follow the plan.
 * BACKEND: PUT /students|teachers/:id/weekend  { days, swaps }
 */
export function WeekendDialog({ name, plan, onSave, onClose }: Props) {
  const today = localToday();
  const [days, setDays] = useState<number[]>(plan.days);
  const [swaps, setSwaps] = useState<WeekendSwap[]>(plan.swaps);
  const [workOn, setWorkOn] = useState("");
  const [offOn, setOffOn] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const draft: WeekendPlan = { days, swaps };

  const toggleDay = (d: number) => {
    setError("");
    setDays((list) => (list.includes(d) ? list.filter((x) => x !== d) : list.length >= 3 ? list : [...list, d]));
  };

  function addSwap() {
    if (!workOn || !offOn) return setError("Pick both dates.");
    if (workOn < today || offOn < today) return setError("Swaps can only be planned for today or later.");
    if (!days.includes(weekdayOf(workOn)) || swaps.some((s) => s.workOn === workOn)) return setError(`${formatDate(workOn)} is not a weekly off day — pick a ${weeklyOffLabel(draft)}.`);
    if (holidayName(offOn)) return setError(`${formatDate(offOn)} is already a holiday (${holidayName(offOn)}).`);
    if (isOffDay(offOn, draft)) return setError(`${formatDate(offOn)} is already a day off — pick a working day.`);
    if (reason.trim().length < 3) return setError("Write the reason for the swap.");
    setSwaps((list) => [...list, { id: uid(), workOn, offOn, reason: reason.trim(), by: CURRENT_USER, at: new Date().toISOString() }].sort((a, b) => a.workOn.localeCompare(b.workOn)));
    setWorkOn("");
    setOffOn("");
    setReason("");
    setError("");
  }

  function save() {
    if (days.length === 0) return setError("Keep at least one weekly off day.");
    const changes: string[] = [];
    const sameDays = days.length === plan.days.length && days.every((d) => plan.days.includes(d));
    if (!sameDays) changes.push(`Weekly off: ${weeklyOffLabel(plan)} → ${weeklyOffLabel(draft)}`);
    const added = swaps.filter((s) => !plan.swaps.some((p) => p.id === s.id));
    const removed = plan.swaps.filter((p) => !swaps.some((s) => s.id === p.id));
    for (const s of added) changes.push(`Swap: works ${formatDate(s.workOn)}, off ${formatDate(s.offOn)} (${s.reason})`);
    for (const s of removed) changes.push(`Swap cancelled: ${formatDate(s.workOn)} ↔ ${formatDate(s.offOn)}`);
    if (changes.length === 0) return onClose();
    const action = !sameDays ? "Weekly off days changed" : added.length ? "Weekend swapped" : "Weekend swap cancelled";
    onSave(draft, action, changes.join(" · "));
    toast(action, { description: `${name} · ${changes[0]}` });
    onClose();
  }

  const isDefault = days.length === WEEKEND_DAYS.length && days.every((d) => WEEKEND_DAYS.includes(d));

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Weekend & swaps"
      description={`${name} · attendance, leave counts and routine follow this`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <CalendarOff className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save weekend</Button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Repeat className="h-4 w-4 text-fg-muted" />
              Weekly off days
            </h3>
            {!isDefault && (
              <button type="button" onClick={() => setDays(WEEKEND_DAYS)} className="text-xs font-semibold text-indigo-600 hover:underline">
                Reset to school default ({weeklyOffLabel(DEFAULT_WEEKEND)})
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_ORDER.map((d) => {
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col items-center rounded-xl border py-2.5 text-xs font-semibold transition",
                    on ? "border-sky-400 bg-sky-50 text-sky-700" : "border-line-strong text-fg-secondary hover:bg-subtle",
                  )}
                >
                  {short(d)}
                  <span className={cn("mt-0.5 text-[10px] font-medium", on ? "text-sky-600" : "text-fg-subtle")}>{on ? "Off" : "Work"}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-fg-muted">Up to 3 days. School default is {weeklyOffLabel(DEFAULT_WEEKEND)}. Past attendance is recalculated with the new pattern.</p>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
            <ArrowLeftRight className="h-4 w-4 text-fg-muted" />
            One-time weekend swap
          </h3>
          {swaps.length > 0 && (
            <ul className="mb-3 space-y-2">
              {swaps.map((s) => {
                const locked = s.workOn < today || s.offOn < today;
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium text-fg">
                        Works <span className="text-emerald-600">{dayName(s.workOn).slice(0, 3)} {formatDate(s.workOn)}</span>
                        <ArrowLeftRight className="mx-1.5 inline h-3.5 w-3.5 text-fg-subtle" />
                        Off <span className="text-sky-600">{dayName(s.offOn).slice(0, 3)} {formatDate(s.offOn)}</span>
                      </p>
                      <p className="truncate text-xs text-fg-muted">
                        {s.reason} · by {s.by}
                      </p>
                    </div>
                    {locked ? (
                      <span className="flex items-center gap-1 text-[11px] text-fg-subtle" title="Already in the attendance history">
                        <Lock className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : (
                      <button type="button" onClick={() => setSwaps((list) => list.filter((x) => x.id !== s.id))} aria-label="Cancel swap" className="rounded-lg p-1.5 text-fg-subtle hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="rounded-2xl border border-dashed border-line-strong p-4">
            <FieldGrid>
              <FormField label="Works on (weekend day)" hint={workOn ? dayName(workOn) : `A ${weeklyOffLabel(draft)}`}>
                <Input
                  type="date"
                  min={today}
                  value={workOn}
                  onChange={(e) => {
                    setWorkOn(e.target.value);
                    setError("");
                  }}
                />
              </FormField>
              <FormField label="Day off instead" hint={offOn ? dayName(offOn) : "A normal working day"}>
                <Input
                  type="date"
                  min={today}
                  value={offOn}
                  onChange={(e) => {
                    setOffOn(e.target.value);
                    setError("");
                  }}
                />
              </FormField>
              <FormField label="Reason" className="sm:col-span-2">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual sports day duty on Friday" />
              </FormField>
            </FieldGrid>
            <div className="mt-3 flex items-center justify-between gap-3">
              {error ? <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p> : <span />}
              <Button size="sm" variant="outline" onClick={addSwap}>
                <Plus className="h-3.5 w-3.5" />
                Add swap
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Dialog>
  );
}

/** Compact card on the Attendance tab: current weekend + upcoming swaps. */
export function WeekendCard({ plan, onManage }: { plan: WeekendPlan; onManage: () => void }) {
  const today = localToday();
  const upcoming = plan.swaps.filter((s) => s.workOn >= today || s.offOn >= today);
  const custom = !(plan.days.length === WEEKEND_DAYS.length && plan.days.every((d) => WEEKEND_DAYS.includes(d)));
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        <CalendarOff className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
          Weekly off: {weeklyOffLabel(plan)}
          {custom && <Badge tone="info">Custom</Badge>}
        </p>
        <p className="mt-0.5 text-xs text-fg-muted">
          {upcoming.length === 0
            ? "No weekend swaps planned."
            : upcoming.map((s) => `Works ${formatDate(s.workOn)} ↔ off ${formatDate(s.offOn)}`).join(" · ")}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onManage}>
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Weekend swap
      </Button>
    </Card>
  );
}
