"use client";

import { useState } from "react";
import { UserPen, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BLOOD_GROUPS, RELIGIONS } from "@/features/admissions/constants";
import { normalizePhone } from "@/features/admissions/utils";
import { toast } from "@/store/toast.store";

import { useStudentAdminStore } from "../../../store/student-admin.store";
import type { GuardianInfo, Student, StudentDetailsPatch, StudentProfile } from "../../../types/types";

type PersonalFields = Required<
  Pick<
    StudentDetailsPatch,
    "name" | "studentNameBn" | "gender" | "dateOfBirth" | "bloodGroup" | "religion" | "nationality" | "birthCertificateNo" | "address" | "permanentAddress" | "medicalNotes"
  >
>;

const iconTile = "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600";
const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Personal details.
 * BACKEND: PATCH /students/:id  (name changes also change the profile URL)
 */
export function EditPersonalDialog({
  student,
  profile,
  onClose,
  onSaved,
}: {
  student: Student;
  profile: StudentProfile;
  onClose: () => void;
  /** Called with the saved name so the page can follow a URL change. */
  onSaved: (name: string) => void;
}) {
  const updateDetails = useStudentAdminStore((s) => s.updateDetails);
  const [v, setV] = useState<PersonalFields>({
    name: student.name,
    studentNameBn: profile.studentNameBn,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    bloodGroup: student.bloodGroup,
    religion: profile.religion,
    nationality: profile.nationality,
    birthCertificateNo: profile.birthCertificateNo,
    address: student.address,
    permanentAddress: profile.permanentAddress,
    medicalNotes: profile.medicalNotes,
  });
  const [error, setError] = useState("");
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((prev) => ({ ...prev, [key]: value }));

  function save() {
    if (v.name.trim().length < 3) return setError("Enter the student's full name.");
    if (!v.dateOfBirth) return setError("Date of birth is required.");
    if (v.address.trim().length < 5) return setError("Present address is required.");
    updateDetails(student.id, { ...v, name: v.name.trim() }, "Personal information updated", "personal");
    toast("Personal information saved", { description: v.name.trim() });
    onSaved(v.name.trim());
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title="Edit personal information"
      description={`${student.id} · changes are logged with your name`}
      icon={
        <span className={iconTile}>
          <UserPen className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-5">
        <FieldGrid>
          <FormField label="Full name (English)" required>
            <Input value={v.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>
          <FormField label="Full name (Bangla)">
            <Input value={v.studentNameBn} onChange={(e) => set("studentNameBn", e.target.value)} lang="bn" />
          </FormField>
          <FormField label="Gender" required>
            <Select value={v.gender} onChange={(e) => set("gender", e.target.value as Student["gender"])} className="h-11">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </FormField>
          <FormField label="Date of birth" required>
            <Input type="date" value={v.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
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
          <FormField label="Nationality">
            <Input value={v.nationality} onChange={(e) => set("nationality", e.target.value)} />
          </FormField>
          <FormField label="Birth certificate no.">
            <Input value={v.birthCertificateNo} onChange={(e) => set("birthCertificateNo", e.target.value)} className="font-mono" />
          </FormField>
        </FieldGrid>
        <FormField label="Present address" required>
          <Textarea value={v.address} onChange={(e) => set("address", e.target.value)} className="min-h-16" />
        </FormField>
        <FormField label="Permanent address">
          <Textarea value={v.permanentAddress} onChange={(e) => set("permanentAddress", e.target.value)} className="min-h-16" />
        </FormField>
        <FormField label="Medical notes">
          <Textarea value={v.medicalNotes} onChange={(e) => set("medicalNotes", e.target.value)} className="min-h-16" placeholder="Allergies, conditions, special needs" />
        </FormField>
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}

/**
 * Add / edit a parent or guardian and choose who receives updates.
 * BACKEND: PUT /students/:id/guardians
 */
export function EditGuardianDialog({
  student,
  guardians,
  index,
  onClose,
}: {
  student: Student;
  guardians: GuardianInfo[];
  /** Guardian being edited; null = add a local guardian. */
  index: number | null;
  onClose: () => void;
}) {
  const setGuardians = useStudentAdminStore((s) => s.setGuardians);
  const existing = index === null ? undefined : guardians[index];
  const [g, setG] = useState<GuardianInfo>(
    existing ?? { role: "Local guardian", relation: "", name: "", occupation: "", phone: "", email: "", nid: "", isPrimary: false },
  );
  const [error, setError] = useState("");
  const set = <K extends keyof GuardianInfo>(key: K, value: GuardianInfo[K]) => setG((prev) => ({ ...prev, [key]: value }));

  function save() {
    if (g.name.trim().length < 3) return setError("Enter the name.");
    if (!g.relation.trim()) return setError("Relation is required.");
    if (g.phone && !PHONE_RE.test(normalizePhone(g.phone))) return setError("Enter a valid 11-digit BD mobile number.");
    if (g.isPrimary && !g.phone) return setError("The primary contact needs a mobile number for SMS updates.");
    if (g.email && !EMAIL_RE.test(g.email)) return setError("Enter a valid email address.");

    const cleaned = { ...g, name: g.name.trim(), phone: g.phone ? normalizePhone(g.phone) : "" };
    let next = index === null ? [...guardians, cleaned] : guardians.map((x, i) => (i === index ? cleaned : x));
    if (cleaned.isPrimary) next = next.map((x) => ({ ...x, isPrimary: x === cleaned }));
    if (!next.some((x) => x.isPrimary)) next = next.map((x, i) => ({ ...x, isPrimary: i === 0 }));

    setGuardians(student.id, next, `${index === null ? "Guardian added" : `${g.role} updated`}${cleaned.isPrimary ? " · set as primary contact" : ""}`);
    toast(index === null ? "Guardian added" : "Guardian updated", { description: cleaned.name });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={index === null ? "Add local guardian" : `Edit ${g.role.toLowerCase()}`}
      description={student.name}
      icon={
        <span className={iconTile}>
          <UsersRound className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">
        <FieldGrid>
          <FormField label="Full name" required>
            <Input value={g.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>
          <FormField label="Relation to student" required>
            <Input value={g.relation} onChange={(e) => set("relation", e.target.value)} placeholder="e.g. Uncle" disabled={g.role !== "Local guardian"} />
          </FormField>
          <FormField label="Mobile number" required={g.isPrimary}>
            <Input type="tel" value={g.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={g.email} onChange={(e) => set("email", e.target.value)} />
          </FormField>
          <FormField label="Occupation">
            <Input value={g.occupation} onChange={(e) => set("occupation", e.target.value)} />
          </FormField>
          <FormField label="NID number">
            <Input value={g.nid} onChange={(e) => set("nid", e.target.value)} inputMode="numeric" />
          </FormField>
        </FieldGrid>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
          <span className="text-sm">
            <span className="font-medium text-fg">Primary contact</span>
            <span className="block text-xs text-fg-muted">Receives SMS / email about attendance, results, fees and leave</span>
          </span>
          <Switch checked={g.isPrimary} onCheckedChange={(on) => set("isPrimary", on)} aria-label="Primary contact" />
        </label>
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}
