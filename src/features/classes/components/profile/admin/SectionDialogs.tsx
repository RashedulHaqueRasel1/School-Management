"use client";

import { useState } from "react";
import { ArrowRightLeft, BookOpen, CalendarClock, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Student } from "@/features/students/types/types";
import { DAY_NAMES, periodTime } from "@/features/teachers/demoData/mock-data";
import type { Teacher } from "@/features/teachers/types/types";
import { toast } from "@/store/toast.store";

import { sectionLabel } from "../../../demoData/mock-data";
import { useSectionActions } from "../../../hooks/use-section-actions";
import type { GridCell } from "../../../hooks/use-section";
import { sameSubject } from "../../../hooks/use-section";
import { useClassAdminStore } from "../../../store/class-admin.store";
import type { ClassSection } from "../../../types/types";

const active = (teachers: Teacher[]) => teachers.filter((t) => t.status !== "left");

/** Teachers who teach `subject` first, then everyone else. */
function TeacherOptions({ teachers, subject }: { teachers: Teacher[]; subject?: string }) {
  const list = active(teachers);
  const qualified = subject ? list.filter((t) => t.subjects.some((s) => sameSubject(s, subject))) : [];
  const rest = list.filter((t) => !qualified.includes(t));
  return (
    <>
      {qualified.length > 0 && (
        <optgroup label={`Teaches ${subject}`}>
          {qualified.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.designation}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label={qualified.length ? "Other teachers" : "Teachers"}>
        {rest.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} · {t.subjects.join(", ")}
          </option>
        ))}
      </optgroup>
    </>
  );
}

/** BACKEND: PATCH /sections/:id { classTeacherId } */
export function ClassTeacherDialog({ section, teachers, sections, onClose }: { section: ClassSection; teachers: Teacher[]; sections: ClassSection[]; onClose: () => void }) {
  const actions = useSectionActions();
  const [teacherId, setTeacherId] = useState(section.classTeacher.id);
  const teacher = teachers.find((t) => t.id === teacherId);
  const alsoOf = sections.filter((s) => s.key !== section.key && !s.archived && s.classTeacher.id === teacherId);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Change class teacher"
      description={sectionLabel(section.className, section.section)}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <UserRound className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!teacher || teacherId === section.classTeacher.id}
            onClick={() => {
              if (!teacher) return;
              actions.setClassTeacher(section, teacher);
              toast("Class teacher changed", { description: `${sectionLabel(section.className, section.section)} → ${teacher.name}` });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Class teacher" hint="Mentors the section, recommends leave and is the guardians' first contact.">
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
            <TeacherOptions teachers={teachers} />
          </Select>
        </FormField>
        {alsoOf.length > 0 && (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
            {teacher?.name} is already class teacher of {alsoOf.map((s) => `${s.className} ${s.section}`).join(", ")}.
          </p>
        )}
        <p className="text-xs text-fg-muted">All {section.students.length} student profiles and the teacher&apos;s profile update.</p>
      </div>
    </Dialog>
  );
}

