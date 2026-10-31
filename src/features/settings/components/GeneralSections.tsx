"use client";

import { Building2, CalendarRange, Globe, GraduationCap, Mail, MapPin, Phone, School, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { AcademicSettings } from "../store/settings.store";
import { ChipToggle, Panel, SaveBar, SectionHeader, useDraft } from "./parts";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const BOARDS = ["Dhaka", "Rajshahi", "Chattogram", "Cumilla", "Jashore", "Barishal", "Sylhet", "Dinajpur", "Mymensingh"];

export function SchoolProfileSection() {
  const { draft: v, patch, dirty, savedAt, discard, commit } = useDraft("school");
  const initials = v.shortName.trim().slice(0, 4) || "—";
  const invalid = !v.name.trim() || !v.eiin.trim();

  return (
    <section>
      <SectionHeader icon={School} title="School profile" description="Your institution's identity — shown on admit cards, receipts, report cards and notices." accent="bg-indigo-50 text-indigo-600" savedAt={savedAt} />

      {/* Live identity preview */}
      <Card className="relative mb-6 overflow-hidden">
        <div className="h-24 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 sm:h-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(255_255_255/0.25),transparent_45%)]" />
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-6">
          <div className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-surface p-1.5 shadow-card ring-1 ring-line">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-lg font-bold tracking-tight text-white">{initials}</div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold tracking-tight text-fg">{v.name || "School name"}</h3>
            <p className="truncate text-sm text-fg-muted">{v.motto || "Add a motto"}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-fg-secondary">
            <span className="rounded-lg bg-soft px-2.5 py-1">EIIN {v.eiin || "—"}</span>
            <span className="rounded-lg bg-soft px-2.5 py-1">Est. {v.established || "—"}</span>
            <span className="rounded-lg bg-soft px-2.5 py-1">{v.board} Board</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Basic information" description="Official name and registration" className="lg:col-span-2">
          <FieldGrid>
            <FormField label="School name" required className="sm:col-span-2" error={!v.name.trim() ? "School name is required" : undefined}>
              <Input value={v.name} onChange={(e) => patch({ name: e.target.value })} leftIcon={<Building2 />} invalid={!v.name.trim()} />
            </FormField>
            <FormField label="Short name" hint="Used on the logo and slips">
              <Input value={v.shortName} maxLength={6} onChange={(e) => patch({ shortName: e.target.value.toUpperCase() })} />
            </FormField>
            <FormField label="EIIN" required error={!v.eiin.trim() ? "EIIN is required" : undefined}>
              <Input value={v.eiin} inputMode="numeric" onChange={(e) => patch({ eiin: e.target.value.replace(/\D/g, "") })} invalid={!v.eiin.trim()} />
            </FormField>
            <FormField label="Established">
              <Input value={v.established} inputMode="numeric" maxLength={4} onChange={(e) => patch({ established: e.target.value.replace(/\D/g, "") })} />
            </FormField>
            <FormField label="Education board">
              <Select value={v.board} onChange={(e) => patch({ board: e.target.value })} className="h-11">
                {BOARDS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Principal / Head teacher" className="sm:col-span-2">
              <Input value={v.principal} onChange={(e) => patch({ principal: e.target.value })} leftIcon={<GraduationCap />} />
            </FormField>
            <FormField label="Motto" className="sm:col-span-2">
              <Input value={v.motto} onChange={(e) => patch({ motto: e.target.value })} />
            </FormField>
          </FieldGrid>
        </Panel>

        <div className="space-y-6">
          <Panel title="Logo" description="PNG or SVG, square, at least 256px">
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-line-strong bg-subtle/60 px-4 py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Upload className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-fg">Upload school logo</p>
              <p className="mt-0.5 text-xs text-fg-muted">Drag & drop or browse</p>
              <Button variant="outline" size="sm" className="mt-4" disabled title="Available once file storage is connected">
                Choose file
              </Button>
            </div>
          </Panel>
          <Panel title="Contact" description="Shown to parents">
            <div className="space-y-4">
              <FormField label="Phone">
                <Input value={v.phone} onChange={(e) => patch({ phone: e.target.value })} leftIcon={<Phone />} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={v.email} onChange={(e) => patch({ email: e.target.value })} leftIcon={<Mail />} />
              </FormField>
              <FormField label="Website">
                <Input value={v.website} onChange={(e) => patch({ website: e.target.value })} leftIcon={<Globe />} />
              </FormField>
            </div>
          </Panel>
        </div>

        <Panel title="Address" className="lg:col-span-3">
          <FormField label="Full address">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-3 h-[18px] w-[18px] text-fg-subtle" />
              <Textarea value={v.address} onChange={(e) => patch({ address: e.target.value })} rows={2} className="min-h-0 pl-11" />
            </div>
          </FormField>
        </Panel>
      </div>

      <SaveBar dirty={dirty} onDiscard={discard} onSave={() => commit("School profile")} disabled={invalid} />
    </section>
  );
}

const GRADING: { value: AcademicSettings["grading"]; title: string; description: string }[] = [
  { value: "gpa5", title: "GPA 5.00", description: "National curriculum (A+ to F)" },
  { value: "gpa4", title: "GPA 4.00", description: "Letter grades, 4-point scale" },
  { value: "percent", title: "Percentage", description: "Marks out of 100, no grades" },
];

export function AcademicSection() {
  const { draft: v, patch, dirty, savedAt, discard, commit } = useDraft("academic");
  const thisYear = new Date().getFullYear();
  const years = [thisYear - 1, thisYear, thisYear + 1].map(String);

  return (
    <section>
      <SectionHeader icon={CalendarRange} title="Academic year" description="Session dates, shifts, grading and the school week — used by routines, attendance and results." accent="bg-violet-50 text-violet-600" savedAt={savedAt} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Session", value: v.year },
          { label: "Working days", value: `${v.workingDays.length} / week` },
          { label: "Period length", value: `${v.periodMinutes} min` },
          { label: "Pass mark", value: `${v.passMark}%` },
        ].map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <p className="text-xs font-medium text-fg-muted">{s.label}</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-fg">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Session" description="The current academic year">
          <FieldGrid>
            <FormField label="Academic year" required className="sm:col-span-2">
              <Select value={v.year} onChange={(e) => patch({ year: e.target.value })} className="h-11">
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Starts in" required>
              <Select value={v.sessionStart} onChange={(e) => patch({ sessionStart: e.target.value })} className="h-11">
                {MONTHS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Ends in" required>
              <Select value={v.sessionEnd} onChange={(e) => patch({ sessionEnd: e.target.value })} className="h-11">
                {MONTHS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </FormField>
          </FieldGrid>
        </Panel>

        <Panel title="School week & periods">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-fg-secondary">Working days</p>
              <ChipToggle options={DAYS} value={v.workingDays} onChange={(workingDays) => patch({ workingDays })} min={1} />
            </div>
            <FieldGrid>
              <FormField label="Period length (minutes)" required>
                <Input type="number" min={20} max={90} value={v.periodMinutes} onChange={(e) => patch({ periodMinutes: e.target.valueAsNumber || 0 })} />
              </FormField>
              <FormField label="Pass mark (%)" required>
                <Input type="number" min={1} max={100} value={v.passMark} onChange={(e) => patch({ passMark: e.target.valueAsNumber || 0 })} />
              </FormField>
            </FieldGrid>
          </div>
        </Panel>

        <Panel title="Shifts & versions" description="At least one of each">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-fg-secondary">Shifts</p>
              <ChipToggle options={["Morning", "Day", "Evening"]} value={v.shifts} onChange={(shifts) => patch({ shifts })} min={1} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-fg-secondary">Versions</p>
              <ChipToggle options={["Bangla", "English"]} value={v.versions} onChange={(versions) => patch({ versions })} min={1} />
            </div>
          </div>
        </Panel>

        <Panel title="Grading system" description="How results are calculated">
          <div className="grid gap-2.5">
            {GRADING.map((g) => (
              <RadioCard key={g.value} name="grading" value={g.value} checked={v.grading === g.value} onSelect={() => patch({ grading: g.value })} title={g.title} description={g.description} />
            ))}
          </div>
        </Panel>
      </div>

      <SaveBar
        dirty={dirty}
        onDiscard={discard}
        onSave={() => commit("Academic settings")}
        disabled={v.periodMinutes < 20 || v.periodMinutes > 90 || v.passMark < 1 || v.passMark > 100}
      />
    </section>
  );
}
