"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { localToday } from "@/features/students/demoData/profile-data";
import { toast } from "@/store/toast.store";

import { defaultSalarySettings } from "../demoData/mock-data";
import { useTeachers } from "../hooks/use-teachers";
import { useTeacherAdminStore } from "../store/teacher-admin.store";
import { teacherHref } from "../utils";
import { TeacherForm } from "./form/TeacherForm";

export function NewTeacherView() {
  const router = useRouter();
  // Hydrated list so the new staff ID continues from saved demo data.
  const { teachers } = useTeachers();
  const addTeacher = useTeacherAdminStore((s) => s.addTeacher);
  const setSalarySettings = useTeacherAdminStore((s) => s.setSalarySettings);
  const updateAccount = useTeacherAdminStore((s) => s.updateAccount);

  return (
    <div className="animate-fade-up">
      <Link href="/teachers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        All teachers
      </Link>
      <PageHeader
        title="Add teacher"
        description="Create the staff record. Classes, routine, leave and salary are managed on the teacher's profile after saving."
      />
      <TeacherForm
        submitLabel="Add teacher"
        cancelHref="/teachers"
        onSubmit={(input, extras) => {
          const created = addTeacher(input, teachers.map((t) => t.id));
          if (extras.basicSalary) setSalarySettings(created.id, { ...defaultSalarySettings(created), basic: extras.basicSalary });
          const now = new Date().toISOString();
          if (extras.createAccount) {
            updateAccount(created.id, { mustChangePassword: true, passwordChangedAt: now, lastLoginAt: now }, "Portal login created", `Username + temporary password sent by SMS to ${input.phone}`);
          } else {
            updateAccount(created.id, { status: "disabled", statusReason: "Portal login not created yet", statusChangedAt: now }, "Portal login not created");
          }
          toast("Teacher added", { description: `${created.name} · ${created.id} · joins ${created.joinedOn <= localToday() ? "now" : created.joinedOn}` });
          router.push(teacherHref(created));
        }}
      />
    </div>
  );
}
