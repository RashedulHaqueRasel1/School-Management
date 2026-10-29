"use client";

import { useRouter } from "next/navigation";

import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useTeacher } from "../../hooks/use-teacher";
import { useTeacherAdminStore } from "../../store/teacher-admin.store";
import { teacherHref } from "../../utils";
import { TeacherForm } from "../form/TeacherForm";

export function EditTeacherView({ slug }: { slug: string }) {
  const router = useRouter();
  const { teacher } = useTeacher(slug);
  const updateTeacher = useTeacherAdminStore((s) => s.updateTeacher);
  if (!teacher) return null;

  return (
    <TeacherForm
      key={teacher.id}
      initial={teacher}
      submitLabel="Save changes"
      cancelHref={teacherHref(teacher, "profile")}
      onSubmit={async (input) => {
        const changed = (Object.keys(input) as (keyof typeof input)[]).filter((k) => JSON.stringify(input[k]) !== JSON.stringify(teacher[k]));
        if (changed.length > 0 && !(await confirmAction({ title: "Save teacher changes?", description: `Changes: ${changed.join(", ")}.`, confirmLabel: "Save changes" }))) return;
        if (changed.length === 0) {
          router.push(teacherHref(teacher, "profile"));
          return;
        }
        updateTeacher(teacher.id, input, `Profile edited · ${changed.join(", ")}`);
        toast("Teacher updated", { description: `${input.name} · ${changed.length} field(s) changed` });
        router.push(teacherHref({ id: teacher.id, name: input.name }, "profile"));
      }}
    />
  );
}
