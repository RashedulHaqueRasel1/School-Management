"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  GraduationCap,
  HeartPulse,
  Home,
  Loader2,
  Lock,
  UserRound,
  Users,
} from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { ACADEMIC_SESSION, BLOOD_GROUPS, CLASS_OPTIONS, RELIGIONS, defaultFeeFor } from "../../constants";
import type { Admission, AdmissionInput, LocalGuardian, ParentInfo, PrimaryContact } from "../../types/types";
import { contactOf, normalizePhone, validateAdmission, type FormErrors } from "../../utils";
import { DocumentsUpload } from "./DocumentsUpload";
import { PhotoUpload } from "./PhotoUpload";

const EMPTY_PARENT: ParentInfo = { name: "", occupation: "", phone: "", email: "", nid: "" };

export const EMPTY_ADMISSION: AdmissionInput = {
  photo: null,
  studentName: "",
  studentNameBn: "",
  gender: "Male",
  dateOfBirth: "",
  bloodGroup: "",
  religion: "Islam",
  nationality: "Bangladeshi",
  birthCertificateNo: "",
  applyingClass: "",
  version: "Bangla",
  shift: "Morning",
  source: "office",
  previousSchool: "",
  previousClass: "",
  previousResult: "",
  father: EMPTY_PARENT,
  mother: EMPTY_PARENT,
  primaryContact: "father",
  localGuardian: { name: "", relation: "", phone: "", email: "" },
  presentAddress: "",
  permanentAddress: "",
  medicalNotes: "",
  documents: [],
  admissionFee: 0,
  internalNotes: "",
};

function toInput(a: Admission): AdmissionInput {
  const input: AdmissionInput & Partial<Pick<Admission, "id" | "appliedOn" | "status" | "payments" | "history">> = { ...a };
  delete input.id;
  delete input.appliedOn;
  delete input.status;
  delete input.payments;
  delete input.history;
  return input;
}

