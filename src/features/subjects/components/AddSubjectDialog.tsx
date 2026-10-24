"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { toStudentTeacher } from "@/features/classes/hooks/use-classes";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { Student } from "@/features/students/types/types";
import type { Teacher } from "@/features/teachers/types/types";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { subjectSlug } from "../demoData/catalog";
import { useSubjectAdminStore } from "../store/subject-admin.store";
import type { SubjectType } from "../types/types";
import { SUBJECT_TYPES } from "../utils";

/**
 * Create a subject (e.g. Spoken English, Computer Coding) and optionally add it
 * to every current student of the chosen classes.
 * BACKEND: POST /subjects { …settings, enrolNow, teacherId }
 */
export function AddSubjectDialog({ existing, students, teachers, onClose }: { existing: string[]; students: Student[]; teachers: Teacher[]; onClose: () => void }) {
  const router = useRouter();
  const addSubject = useSubjectAdminStore((s) => s.addSubject);
  const log = useSubjectAdminStore((s) => s.log);
  const saveCustomSubject = useStudentAdminStore((s) => s.saveCustomSubject);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<SubjectType>("Elective");
  const [classes, setClasses] = useState<string[]>([]);
  const [periods, setPeriods] = useState(2);
  const [fullMarks, setFullMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(33);
  const [description, setDescription] = useState("");
  const [enrol, setEnrol] = useState(true);
  const [teacherId, setTeacherId] = useState(teachers.find((t) => t.status !== "left")?.id ?? "");
  const [error, setError] = useState("");

  const autoCode = name.trim().replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase();
  const finalCode = (code.trim() || autoCode).toUpperCase();
  const affected = students.filter((s) => s.status !== "left" && classes.includes(s.className));
  const toggle = (c: string) => setClasses((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  function submit() {
    const n = name.trim();
    if (n.length < 2) return setError("Enter the subject name.");
    if (existing.some((e) => e.toLowerCase() === n.toLowerCase())) return setError(`${n} already exists.`);
    if (classes.length === 0) return setError("Pick at least one class.");
    if (passMarks <= 0 || passMarks >= fullMarks) return setError("Pass marks must be between 1 and the full marks.");
    addSubject({ name: n, code: finalCode, type, classes, periodsPerWeek: periods, fullMarks, passMarks, description: description.trim() });
    const teacher = teachers.find((t) => t.id === teacherId);
    if (enrol && teacher && affected.length) {
      for (const s of affected) {
        const grade = Number(s.className.replace(/\D/g, "")) || 0;
        saveCustomSubject(s.id, { code: `${finalCode}-${grade || "P"}90`, name: n, teacher: toStudentTeacher(teacher), periodsPerWeek: periods, custom: true }, true);
      }
      log(n, "students", "Added to students", `${affected.length} student(s) in ${classes.join(", ")} · teacher ${teacher.name}`);
    }
    toast("Subject created", { description: `${n} · ${finalCode}${enrol ? ` · ${affected.length} student(s) enrolled` : ""}` });
    onClose();
    router.push(`/subjects/${subjectSlug(n)}`);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Add subject"
      description="Extra or optional subjects beyond the national curriculum."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <BookPlus className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create subject</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid className="lg:grid-cols-3">
          <FormField label="Subject name" required className="sm:col-span-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Spoken English"
            />
          </FormField>
          <FormField label="Code" hint={`Auto: ${autoCode || "—"}`}>
            <Input value={code} onChange={(e) => setCode(e.target.value.slice(0, 4))} placeholder={autoCode} />
          </FormField>
          <FormField label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as SubjectType)} className="h-11">
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Periods / week">
            <Input type="number" min={1} max={10} value={periods} onChange={(e) => setPeriods(e.target.valueAsNumber || 1)} />
          </FormField>
          <FormField label="Full / pass marks">
            <div className="flex gap-2">
              <Input type="number" min={1} value={fullMarks} onChange={(e) => setFullMarks(e.target.valueAsNumber || 0)} aria-label="Full marks" />
              <Input type="number" min={1} value={passMarks} onChange={(e) => setPassMarks(e.target.valueAsNumber || 0)} aria-label="Pass marks" />
            </div>
          </FormField>
        </FieldGrid>
        <FormField label="Taught in" required>
          <div className="flex flex-wrap gap-1.5">
            {CLASS_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                aria-pressed={classes.includes(c)}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", classes.includes(c) ? "border-violet-400 bg-violet-50 text-violet-700" : "border-line-strong text-fg-secondary hover:bg-subtle")}
              >
                {c}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </FormField>
        <div className="rounded-2xl border border-line p-4">
          <label className="flex items-start gap-3">
            <Checkbox checked={enrol} onCheckedChange={setEnrol} aria-label="Add to students now" />
            <span className="text-sm">
              <span className="block font-medium text-fg">Add to every current student in these classes now</span>
              <span className="block text-xs text-fg-muted">{affected.length} student(s) — appears in their Subjects & teachers list</span>
            </span>
          </label>
          {enrol && (
            <FormField label="Teacher" className="mt-3">
              <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
                {teachers
                  .filter((t) => t.status !== "left")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.subjects.join(", ")}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}
        </div>
        {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}