/** BACKEND: POST /sections/:id/students/move { studentIds, toSectionId } */
export function MoveStudentsDialog({ section, students, sections, onClose, onDone }: { section: ClassSection; students: Student[]; sections: ClassSection[]; onClose: () => void; onDone: () => void }) {
  const actions = useSectionActions();
  const targets = sections.filter((s) => s.key !== section.key && !s.archived);
  const [targetKey, setTargetKey] = useState(targets.find((s) => s.className === section.className)?.key ?? targets[0]?.key ?? "");
  const target = targets.find((s) => s.key === targetKey);
  const after = target ? target.students.length + students.length : 0;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Move ${students.length} student${students.length === 1 ? "" : "s"}`}
      description={students.map((s) => s.name).join(", ")}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <ArrowRightLeft className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!target}
            onClick={() => {
              if (!target) return;
              actions.move(students, section, target);
              toast("Students moved", { description: `${students.length} → ${sectionLabel(target.className, target.section)}` });
              onDone();
              onClose();
            }}
          >
            Move
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Move to" hint="Another section of this class, or another class (promotion / demotion).">
          <Select value={targetKey} onChange={(e) => setTargetKey(e.target.value)} className="h-11">
            {targets.map((s) => (
              <option key={s.key} value={s.key}>
                {sectionLabel(s.className, s.section)} · {s.students.length}/{s.settings.capacity} · {s.settings.shift}
              </option>
            ))}
          </Select>
        </FormField>
        {target && (
          <p className={after > target.settings.capacity ? "rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700" : "text-sm text-fg-muted"}>
            {sectionLabel(target.className, target.section)} will have <span className="font-semibold">{after}</span> of {target.settings.capacity} seats filled
            {after > target.settings.capacity && " — over capacity"}. New rolls continue after the last roll there; class teacher becomes {target.classTeacher.name}.
          </p>
        )}
      </div>
    </Dialog>
  );
}

/** BACKEND: PUT /sections/:id/subjects/:subject { teacherId, periodsPerWeek } */
export function AssignSubjectDialog({
  section,
  subject,
  current,
  defaultPeriods,
  teachers,
  onClose,
  onSaved,
}: {
  section: ClassSection;
  subject: string;
  current: Teacher[];
  defaultPeriods: number;
  teachers: Teacher[];
  onClose: () => void;
  /** Called after saving (e.g. to log it on the subject too). */
  onSaved?: (teacher: Teacher, periods: number) => void;
}) {
  const actions = useSectionActions();
  const qualified = active(teachers).filter((t) => t.subjects.some((s) => sameSubject(s, subject)));
  const [teacherId, setTeacherId] = useState(current[0]?.id ?? qualified[0]?.id ?? active(teachers)[0]?.id ?? "");
  const [periods, setPeriods] = useState(defaultPeriods || 4);
  const teacher = teachers.find((t) => t.id === teacherId);

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${subject} teacher`}
      description={sectionLabel(section.className, section.section)}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <BookOpen className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!teacher || periods < 1}
            onClick={() => {
              if (!teacher) return;
              actions.assignSubject(section, subject, periods, teacher, current);
              onSaved?.(teacher, periods);
              toast("Subject teacher set", { description: `${subject} · ${section.className} ${section.section} → ${teacher.name}` });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid>
          <FormField label="Teacher" className="sm:col-span-2">
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
              <TeacherOptions teachers={teachers} subject={subject} />
            </Select>
          </FormField>
          <FormField label="Periods per week">
            <Input type="number" min={1} max={10} value={periods} onChange={(e) => setPeriods(e.target.valueAsNumber || 0)} />
          </FormField>
        </FieldGrid>
        {current.length > 0 && teacher && !current.some((c) => c.id === teacher.id) && (
          <p className="text-sm text-fg-muted">Removes the class from {current.map((c) => c.name).join(", ")}&apos;s load.</p>
        )}
        <p className="text-xs text-fg-muted">Updates the teacher&apos;s Classes & Routine tab and the students&apos; subject list.</p>
      </div>
    </Dialog>
  );
}

const FREE = "__free";

/** Edit one routine period. BACKEND: PUT /sections/:id/routine/:day/:period */
export function RoutineCellDialog({
  section,
  cell,
  subjects,
  teachers,
  busy,
  onClose,
}: {
  section: ClassSection;
  cell: GridCell;
  subjects: string[];
  teachers: Teacher[];
  busy: (teacherId: string, day: number, period: number) => string | undefined;
  onClose: () => void;
}) {
  const setRoutineCell = useClassAdminStore((s) => s.setRoutineCell);
  const [subject, setSubject] = useState(cell.cell?.subject ?? subjects[0] ?? FREE);
  const qualified = active(teachers).filter((t) => t.subjects.some((s) => sameSubject(s, subject)));
  const [teacherId, setTeacherId] = useState(cell.cell?.teacherId ?? qualified[0]?.id ?? "");
  const teacher = teachers.find((t) => t.id === teacherId);
  const clash = teacher && subject !== FREE ? busy(teacher.id, cell.day, cell.period) : undefined;
  const when = `${DAY_NAMES[cell.day]} · Period ${cell.period} (${periodTime(section.settings.shift, cell.period)})`;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit period"
      description={`${sectionLabel(section.className, section.section)} · ${when}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <CalendarClock className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          {cell.edited && (
            <Button
              variant="ghost"
              className="sm:mr-auto"
              onClick={() => {
                setRoutineCell(section.key, cell.slot, undefined, when);
                toast("Period reset to default");
                onClose();
              }}
            >
              Reset to default
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={subject !== FREE && !teacher}
            onClick={() => {
              const value = subject === FREE ? null : { subject, teacherId: teacher!.id, teacherName: teacher!.name };
              setRoutineCell(section.key, cell.slot, value, `${when}: ${value ? `${value.subject} · ${value.teacherName}` : "Free period"}`);
              toast("Routine updated", { description: when });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid>
          <FormField label="Subject">
            <Select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                const first = active(teachers).find((t) => t.subjects.some((s) => sameSubject(s, e.target.value)));
                if (first) setTeacherId(first.id);
              }}
              className="h-11"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value={FREE}>Free period</option>
            </Select>
          </FormField>
          {subject !== FREE && (
            <FormField label="Teacher">
              <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
                <TeacherOptions teachers={teachers} subject={subject} />
              </Select>
            </FormField>
          )}
        </FieldGrid>
        {clash && (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
            Clash: {teacher?.name} already teaches {clash} in this period.
          </p>
        )}
        <p className="text-xs text-fg-muted">This changes the section&apos;s routine only. Teachers&apos; weekly load comes from their class assignments.</p>
      </div>
    </Dialog>
  );
}
