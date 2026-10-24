"use client";

import { useState } from "react";
import { Archive, BookOpen, CalendarCheck, CalendarDays, History, Settings2, UserRound, Users, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useSection } from "../../hooks/use-section";
import { useClassAdminStore } from "../../store/class-admin.store";
import type { ClassAuditCategory, SectionSettings } from "../../types/types";
import { ClassTeacherDialog } from "./admin/SectionDialogs";

const CATEGORY: Record<ClassAuditCategory, { label: string; icon: LucideIcon; accent: string }> = {
  settings: { label: "Settings", icon: Settings2, accent: "bg-soft text-fg-muted" },
  students: { label: "Students", icon: Users, accent: "bg-indigo-50 text-indigo-600" },
  subjects: { label: "Subjects", icon: BookOpen, accent: "bg-violet-50 text-violet-600" },
  routine: { label: "Routine", icon: CalendarDays, accent: "bg-sky-50 text-sky-600" },
  attendance: { label: "Attendance", icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
};

export function SectionSettingsView({ slug }: { slug: string }) {
  const { section, audit } = useSection(slug);
  if (!section || !audit) return null;
  // Keyed so the form resets when another section is opened.
  return <SettingsForm key={section.key} slug={slug} />;
}

function SettingsForm({ slug }: { slug: string }) {
  const { section, sections, teachers, audit } = useSection(slug);
  const saveSettings = useClassAdminStore((s) => s.saveSettings);
  const archive = useClassAdminStore((s) => s.archive);
  const [v, setV] = useState<SectionSettings>(() => section!.settings);
  const [changingTeacher, setChangingTeacher] = useState(false);
  const [category, setCategory] = useState<ClassAuditCategory | "all">("all");
  if (!section || !audit) return null;

  const fields: (keyof SectionSettings)[] = ["room", "capacity", "shift", "version", "note"];
  const changed = fields.filter((k) => (v[k] ?? "") !== (section.settings[k] ?? ""));
  const entries = category === "all" ? audit : audit.filter((a) => a.category === category);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Section settings</h2>
          <div className="mt-4 space-y-4">
            <FieldGrid>
              <FormField label="Room">
                <Input value={v.room} onChange={(e) => setV({ ...v, room: e.target.value })} />
              </FormField>
              <FormField label="Capacity">
                <Input type="number" min={1} value={v.capacity} onChange={(e) => setV({ ...v, capacity: e.target.valueAsNumber || 0 })} />
              </FormField>
              <FormField label="Shift">
                <Select value={v.shift} onChange={(e) => setV({ ...v, shift: e.target.value })} className="h-11">
                  <option value="Morning">Morning</option>
                  <option value="Day">Day</option>
                </Select>
              </FormField>
              <FormField label="Version">
                <Select value={v.version} onChange={(e) => setV({ ...v, version: e.target.value })} className="h-11">
                  <option value="Bangla">Bangla</option>
                  <option value="English">English</option>
                </Select>
              </FormField>
              <FormField label="Notes" className="sm:col-span-2">
                <Textarea value={v.note ?? ""} onChange={(e) => setV({ ...v, note: e.target.value })} rows={2} placeholder="e.g. Science group, lab on 2nd floor" />
              </FormField>
            </FieldGrid>
            {v.capacity < section.students.length && <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">Capacity is below the {section.students.length} students already enrolled.</p>}
            <Button
              className="w-full"
              disabled={changed.length === 0 || v.capacity < 1 || !v.room.trim()}
              onClick={() => {
                saveSettings(section.key, v, "Settings updated", changed.map((k) => `${k}: ${section.settings[k] ?? "—"} → ${v[k] ?? "—"}`).join(" · "));
                toast("Section updated", { description: changed.join(", ") });
              }}
            >
              Save changes
            </Button>
            <p className="text-xs text-fg-muted">Shift / version here describe the section; each student&apos;s own shift and version stay on their profile.</p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <UserRound className="h-4 w-4 text-fg-muted" />
            Class teacher
          </h2>
          <p className="mt-3 text-sm font-semibold text-fg">{section.classTeacher.name}</p>
          <p className="text-xs text-fg-muted">
            {section.classTeacher.designation} · {section.classTeacher.phone}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setChangingTeacher(true)}>
            Change class teacher
          </Button>
        </Card>

        <Card className="border-rose-200/70 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-rose-600 dark:text-rose-400">
            <Archive className="h-4 w-4" />
            Archive section
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {section.students.length ? `Move the ${section.students.length} student(s) to another section first.` : "Hides the section from lists and pickers. Can be restored."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-rose-600 dark:text-rose-400"
            disabled={section.students.length > 0 || section.archived}
            onClick={() => {
              archive(section.key, "Archived from settings");
              toast("Section archived");
            }}
          >
            {section.archived ? "Archived" : "Archive"}
          </Button>
        </Card>
      </div>

      <Card className="p-5 sm:p-6 xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <History className="h-4 w-4 text-fg-muted" />
              Activity log
            </h2>
            <p className="mt-0.5 text-xs text-fg-muted">Every change to this section — who, what and when.</p>
          </div>
          <Select aria-label="Filter log" value={category} onChange={(e) => setCategory(e.target.value as ClassAuditCategory | "all")} className="w-44">
            <option value="all">All changes</option>
            {(Object.keys(CATEGORY) as ClassAuditCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY[c].label}
              </option>
            ))}
          </Select>
        </div>
        {entries.length === 0 ? (
          <EmptyState icon={History} title="No changes yet" description="Settings, student moves, subject teachers, routine edits and register entries appear here." />
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

      {changingTeacher && <ClassTeacherDialog section={section} teachers={teachers} sections={sections} onClose={() => setChangingTeacher(false)} />}
    </div>
  );
}
