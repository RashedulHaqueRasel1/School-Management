"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, BriefcaseBusiness, CheckCircle2, Circle, FileText, GraduationCap, KeyRound, Phone, Plus, UserRound, Wallet, X } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DocumentsUpload } from "@/features/admissions/components/form/DocumentsUpload";
import { PhotoUpload } from "@/features/admissions/components/form/PhotoUpload";
import { BLOOD_GROUPS, RELIGIONS } from "@/features/admissions/constants";
import { normalizePhone } from "@/features/admissions/utils";
import { TEACHERS, localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES } from "../../demoData/mock-data";
import type { EmploymentType, Teacher, TeacherInput } from "../../types/types";

const SUBJECT_OPTIONS = [...new Set([...TEACHERS.map((t) => t.subject), "General Knowledge"])].sort();
const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY: TeacherInput = {
  photo: null,
  name: "",
  gender: "Female",
  dateOfBirth: "",
  bloodGroup: "",
  religion: "Islam",
  nid: "",
  phone: "",
  email: "",
  presentAddress: "",
  permanentAddress: "",
  emergencyContact: { name: "", relation: "", phone: "" },
  designation: "Assistant Teacher",
  department: "Science",
  employmentType: "Permanent",
  joinedOn: "",
  shift: "Morning",
  subjects: [],
  qualification: { degree: "", institution: "", year: "" },
  priorExperience: 0,
  bankAccount: "",
  documents: [],
};

export type TeacherFormExtras = { basicSalary?: number; createAccount: boolean };

