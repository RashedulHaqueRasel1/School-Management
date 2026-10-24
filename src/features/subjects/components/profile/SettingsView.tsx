"use client";

import { useState } from "react";
import { History, ListChecks, Settings2, UserCheck, Users, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { formatDateTime } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useSubject } from "../../hooks/use-subject";
import { useSubjectAdminStore } from "../../store/subject-admin.store";
import type { SubjectAuditCategory, SubjectSettings, SubjectType } from "../../types/types";
import { SUBJECT_TYPES } from "../../utils";

const CATEGORY: Record<SubjectAuditCategory, { label: string; icon: LucideIcon; accent: string }> = {
  settings: { label: "Settings", icon: Settings2, accent: "bg-soft text-fg-muted" },
  teachers: { label: "Teachers", icon: UserCheck, accent: "bg-emerald-50 text-emerald-600" },
  syllabus: { label: "Syllabus", icon: ListChecks, accent: "bg-violet-50 text-violet-600" },
  students: { label: "Students", icon: Users, accent: "bg-indigo-50 text-indigo-600" },
};

export function SubjectSettingsView({ slug }: { slug: string }) {
  const { subject } = useSubject(slug);
  if (!subject) return null;
  // Keyed so the form resets when another subject is opened.
  return <Form key={subject.slug} slug={slug} />;
}

function Form({ slug }: { slug: string }) {
  const { subject, audit } = useSubject(slug);
  const saveSettings = useSubjectAdminStore((s) => s.saveSettings);
  const [v, setV] = useState<SubjectSettings>(() => ({
    code: subject!.code,
    type: subject!.type,
    classes: subject!.classes,
    periodsPerWeek: subject!.periodsPerWeek,
    fullMarks: subject!.fullMarks,
    passMarks: subject!.passMarks,
    description: subject!.description,
  }));
  const [error, setError] = useState("");
  const [category, setCategory] = useState<SubjectAuditCategory | "all">("all");
  if (!subject || !audit) return null;

  const keys = Object.keys(v) as (keyof SubjectSettings)[];
  const changed = keys.filter((k) => JSON.stringify(v[k]) !== JSON.stringify(subject[k]));
  const entries = category === "all" ? audit : audit.filter((a) => a.category === category);
  const toggleClass = (c: string) => setV((x) => ({ ...x, classes: x.classes.includes(c) ? x.classes.filter((y) => y !== c) : [...x.classes, c] }));

  function save() {
    if (!v.code.trim()) return setError("Enter the code.");
    if (v.passMarks <= 0 || v.passMarks >= v.fullMarks) return setError("Pass marks must be between 1 and the full marks.");
    if (v.classes.length === 0) return setError("Pick at least one class.");
    saveSettings(subject!.name, { ...v, code: v.code.trim().toUpperCase() }, changed.map((k) => `${k}: ${String(subject![k])} → ${String(v[k])}`).join(" · "));
    toast("Subject updated", { description: changed.join(", ") });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">Subject settings</h2>
        <div className="mt-4 space-y-4">
          <FieldGrid>
            <FormField label="Code">
              <Input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.slice(0, 4) })} />
            </FormField>
            <FormField label="Type">
              <Select value={v.type} onChange={(e) => setV({ ...v, type: e.target.value as SubjectType })} className="h-11">
                {SUBJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Periods / week">
              <Input type="number" min={1} max={10} value={v.periodsPerWeek} onChange={(e) => setV({ ...v, periodsPerWeek: e.target.valueAsNumber || 1 })} />
            </FormField>
            <FormField label="Full marks">
              <Input type="number" min={1} value={v.fullMarks} onChange={(e) => setV({ ...v, fullMarks: e.target.valueAsNumber || 0 })} />
            </FormField>
            <FormField label="Pass marks">
              <Input type="number" min={1} value={v.passMarks} onChange={(e) => setV({ ...v, passMarks: e.target.valueAsNumber || 0 })} />
            </FormField>
          </FieldGrid>
          <FormField label="Taught in" hint={subject.custom ? undefined : "Curriculum classes — changing them only affects this catalog and reports, not the national curriculum."}>
            <div className="flex flex-wrap gap-1.5">
              {CLASS_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleClass(c)}
                  aria-pressed={v.classes.includes(c)}
                  className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold transition", v.classes.includes(c) ? "border-violet-400 bg-violet-50 text-violet-700" : "border-line-strong text-fg-secondary hover:bg-subtle")}
                >
                  {c}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Description">
            <Textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={3} />
          </FormField>
          {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
          <Button className="w-full" disabled={changed.length === 0} onClick={save}>
            Save changes
          </Button>
          <p className="text-xs text-fg-muted">Marks & periods here are the subject defaults for planning and reports. Recorded exam marks are not changed.</p>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <History className="h-4 w-4 text-fg-muted" />
              Activity log
            </h2>
            <p className="mt-0.5 text-xs text-fg-muted">Settings, teacher assignments, syllabus and enrolment changes.</p>
          </div>
          <Select aria-label="Filter log" value={category} onChange={(e) => setCategory(e.target.value as SubjectAuditCategory | "all")} className="w-44">
            <option value="all">All changes</option>
            {(Object.keys(CATEGORY) as SubjectAuditCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY[c].label}
              </option>
            ))}
          </Select>
        </div>
        {entries.length === 0 ? (
          <EmptyState icon={History} title="No changes yet" description="Every change to this subject is recorded here." />
        ) : (
          <ol className="mt-6 space-y-5">
            {entries.map((e, i) => {
              const c = CATEGORY[e.category];
              const Icon = c.icon;
              return (
                <li key={e.id} className="relative flex gap-3.5">
                  {i < entries.length - 1 && <span aria-hidden className="absolute left-[17px] top-10 h-[calc(100%-0.25rem)] w-px bg-line-strong" />}
                  <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-surface", c.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{e.action}</p>
                      <Badge>{c.label}</Badge>
                    </div>
                    {e.detail && <p className="mt-0.5 text-sm text-fg-secondary">{e.detail}</p>}
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {e.by} · {formatDateTime(e.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
