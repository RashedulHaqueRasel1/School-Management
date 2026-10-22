"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { uid } from "@/features/admissions/utils";
import { toast } from "@/store/toast.store";

import { MAX_PERIODS_PER_WEEK } from "../../../demoData/mock-data";
import { useTeacherAdminStore } from "../../../store/teacher-admin.store";
import type { Teacher, TeachingAssignment } from "../../../types/types";

/**
 * Add or edit one class-section-subject assignment.
 * BACKEND: PUT /teachers/:id/assignments (whole list)
 */
export function AssignmentDialog({
  teacher,
  assignments,
  editing,
  onClose,
}: {
  teacher: Teacher;
  assignments: TeachingAssignment[];
  editing?: TeachingAssignment;
  onClose: () => void;
}) {
  const setAssignments = useTeacherAdminStore((s) => s.setAssignments);
  const [className, setClassName] = useState(editing?.className ?? "Class 6");
  const [section, setSection] = useState(editing?.section ?? "A");
  const [subject, setSubject] = useState(editing?.subject ?? teacher.subjects[0] ?? "");
  const [customSubject, setCustomSubject] = useState("");
  const [periods, setPeriods] = useState(editing?.periodsPerWeek ?? 4);
  const [error, setError] = useState("");

  const others = assignments.filter((a) => a.id !== editing?.id);
  const load = others.reduce((sum, a) => sum + a.periodsPerWeek, 0) + periods;
  const finalSubject = subject === "__custom" ? customSubject.trim() : subject;

  function submit() {
    if (!section.trim()) return setError("Enter the section.");
    if (finalSubject.length < 2) return setError("Choose or type the subject.");
    if (periods < 1 || periods > 10) return setError("Periods per week must be 1–10.");
    if (others.some((a) => a.className === className && a.section === section.trim() && a.subject === finalSubject)) {
      return setError(`Already teaching ${finalSubject} in ${className} ${section}.`);
    }
    const item: TeachingAssignment = { id: editing?.id ?? `${teacher.id}-${uid().slice(0, 6)}`, className, section: section.trim().toUpperCase(), subject: finalSubject, periodsPerWeek: periods };
    const next = editing ? assignments.map((a) => (a.id === editing.id ? item : a)) : [...assignments, item];
    setAssignments(teacher.id, next, editing ? "Class assignment changed" : "Class assigned", `${finalSubject} · ${className} ${item.section} · ${periods} period(s)/week`);
    toast(editing ? "Assignment updated" : "Class assigned", { description: `${finalSubject} · ${className} ${item.section}` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? "Edit assignment" : "Assign class"}
      description="Students of this class-section see this teacher for the subject."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <BookOpen className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{editing ? "Save" : "Assign"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid>
          <FormField label="Class" required>
            <Select value={className} onChange={(e) => setClassName(e.target.value)} className="h-11">
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Section" required hint="A, B or any custom section">
            <Input value={section} onChange={(e) => setSection(e.target.value)} />
          </FormField>
          <FormField label="Subject" required>
            <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-11">
              {teacher.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {editing && !teacher.subjects.includes(editing.subject) && <option value={editing.subject}>{editing.subject}</option>}
              <option value="__custom">Other subject…</option>
            </Select>
          </FormField>
          <FormField label="Periods per week" required>
            <Input type="number" min={1} max={10} value={periods} onChange={(e) => setPeriods(e.target.valueAsNumber || 0)} />
          </FormField>
          {subject === "__custom" && (
            <FormField label="Subject name" required className="sm:col-span-2">
              <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="e.g. Spoken English" />
            </FormField>
          )}
        </FieldGrid>
        <p className={load > MAX_PERIODS_PER_WEEK ? "rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700" : "text-sm text-fg-muted"}>
          Weekly load after this: <span className="font-semibold">{load}</span> / {MAX_PERIODS_PER_WEEK} periods
          {load > MAX_PERIODS_PER_WEEK && " — above the recommended maximum."}
        </p>
        {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}
