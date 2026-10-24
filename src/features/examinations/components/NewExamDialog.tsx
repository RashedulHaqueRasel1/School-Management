"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { formatDate, slugify, uid } from "@/features/admissions/utils";
import { addDaysIso, localToday } from "@/features/students/demoData/profile-data";
import { toast } from "@/store/toast.store";

import { DEFAULT_INSTRUCTIONS, nextExamDay } from "../demoData/mock-data";
import { useExamAdminStore } from "../store/exam-admin.store";
import type { ExamSettings } from "../types/types";
import { examHref } from "../utils";
import { ExamFields, validateExam } from "./ExamForm";

/**
 * Create an exam — the routine is generated (one paper per class per day) and
 * can be edited from the Schedule tab.
 * BACKEND: POST /exams { name, type, startDate, classes, startTime, fullMarks, passMarks, instructions }
 */
export function NewExamDialog({ slugs, onClose }: { slugs: string[]; onClose: () => void }) {
  const router = useRouter();
  const addExam = useExamAdminStore((s) => s.addExam);
  const [value, setValue] = useState<ExamSettings>({
    name: "",
    type: "Class test",
    startDate: nextExamDay(addDaysIso(localToday(), 14)),
    classes: CLASS_OPTIONS.filter((c) => c.startsWith("Class ")),
    startTime: 10 * 60,
    fullMarks: 100,
    passMarks: 33,
    instructions: DEFAULT_INSTRUCTIONS,
  });
  const [error, setError] = useState("");

  function submit() {
    const problem = validateExam(value);
    if (problem) return setError(problem);
    let slug = slugify(value.name.trim());
    if (slugs.includes(slug)) slug = `${slug}-${uid().slice(0, 4).toLowerCase()}`;
    addExam({ ...value, name: value.name.trim(), id: `exam-${uid()}`, slug, custom: true });
    toast("Exam created", { description: `${value.name.trim()} · from ${formatDate(value.startDate)}` });
    onClose();
    router.push(examHref({ slug }, "schedule"));
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="New exam"
      description="The routine is generated automatically — review it on the Schedule tab."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <ClipboardList className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create exam</Button>
        </>
      }
    >
      <ExamFields
        value={value}
        onChange={(patch) => {
          setValue((v) => ({ ...v, ...patch }));
          setError("");
        }}
      />
      {error && <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </Dialog>
  );
}