function Section({ step, icon: Icon, title, description, children }: { step: number; icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 border-b border-line bg-subtle/50 px-5 py-4 sm:px-6">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-surface">{step}</span>
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
 * Add / edit a teacher. Only the essentials are required.
 * BACKEND: POST /teachers (new) · PATCH /teachers/:id (edit)
 */
export function TeacherForm({
  initial,
  submitLabel,
  cancelHref,
  onSubmit,
}: {
  initial?: Teacher;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (input: TeacherInput, extras: TeacherFormExtras) => void;
}) {
  const isNew = !initial;
  const [v, setV] = useState<TeacherInput>(() => {
    if (!initial) return EMPTY;
    const copy: TeacherInput & Partial<Pick<Teacher, "id" | "status">> = { ...initial };
    delete copy.id;
    delete copy.status;
    return copy;
  });
  const [basicSalary, setBasicSalary] = useState("30000");
  const [createAccount, setCreateAccount] = useState(true);
  const [customSubject, setCustomSubject] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof TeacherInput>(key: K, value: TeacherInput[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const toggleSubject = (subject: string) =>
    set("subjects", v.subjects.includes(subject) ? v.subjects.filter((s) => s !== subject) : [...v.subjects, subject]);

  const checklist = [
    { label: "Full name", done: v.name.trim().length >= 3 },
    { label: "Date of birth", done: Boolean(v.dateOfBirth) },
    { label: "Mobile number", done: PHONE_RE.test(normalizePhone(v.phone)) },
    { label: "Email", done: EMAIL_RE.test(v.email) },
    { label: "Present address", done: v.presentAddress.trim().length >= 5 },
    { label: "Joining date", done: Boolean(v.joinedOn) },
    { label: "At least one subject", done: v.subjects.length > 0 },
    { label: "Highest degree", done: v.qualification.degree.trim().length >= 2 },
  ];
  const done = checklist.filter((c) => c.done).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (v.name.trim().length < 3) next.name = "Enter the full name.";
    if (!v.dateOfBirth) next.dateOfBirth = "Date of birth is required.";
    else if (v.dateOfBirth > `${Number(localToday().slice(0, 4)) - 18}${localToday().slice(4)}`) next.dateOfBirth = "Teacher must be at least 18 years old.";
    if (!PHONE_RE.test(normalizePhone(v.phone))) next.phone = "Enter a valid 11-digit BD mobile number.";
    if (!EMAIL_RE.test(v.email)) next.email = "Enter a valid email — used for the portal login.";
    if (v.presentAddress.trim().length < 5) next.presentAddress = "Present address is required.";
    if (!v.joinedOn) next.joinedOn = "Joining date is required.";
    if (v.subjects.length === 0) next.subjects = "Choose at least one subject.";
    if (v.qualification.degree.trim().length < 2) next.degree = "Enter the highest degree.";
    if (v.emergencyContact.phone && !PHONE_RE.test(normalizePhone(v.emergencyContact.phone))) next.emergency = "Enter a valid mobile number.";
    const salary = Number(basicSalary);
    if (isNew && (!Number.isFinite(salary) || salary < 1000)) next.basicSalary = "Enter the basic salary.";
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast("Please complete the required fields", { tone: "error" });
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    onSubmit(
      {
        ...v,
        name: v.name.trim(),
        phone: normalizePhone(v.phone),
        email: v.email.trim().toLowerCase(),
        emergencyContact: { ...v.emergencyContact, phone: v.emergencyContact.phone ? normalizePhone(v.emergencyContact.phone) : "" },
      },
      { basicSalary: isNew ? salary : undefined, createAccount: isNew && createAccount },
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <Section step={1} icon={UserRound} title="Personal information" description="As on the national ID card.">
          <PhotoUpload value={v.photo} onChange={(photo) => set("photo", photo)} />
          <FieldGrid className="lg:grid-cols-3">
            <FormField label="Full name" required error={errors.name} className="sm:col-span-2 lg:col-span-1">
              <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sharmin Akter" invalid={!!errors.name} />
            </FormField>
            <FormField label="Gender" required>
              <Select value={v.gender} onChange={(e) => set("gender", e.target.value as TeacherInput["gender"])} className="h-11">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </Select>
            </FormField>
            <FormField label="Date of birth" required error={errors.dateOfBirth}>
              <Input type="date" value={v.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} invalid={!!errors.dateOfBirth} />
            </FormField>
            <FormField label="Blood group">
              <Select value={v.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} className="h-11">
                <option value="">Unknown</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Religion">
              <Select value={v.religion} onChange={(e) => set("religion", e.target.value)} className="h-11">
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="NID number">
              <Input value={v.nid} onChange={(e) => set("nid", e.target.value)} inputMode="numeric" />
            </FormField>
          </FieldGrid>
        </Section>

        <Section step={2} icon={Phone} title="Contact" description="The mobile and email are used for the portal and SMS.">
          <FieldGrid>
            <FormField label="Mobile number" required error={errors.phone}>
              <Input type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" invalid={!!errors.phone} />
            </FormField>
            <FormField label="Email" required error={errors.email}>
              <Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="name@edumanage.school" invalid={!!errors.email} />
            </FormField>
            <FormField label="Present address" required error={errors.presentAddress} className="sm:col-span-2">
              <Input value={v.presentAddress} onChange={(e) => set("presentAddress", e.target.value)} invalid={!!errors.presentAddress} />
            </FormField>
            <FormField label="Permanent address" className="sm:col-span-2">
              <Input value={v.permanentAddress} onChange={(e) => set("permanentAddress", e.target.value)} />
            </FormField>
          </FieldGrid>
          <div className="rounded-2xl border border-line bg-subtle/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Emergency contact</p>
            <FieldGrid className="lg:grid-cols-3">
              <FormField label="Name">
                <Input value={v.emergencyContact.name} onChange={(e) => set("emergencyContact", { ...v.emergencyContact, name: e.target.value })} />
              </FormField>
              <FormField label="Relation">
                <Input value={v.emergencyContact.relation} onChange={(e) => set("emergencyContact", { ...v.emergencyContact, relation: e.target.value })} placeholder="e.g. Spouse" />
              </FormField>
              <FormField label="Mobile" error={errors.emergency}>
                <Input type="tel" value={v.emergencyContact.phone} onChange={(e) => set("emergencyContact", { ...v.emergencyContact, phone: e.target.value })} invalid={!!errors.emergency} />
              </FormField>
            </FieldGrid>
          </div>
        </Section>

        <Section step={3} icon={BriefcaseBusiness} title="Employment" description="Role, department and joining details.">
          <FieldGrid className="lg:grid-cols-3">
            <FormField label="Designation" required>
              <Select value={v.designation} onChange={(e) => set("designation", e.target.value)} className="h-11">
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Department" required>
              <Select value={v.department} onChange={(e) => set("department", e.target.value)} className="h-11">
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Employment type" required>
              <Select value={v.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)} className="h-11">
                {EMPLOYMENT_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Joining date" required error={errors.joinedOn}>
              <Input type="date" value={v.joinedOn} onChange={(e) => set("joinedOn", e.target.value)} invalid={!!errors.joinedOn} />
            </FormField>
            <FormField label="Shift" required>
              <Select value={["Morning", "Day"].includes(v.shift) ? v.shift : "Morning"} onChange={(e) => set("shift", e.target.value)} className="h-11">
                <option value="Morning">Morning</option>
                <option value="Day">Day</option>
              </Select>
            </FormField>
            <FormField label="Prior experience (years)">
              <Input type="number" min={0} value={v.priorExperience} onChange={(e) => set("priorExperience", Math.max(0, e.target.valueAsNumber || 0))} />
            </FormField>
          </FieldGrid>
        </Section>

        <Section step={4} icon={BookOpen} title="Subjects" description="What this teacher can teach — classes are assigned on the profile.">
          <div className="flex flex-wrap gap-2">
            {[...new Set([...SUBJECT_OPTIONS, ...v.subjects])].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubject(s)}
                aria-pressed={v.subjects.includes(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  v.subjects.includes(s) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-secondary hover:bg-subtle",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex max-w-md gap-2">
            <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="Other subject, e.g. Spoken English" />
            <button
              type="button"
              onClick={() => {
                if (customSubject.trim().length < 2) return;
                toggleSubject(customSubject.trim());
                setCustomSubject("");
              }}
              className={buttonStyles({ variant: "outline", className: "h-11" })}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {errors.subjects && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.subjects}</p>}
        </Section>

        <Section step={5} icon={GraduationCap} title="Qualification" description="Highest academic degree.">
          <FieldGrid className="lg:grid-cols-3">
            <FormField label="Degree" required error={errors.degree}>
              <Input value={v.qualification.degree} onChange={(e) => set("qualification", { ...v.qualification, degree: e.target.value })} placeholder="e.g. M.Sc. in Physics" invalid={!!errors.degree} />
            </FormField>
            <FormField label="Institution">
              <Input value={v.qualification.institution} onChange={(e) => set("qualification", { ...v.qualification, institution: e.target.value })} />
            </FormField>
            <FormField label="Passing year">
              <Input value={v.qualification.year} onChange={(e) => set("qualification", { ...v.qualification, year: e.target.value })} inputMode="numeric" />
            </FormField>
          </FieldGrid>
        </Section>

        <Section step={6} icon={Wallet} title="Salary & bank" description={isNew ? "Allowances and deductions can be adjusted later on the Salary tab." : "Salary is managed on the Salary tab."}>
          <FieldGrid>
            {isNew && (
              <FormField label="Basic salary (৳ / month)" required error={errors.basicSalary}>
                <Input type="number" min={0} step={500} value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} invalid={!!errors.basicSalary} />
              </FormField>
            )}
            <FormField label="Bank account" hint="Salary is paid by bank transfer (BEFTN).">
              <Input value={v.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} placeholder="e.g. DBBL · 1061234567" />
            </FormField>
          </FieldGrid>
        </Section>

        <Section step={7} icon={FileText} title="Documents" description="Appointment letter, certificates, NID copy…">
          <DocumentsUpload value={v.documents} onChange={(documents) => set("documents", documents)} />
        </Section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-fg">Required information</p>
            <span className="text-xs font-semibold tabular-nums text-fg-muted">
              {done}/{checklist.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${(done / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-2.5">
            {checklist.map((c) => (
              <li key={c.label} className={cn("flex items-center gap-2.5 text-sm", c.done ? "text-fg-secondary" : "text-fg-subtle")}>
                {c.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
                {c.label}
              </li>
            ))}
          </ul>
          {isNew && (
            <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-3">
              <span className="flex items-start gap-2 text-sm">
                <KeyRound className="mt-0.5 h-4 w-4 text-indigo-500" />
                <span>
                  <span className="block font-medium text-fg">Create portal login</span>
                  <span className="block text-xs text-fg-muted">Username + temporary password by SMS</span>
                </span>
              </span>
              <Switch checked={createAccount} onCheckedChange={setCreateAccount} aria-label="Create portal login" />
            </label>
          )}
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
        <Card className="p-5">
          <p className="text-xs leading-relaxed text-fg-muted">
            After saving, assign classes and subjects on the teacher&apos;s <span className="font-semibold text-fg">Classes & Routine</span> tab, and adjust allowances on the{" "}
            <span className="font-semibold text-fg">Salary</span> tab.
          </p>
        </Card>
      </aside>
    </form>
  );
}
