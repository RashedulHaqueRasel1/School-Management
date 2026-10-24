"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { toast } from "@/store/toast.store";

import { useGuardianActions } from "../hooks/use-guardian-actions";
import { useParents } from "../hooks/use-parents";
import { useParentAdminStore } from "../store/parent-admin.store";
import { parentHref } from "../utils";
import { ParentForm } from "./form/ParentForm";

export function NewParentView() {
  const router = useRouter();
  const { parents, students, guardiansByStudent } = useParents();
  const actions = useGuardianActions();
  const setProfile = useParentAdminStore((s) => s.setProfile);
  const updateAccount = useParentAdminStore((s) => s.updateAccount);

  return (
    <div className="animate-fade-up">
      <Link href="/parents" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        All guardians
      </Link>
      <PageHeader title="Add guardian" description="Add a parent or local guardian and link them to one or more students." />
      <ParentForm
        parents={parents}
        students={students}
        submitLabel="Save guardian"
        cancelHref="/parents"
        onSubmit={(v, children, existing) => {
          const guardian = existing
            ? { ...existing }
            : { key: v.phone, name: v.name, phone: v.phone, email: v.email, occupation: v.occupation, nid: v.nid };
          for (const c of children) {
            const student = students.find((s) => s.id === c.studentId);
            if (student) actions.link(guardian, student, guardiansByStudent.get(student.id) ?? [], c.role, c.relation, c.isPrimary);
          }
          setProfile(guardian.key, { address: v.address || undefined, preferredChannel: v.preferredChannel, language: v.language, notes: v.notes || undefined, ...(existing ? {} : { createdAt: new Date().toISOString() }) }, existing ? "Communication preferences updated" : "Guardian added");
          if (!existing) {
            const now = new Date().toISOString();
            updateAccount(guardian.key, { mustChangePassword: true, passwordChangedAt: now, lastLoginAt: now }, "Portal login created", `Temporary password sent by SMS to ${v.phone}`);
          }
          toast(existing ? "Children linked to existing guardian" : "Guardian added", { description: `${guardian.name} · ${children.length} child(ren)` });
          router.push(parentHref(guardian));
        }}
      />
    </div>
  );
}
