"use client";

import { useState } from "react";

import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { minutesToTime } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { EXAM_TYPES } from "../demoData/mock-data";
import type { ExamSettings } from "../types/types";

const START_TIMES = [8 * 60, 8 * 60 + 30, 9 * 60, 9 * 60 + 30, 10 * 60, 11 * 60, 13 * 60, 14 * 60];

export function validateExam(v: ExamSettings) {
  if (v.name.trim().length < 3) return "Enter the exam name.";
  if (!v.startDate) return "Choose the first exam day.";
  if (v.classes.length === 0) return "Choose at least one class.";
  if (v.fullMarks < 1 || v.passMarks < 1 || v.passMarks >= v.fullMarks) return "Pass marks must be between 1 and the full marks.";
  return "";
}

/** Fields shared by "New exam" and the exam's Settings tab. */
export function ExamFields({ value, onChange }: { value: ExamSettings; onChange: (patch: Partial<ExamSettings>) => void }) {
  const [custom] = useState(() => [...new Set([...CLASS_OPTIONS, ...value.classes])]);
  const all = value.classes.length === custom.length;
  return (
    <div className="space-y-4">
      <FieldGrid>
        <FormField label="Exam name" required className="sm:col-span-2">
          <Input value={value.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. Pre-test Exam 2026" />
        </FormField>
        <FormField label="Type" required>
          <Select value={value.type} onChange={(e) => onChange({ type: e.target.value as ExamSettings["type"] })} className="h-11">
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="First exam day" required hint="Fridays and holidays are skipped">
          <Input type="date" value={value.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
        </FormField>
        <FormField label="Papers start at" required>
          <Select value={value.startTime} onChange={(e) => onChange({ startTime: Number(e.target.value) })} className="h-11">
            {START_TIMES.map((t) => (
              <option key={t} value={t}>
                {minutesToTime(t)}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Full marks" required>
            <Input type="number" min={1} value={value.fullMarks} onChange={(e) => onChange({ fullMarks: e.target.valueAsNumber || 0 })} />
          </FormField>
          <FormField label="Pass marks" required>
            <Input type="number" min={1} value={value.passMarks} onChange={(e) => onChange({ passMarks: e.target.valueAsNumber || 0 })} />
          </FormField>
        </div>
      </FieldGrid>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-fg-secondary">
            Classes <span className="text-rose-500">*</span>
          </span>
          <button type="button" onClick={() => onChange({ classes: all ? [] : custom })} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            {all ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {custom.map((c) => {
            const on = value.classes.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ classes: on ? value.classes.filter((x) => x !== c) : [...value.classes, c] })}
                className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition", on ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-muted hover:bg-soft hover:text-fg")}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <FormField label="Instructions on admit card">
        <Textarea rows={3} value={value.instructions} onChange={(e) => onChange({ instructions: e.target.value })} />
      </FormField>
    </div>
  );
}
