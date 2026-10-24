"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, Phone, Plus, Star, Trash2, UserRound, Users, X } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { normalizePhone } from "@/features/admissions/utils";
import type { Student } from "@/features/students/types/types";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import type { GuardianRole, Parent, ParentProfile } from "../../types/types";
import { ROLES, StudentPicker, defaultRelation } from "../profile/admin/ChildDialogs";

const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParentFormValues = {
  name: string;
  phone: string;
  email: string;
  occupation: string;
  nid: string;
  address: string;
  preferredChannel: ParentProfile["preferredChannel"];
  language: ParentProfile["language"];
  notes: string;
};

export type ChildLinkInput = { studentId: string; role: GuardianRole; relation: string; isPrimary: boolean };

function Section({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 border-b border-line bg-subtle/50 px-5 py-4 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
          <p className="mt-0.5 text-xs text-fg-muted">{description}</p>
        </div>
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </Card>
  );
}

/**
 * Add a guardian (with the children they're linked to) or edit one.
 * BACKEND: POST /parents · PATCH /parents/:id
 */
export function ParentForm({
  initial,
  parents,
  students,
  submitLabel,
  cancelHref,
  onSubmit,
}: {
  /** Editing an existing guardian (children are managed on the Children tab). */
  initial?: { parent: Parent; profile: ParentProfile };
  parents: Parent[];
  students: Student[];
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: ParentFormValues, children: ChildLinkInput[], existing?: Parent) => void;
}) {
  const isNew = !initial;
  const [v, setV] = useState<ParentFormValues>(() => ({
    name: initial?.parent.name ?? "",
    phone: initial?.parent.phone ?? "",
    email: initial?.parent.email ?? "",
    occupation: initial?.parent.occupation ?? "",
    nid: initial?.parent.nid ?? "",
    address: initial?.parent.address ?? "",
    preferredChannel: initial?.profile.preferredChannel ?? "sms",
    language: initial?.profile.language ?? "Bangla",
    notes: initial?.profile.notes ?? "",
  }));
  const [children, setChildren] = useState<ChildLinkInput[]>([]);
  const [picking, setPicking] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof ParentFormValues>(key: K, value: ParentFormValues[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const phone = normalizePhone(v.phone);
  const existing = parents.find((p) => p.key === phone && p.key !== initial?.parent.key);

  function addChild(studentId: string) {
    if (!studentId || children.some((c) => c.studentId === studentId)) return;
    const role: GuardianRole = existing?.roles[0] ?? "Father";
    setChildren((list) => [...list, { studentId, role, relation: defaultRelation(role), isPrimary: list.length === 0 }]);
    setPicking("");
    setErrors((e) => ({ ...e, children: "" }));
  }
  const patchChild = (id: string, patch: Partial<ChildLinkInput>) => setChildren((list) => list.map((c) => (c.studentId === id ? { ...c, ...patch } : c)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (v.name.trim().length < 3) next.name = "Enter the full name.";
    if (!PHONE_RE.test(phone)) next.phone = "Enter a valid 11-digit BD mobile number.";
    else if (!isNew && existing) next.phone = `This number belongs to ${existing.name}. Use a different number.`;
    if (v.email && !EMAIL_RE.test(v.email)) next.email = "Enter a valid email.";
    if (isNew && children.length === 0) next.children = "Link at least one child.";
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast("Please fix the highlighted fields", { tone: "error" });
      return;
    }
    onSubmit({ ...v, name: v.name.trim(), phone, email: v.email.trim().toLowerCase() }, children, existing);
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <Section icon={UserRound} title="Guardian" description="The mobile number identifies the guardian — siblings share one record.">
          <FieldGrid>
            <FormField label="Full name" required error={errors.name}>
              <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Abdul Karim" invalid={!!errors.name} />
            </FormField>
            <FormField label="Occupation">
              <Input value={v.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="e.g. Businessman" />
            </FormField>
            <FormField label="NID number">
              <Input value={v.nid} onChange={(e) => set("nid", e.target.value)} inputMode="numeric" />
            </FormField>
          </FieldGrid>
        </Section>

        <Section icon={Phone} title="Contact" description="School SMS and the guardian portal login use the mobile number.">
          <FieldGrid>
            <FormField label="Mobile number" required error={errors.phone}>
              <Input type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" invalid={!!errors.phone} />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} invalid={!!errors.email} />
            </FormField>
            <FormField label="Address" className="sm:col-span-2">
              <Input value={v.address} onChange={(e) => set("address", e.target.value)} />
            </FormField>
          </FieldGrid>
          {isNew && existing && (
            <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
              <span className="font-semibold">{existing.name}</span> already uses this number (guardian of {existing.links.map((l) => l.student.name).join(", ")}). The children below will be added to that
              guardian.
            </p>
          )}
        </Section>

        {isNew && (
          <Section icon={Users} title="Children" description="Students this guardian is responsible for. Pick a role for each.">
            {children.length > 0 && (
              <ul className="space-y-2.5">
                {children.map((c) => {
                  const s = students.find((x) => x.id === c.studentId)!;
                  return (
                    <li key={c.studentId} className="flex flex-col gap-3 rounded-2xl border border-line p-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <StudentAvatar name={s.name} photo={s.photo} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-fg">{s.name}</p>
                          <p className="text-xs text-fg-muted">
                            {s.id} · {s.className} {s.section}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          aria-label="Role"
                          value={c.role}
                          onChange={(e) => {
                            const role = e.target.value as GuardianRole;
                            patchChild(c.studentId, { role, relation: defaultRelation(role) });
                          }}
                          className="w-40"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </Select>
                        {c.role === "Local guardian" && <Input aria-label="Relation" value={c.relation} onChange={(e) => patchChild(c.studentId, { relation: e.target.value })} className="w-28" />}
                        <button
                          type="button"
                          onClick={() => patchChild(c.studentId, { isPrimary: !c.isPrimary })}
                          aria-pressed={c.isPrimary}
                          title="Primary contact for this child"
                          className={cn(
                            "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition",
                            c.isPrimary ? "border-amber-300 bg-amber-50 text-amber-700" : "border-line-strong text-fg-muted hover:bg-subtle",
                          )}
                        >
                          <Star className={cn("h-3.5 w-3.5", c.isPrimary && "fill-amber-400 text-amber-400")} />
                          Primary
                        </button>
                        <button type="button" onClick={() => setChildren((list) => list.filter((x) => x.studentId !== c.studentId))} aria-label={`Remove ${s.name}`} className="rounded-lg p-2 text-fg-subtle hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <StudentPicker students={students} exclude={new Set([...children.map((c) => c.studentId), ...(existing?.links.map((l) => l.student.id) ?? [])])} value={picking} onChange={setPicking} />
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" disabled={!picking} onClick={() => addChild(picking)}>
                <Plus className="h-4 w-4" />
                Add selected student
              </Button>
              {errors.children && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{errors.children}</p>}
            </div>
            <p className="text-xs text-fg-muted">If a child already has a guardian in the same role, that guardian is replaced.</p>
          </Section>
        )}

        <Section icon={BellRing} title="Communication" description="How the school contacts this guardian.">
          <FieldGrid>
            <FormField label="Preferred channel">
              <Select value={v.preferredChannel} onChange={(e) => set("preferredChannel", e.target.value as ParentFormValues["preferredChannel"])} className="h-11">
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="both">SMS + Email</option>
              </Select>
            </FormField>
            <FormField label="Language">
              <Select value={v.language} onChange={(e) => set("language", e.target.value as ParentFormValues["language"])} className="h-11">
                <option value="Bangla">Bangla</option>
                <option value="English">English</option>
              </Select>
            </FormField>
            <FormField label="Admin notes" className="sm:col-span-2" hint="Visible to staff only.">
              <Textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </FormField>
          </FieldGrid>
        </Section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="p-5">
          <p className="text-sm font-semibold text-fg">{isNew ? "New guardian" : "Edit guardian"}</p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            {isNew
              ? "Saving links the guardian to the selected children. Their portal login is the mobile number; a temporary password is sent by SMS."
              : `Changes apply to all ${initial?.parent.links.length} linked child(ren)'s guardian records.`}
          </p>
          <div className="mt-5 grid gap-2.5">
            <button type="submit" className={buttonStyles({ size: "lg", className: "w-full" })}>
              {submitLabel}
            </button>
            <Link href={cancelHref} className={buttonStyles({ variant: "outline", size: "lg", className: "w-full" })}>
              <X className="h-4 w-4" />
              Cancel
            </Link>
          </div>
        </Card>
      </aside>
    </form>
  );
}