function Section({
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  step: number;
  icon: typeof UserRound;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 border-b border-line bg-subtle/50 px-5 py-4 sm:px-6">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-surface">
            {step}
          </span>
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

type AdmissionFormProps = {
  /** Existing application (edit mode). */
  initial?: Admission;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (input: AdmissionInput) => void;
};

export function AdmissionForm({ initial, submitLabel, cancelHref, onSubmit }: AdmissionFormProps) {
  const [values, setValues] = useState<AdmissionInput>(() => (initial ? toInput(initial) : EMPTY_ADMISSION));
  const [errors, setErrors] = useState<FormErrors>({});
  const [sameAddress, setSameAddress] = useState(() =>
    initial ? initial.permanentAddress === initial.presentAddress : true,
  );
  const [submitting, setSubmitting] = useState(false);

  function clearError(key: string) {
    if (!errors[key]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function set<K extends keyof AdmissionInput>(key: K, value: AdmissionInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    clearError(key);
  }

  function setParent(who: "father" | "mother", key: keyof ParentInfo, value: string) {
    setValues((v) => ({ ...v, [who]: { ...v[who], [key]: value } }));
    clearError(`${who}.${key}`);
  }

  function setGuardian(key: keyof LocalGuardian, value: string) {
    setValues((v) => ({ ...v, localGuardian: { ...v.localGuardian, [key]: value } }));
    clearError(`localGuardian.${key}`);
  }

  function changeClass(applyingClass: string) {
    setValues((v) => ({
      ...v,
      applyingClass,
      // New applications pick up the standard fee for the class.
      admissionFee: initial ? v.admissionFee : applyingClass ? defaultFeeFor(applyingClass) : 0,
    }));
    clearError("applyingClass");
  }

  const finalValues: AdmissionInput = {
    ...values,
    permanentAddress: sameAddress ? values.presentAddress : values.permanentAddress,
  };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateAdmission(finalValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast("Please complete the required fields", { description: `${Object.keys(nextErrors).length} field(s) need attention.`, tone: "error" });
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        first?.focus({ preventScroll: true });
      });
      return;
    }
    setSubmitting(true);
    const clean = (p: string) => (p.trim() ? normalizePhone(p) : "");
    onSubmit({
      ...finalValues,
      studentName: finalValues.studentName.trim(),
      father: { ...finalValues.father, phone: clean(finalValues.father.phone) },
      mother: { ...finalValues.mother, phone: clean(finalValues.mother.phone) },
      localGuardian: { ...finalValues.localGuardian, phone: clean(finalValues.localGuardian.phone) },
    });
  }

  const contact = contactOf(finalValues);
  const checklist = [
    { label: "Student's full name", done: finalValues.studentName.trim().length >= 3 },
    { label: "Date of birth", done: Boolean(finalValues.dateOfBirth) },
    { label: "Applying class", done: Boolean(finalValues.applyingClass) },
    { label: "Father's name", done: finalValues.father.name.trim().length >= 3 },
    { label: "Mother's name", done: finalValues.mother.name.trim().length >= 3 },
    { label: "Contact mobile number", done: /^01[3-9]\d{8}$/.test(normalizePhone(contact.phone)) },
    { label: "Present address", done: finalValues.presentAddress.trim().length >= 5 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const contactOptions: { value: PrimaryContact; title: string; person: ParentInfo | LocalGuardian }[] = [
    { value: "father", title: "Father", person: values.father },
    { value: "mother", title: "Mother", person: values.mother },
    { value: "guardian", title: "Other guardian", person: values.localGuardian },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        {/* 1. Student */}
        <Section step={1} icon={UserRound} title="Student information" description="Basic details exactly as on the birth certificate.">
          <PhotoUpload value={values.photo} onChange={(photo) => set("photo", photo)} />
          <FieldGrid>
            <FormField label="Full name (English)" required error={errors.studentName}>
              <Input value={values.studentName} onChange={(e) => set("studentName", e.target.value)} placeholder="e.g. Ayesha Rahman" invalid={!!errors.studentName} />
            </FormField>
            <FormField label="Full name (Bangla)">
              <Input value={values.studentNameBn} onChange={(e) => set("studentNameBn", e.target.value)} placeholder="যেমন: আয়েশা রহমান" lang="bn" />
            </FormField>
            <FormField label="Date of birth" required error={errors.dateOfBirth}>
              <Input type="date" value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} invalid={!!errors.dateOfBirth} />
            </FormField>
            <FormField label="Gender" required>
              <Select value={values.gender} onChange={(e) => set("gender", e.target.value as AdmissionInput["gender"])} className="h-11">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </FormField>
            <FormField label="Birth certificate no.">
              <Input value={values.birthCertificateNo} onChange={(e) => set("birthCertificateNo", e.target.value)} placeholder="17-digit registration number" inputMode="numeric" />
            </FormField>
            <FormField label="Blood group">
              <Select value={values.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} className="h-11">
                <option value="">Unknown</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Religion">
              <Select value={values.religion} onChange={(e) => set("religion", e.target.value)} className="h-11">
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Nationality">
              <Input value={values.nationality} onChange={(e) => set("nationality", e.target.value)} />
            </FormField>
          </FieldGrid>
        </Section>

        {/* 2. Admission */}
        <Section step={2} icon={GraduationCap} title="Admission details" description={`Class and preferences for the ${ACADEMIC_SESSION} session.`}>
          <FieldGrid className="lg:grid-cols-3">
            <FormField label="Applying for class" required error={errors.applyingClass}>
              <Select value={values.applyingClass} onChange={(e) => changeClass(e.target.value)} invalid={!!errors.applyingClass} className="h-11">
                <option value="">Select class</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Version / medium">
              <Select value={values.version} onChange={(e) => set("version", e.target.value as AdmissionInput["version"])} className="h-11">
                <option value="Bangla">Bangla</option>
                <option value="English">English</option>
              </Select>
            </FormField>
            <FormField label="Shift">
              <Select value={values.shift} onChange={(e) => set("shift", e.target.value as AdmissionInput["shift"])} className="h-11">
                <option value="Morning">Morning</option>
                <option value="Day">Day</option>
              </Select>
            </FormField>
          </FieldGrid>
        </Section>

        {/* 3. Previous education */}
        <Section step={3} icon={BookOpen} title="Previous education" description="Leave empty for Play / Nursery applicants.">
          <FieldGrid className="lg:grid-cols-3">
            <FormField label="Previous school" className="sm:col-span-2 lg:col-span-1">
              <Input value={values.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} placeholder="School name" />
            </FormField>
            <FormField label="Last class attended">
              <Input value={values.previousClass} onChange={(e) => set("previousClass", e.target.value)} placeholder="e.g. Class 5" />
            </FormField>
            <FormField label="Result / GPA">
              <Input value={values.previousResult} onChange={(e) => set("previousResult", e.target.value)} placeholder="e.g. GPA 5.00" />
            </FormField>
          </FieldGrid>
        </Section>

        {/* 4. Parents */}
        <Section step={4} icon={Users} title="Parents' information" description="Both parents' names are required; other details help us reach you.">
          {(["father", "mother"] as const).map((who) => (
            <div key={who}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">{who === "father" ? "Father" : "Mother"}</p>
              <FieldGrid className="lg:grid-cols-3">
                <FormField label={`${who === "father" ? "Father's" : "Mother's"} name`} required error={errors[`${who}.name`]}>
                  <Input value={values[who].name} onChange={(e) => setParent(who, "name", e.target.value)} invalid={!!errors[`${who}.name`]} />
                </FormField>
                <FormField label="Mobile number" required={values.primaryContact === who} error={errors[`${who}.phone`]}>
                  <Input type="tel" inputMode="numeric" value={values[who].phone} onChange={(e) => setParent(who, "phone", e.target.value)} placeholder="01XXXXXXXXX" invalid={!!errors[`${who}.phone`]} />
                </FormField>
                <FormField label="Email" error={errors[`${who}.email`]}>
                  <Input type="email" value={values[who].email} onChange={(e) => setParent(who, "email", e.target.value)} placeholder="name@example.com" invalid={!!errors[`${who}.email`]} />
                </FormField>
                <FormField label="Occupation">
                  <Input value={values[who].occupation} onChange={(e) => setParent(who, "occupation", e.target.value)} />
                </FormField>
                <FormField label="NID number">
                  <Input value={values[who].nid} onChange={(e) => setParent(who, "nid", e.target.value)} inputMode="numeric" />
                </FormField>
              </FieldGrid>
              {who === "father" && <div className="mt-6 h-px bg-line" />}
            </div>
          ))}
        </Section>

        {/* 5. Contact for notifications */}
        <Section step={5} icon={BellRing} title="Contact for updates" description="Application status updates are sent to this person by SMS and email.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {contactOptions.map((option) => (
              <RadioCard
                key={option.value}
                name="primaryContact"
                value={option.value}
                checked={values.primaryContact === option.value}
                onSelect={() => set("primaryContact", option.value)}
                title={option.title}
                description={
                  option.person.name ? `${option.person.name}${option.person.phone ? ` · ${option.person.phone}` : ""}` : "Not filled in yet"
                }
              />
            ))}
          </div>
          {values.primaryContact === "guardian" && (
            <FieldGrid className="animate-fade-in rounded-2xl border border-line bg-subtle/50 p-4">
              <FormField label="Guardian's name" required error={errors["localGuardian.name"]}>
                <Input value={values.localGuardian.name} onChange={(e) => setGuardian("name", e.target.value)} invalid={!!errors["localGuardian.name"]} />
              </FormField>
              <FormField label="Relation to student" required error={errors["localGuardian.relation"]}>
                <Input value={values.localGuardian.relation} onChange={(e) => setGuardian("relation", e.target.value)} placeholder="e.g. Uncle, Grandmother" invalid={!!errors["localGuardian.relation"]} />
              </FormField>
              <FormField label="Mobile number" required error={errors["localGuardian.phone"]}>
                <Input type="tel" inputMode="numeric" value={values.localGuardian.phone} onChange={(e) => setGuardian("phone", e.target.value)} placeholder="01XXXXXXXXX" invalid={!!errors["localGuardian.phone"]} />
              </FormField>
              <FormField label="Email" error={errors["localGuardian.email"]}>
                <Input type="email" value={values.localGuardian.email} onChange={(e) => setGuardian("email", e.target.value)} invalid={!!errors["localGuardian.email"]} />
              </FormField>
            </FieldGrid>
          )}
        </Section>

        {/* 6. Address */}
        <Section step={6} icon={Home} title="Address" description="Where the student currently lives.">
          <FormField label="Present address" required error={errors.presentAddress}>
            <Textarea value={values.presentAddress} onChange={(e) => set("presentAddress", e.target.value)} placeholder="House, road, area, city" className="min-h-20" invalid={!!errors.presentAddress} />
          </FormField>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg-secondary">
            <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            Permanent address is the same as present address
          </label>
          {!sameAddress && (
            <FormField label="Permanent address">
              <Textarea value={values.permanentAddress} onChange={(e) => set("permanentAddress", e.target.value)} placeholder="Village / house, upazila, district" className="min-h-20" />
            </FormField>
          )}
        </Section>

        {/* 7. Health */}
        <Section step={7} icon={HeartPulse} title="Health & special needs" description="Helps teachers take care of the student.">
          <FormField label="Medical conditions, allergies or special needs">
            <Textarea value={values.medicalNotes} onChange={(e) => set("medicalNotes", e.target.value)} placeholder="e.g. Asthma, peanut allergy, needs to sit in the front row…" />
          </FormField>
        </Section>

        {/* 8. Documents */}
        <Section step={8} icon={FileText} title="Documents" description="Upload scanned copies — originals are checked at the office.">
          <DocumentsUpload value={values.documents} onChange={(documents) => set("documents", documents)} />
        </Section>

        {/* 9. Office use */}
        <Section step={9} icon={Lock} title="Office use" description="Only visible to school staff.">
          <FieldGrid>
            <FormField label="Admission fee (৳)" required error={errors.admissionFee} hint="Auto-filled from the class fee chart; adjust for waivers.">
              <Input type="number" min={0} step={500} value={Number.isNaN(values.admissionFee) ? "" : values.admissionFee} onChange={(e) => set("admissionFee", e.target.valueAsNumber)} invalid={!!errors.admissionFee} />
            </FormField>
            <FormField label="Application source">
              <Select value={values.source} onChange={(e) => set("source", e.target.value as AdmissionInput["source"])} className="h-11">
                <option value="office">Office (walk-in)</option>
                <option value="online">Online form</option>
              </Select>
            </FormField>
            <FormField label="Internal notes" className="sm:col-span-2">
              <Textarea value={values.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} placeholder="Not shared with the guardian." />
            </FormField>
          </FieldGrid>
        </Section>
      </div>

      {/* Summary / submit */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-fg">Required information</p>
            <span className="text-xs font-semibold tabular-nums text-fg-muted">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2.5">
            {checklist.map((item) => (
              <li key={item.label} className={cn("flex items-center gap-2.5 text-sm", item.done ? "text-fg-secondary" : "text-fg-subtle")}>
                {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
                {item.label}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-subtle px-3 py-2.5 text-xs leading-relaxed text-fg-muted">
            Everything else is optional and can be added later.
          </p>

          <div className="mt-5 grid gap-2.5">
            <button type="submit" disabled={submitting} className={buttonStyles({ size: "lg", className: "w-full" })}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
            <Link href={cancelHref} className={buttonStyles({ variant: "outline", size: "lg", className: "w-full" })}>
              Cancel
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <BellRing className="h-4 w-4 text-indigo-500" />
            Updates will be sent to
          </p>
          {contact.name || contact.phone ? (
            <div className="mt-3 text-sm">
              <p className="font-medium text-fg">
                {contact.name || "—"} <span className="text-fg-muted">({contact.relation})</span>
              </p>
              <p className="mt-0.5 text-fg-muted">SMS: {contact.phone || "not provided"}</p>
              <p className="text-fg-muted">Email: {contact.email || "not provided"}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-fg-muted">Choose a contact in step 5.</p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
            The guardian gets a confirmation with the application ID now, and a message every time the status changes.
          </p>
        </Card>
      </aside>
    </form>
  );
}
