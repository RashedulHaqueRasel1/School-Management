"use client";

import { useState } from "react";
import { Link2, Search, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { normalizePhone } from "@/features/admissions/utils";
import type { GuardianInfo, Student } from "@/features/students/types/types";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useGuardianActions } from "../../../hooks/use-guardian-actions";
import type { GuardianRole, Parent, ParentLink } from "../../../types/types";

export const ROLES: GuardianRole[] = ["Father", "Mother", "Local guardian"];
export const defaultRelation = (role: GuardianRole) => (role === "Local guardian" ? "Uncle" : role);

/** Searchable student picker (current students only). */
export function StudentPicker({ students, exclude, value, onChange }: { students: Student[]; exclude: Set<string>; value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = students
    .filter((s) => s.status !== "left" && !exclude.has(s.id))
    .filter((s) => !q || [s.name, s.id, s.className, s.guardianName].some((v) => v.toLowerCase().includes(q)))
    .slice(0, 30);
  return (
    <div className="rounded-2xl border border-line">
      <div className="border-b border-line p-2">
        <Input leftIcon={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student by name, ID or class…" />
      </div>
      <ul className="max-h-56 overflow-y-auto p-1.5">
        {list.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onChange(s.id)}
              className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition", value === s.id ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-soft")}
            >
              <StudentAvatar name={s.name} photo={s.photo} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{s.name}</span>
                <span className="block text-xs text-fg-muted">
                  {s.id} · {s.className} {s.section} · guardian {s.guardianName}
                </span>
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="py-6 text-center text-sm text-fg-muted">No matching students.</li>}
      </ul>
    </div>
  );
}

/**
 * Link this guardian to another child (sibling, or a new guardian role).
 * BACKEND: POST /parents/:id/children  { studentId, role, relation, isPrimary }
 */
export function LinkChildDialog({
  parent,
  students,
  guardiansByStudent,
  onClose,
}: {
  parent: Parent;
  students: Student[];
  guardiansByStudent: Map<string, GuardianInfo[]>;
  onClose: () => void;
}) {
  const actions = useGuardianActions();
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState<GuardianRole>(parent.roles[0] ?? "Father");
  const [relation, setRelation] = useState(defaultRelation(parent.roles[0] ?? "Father"));
  const [primary, setPrimary] = useState(false);
  const student = students.find((s) => s.id === studentId);
  const current = student ? (guardiansByStudent.get(student.id) ?? []) : [];
  const replaces = current.find((g) => g.role === role);

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Link a child"
      description={`${parent.name} becomes a guardian of the selected student`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Link2 className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!student}
            onClick={() => {
              if (!student) return;
              actions.link(parent, student, current, role, relation.trim() || defaultRelation(role), primary);
              toast("Child linked", { description: `${student.name} · ${parent.name} as ${role.toLowerCase()}` });
              onClose();
            }}
          >
            Link child
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <StudentPicker students={students} exclude={new Set(parent.links.map((l) => l.student.id))} value={studentId} onChange={setStudentId} />
        <FieldGrid>
          <FormField label="Role" required>
            <Select
              value={role}
              onChange={(e) => {
                const r = e.target.value as GuardianRole;
                setRole(r);
                setRelation(defaultRelation(r));
              }}
              className="h-11"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Relation">
            <Input value={relation} onChange={(e) => setRelation(e.target.value)} disabled={role !== "Local guardian"} />
          </FormField>
        </FieldGrid>
        {replaces && (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
            {student?.name} already has a {role.toLowerCase()}: <span className="font-semibold">{replaces.name}</span> ({replaces.phone}). Linking replaces them.
          </p>
        )}
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-fg">Primary contact</span>
            <span className="block text-xs text-fg-muted">Receives attendance, result and fee SMS for this child</span>
          </span>
          <Switch checked={primary} onCheckedChange={setPrimary} aria-label="Primary contact" />
        </label>
      </div>
    </Dialog>
  );
}

/** BACKEND: DELETE /parents/:id/children/:studentId  { reason } */
export function UnlinkChildDialog({ parent, link, onClose }: { parent: Parent; link: ParentLink; onClose: () => void }) {
  const actions = useGuardianActions();
  const [reason, setReason] = useState("");
  const only = link.guardians.length <= 1;
  const nextPrimary = link.isPrimary ? link.guardians.find((g) => normalizePhone(g.phone) !== parent.key) : undefined;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Unlink child"
      description={`${link.student.name} · ${parent.name} (${link.role.toLowerCase()})`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Unlink className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={only || reason.trim().length < 3}
            onClick={async () => {
              const ok = await confirmAction({
                title: "Unlink this child?",
                description: `${parent.name} stops being a guardian of ${link.student.name}.`,
                confirmLabel: "Unlink",
                tone: "danger",
                typeToConfirm: link.student.name,
              });
              if (!ok) return;
              if (actions.unlink(parent, link, reason.trim())) toast("Child unlinked", { description: `${link.student.name} · ${parent.name}` });
              onClose();
            }}
          >
            Unlink
          </Button>
        </>
      }
    >
      {only ? (
        <p className="text-sm text-fg-secondary">
          {parent.name} is {link.student.name}&apos;s only guardian. Add another guardian to the student first — every student needs at least one contact.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-fg-secondary">
            {parent.name} will stop receiving updates about {link.student.name} and lose portal access to this child.
            {nextPrimary && (
              <>
                {" "}
                <span className="font-semibold text-fg">{nextPrimary.name}</span> becomes the primary contact.
              </>
            )}
          </p>
          <FormField label="Reason" required>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Custody changed / wrong number" />
          </FormField>
        </div>
      )}
    </Dialog>
  );
}
