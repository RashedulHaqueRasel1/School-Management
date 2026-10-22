"use client";

import { useState } from "react";
import { ArrowRight, BookOpenCheck, BookPlus, Clock, GraduationCap, PenLine, UserRoundPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ACADEMIC_SESSION, CLASS_OPTIONS } from "@/features/admissions/constants";
import { normalizePhone, uid } from "@/features/admissions/utils";
import { toast } from "@/store/toast.store";

import { LATE_AFTER_MINUTES, SHIFTS, TEACHERS, gradeFor, minutesToTime, subjectAlternatives } from "../../../demoData/profile-data";
import { useStudentAdminStore } from "../../../store/student-admin.store";
import { useStudents } from "../../../hooks/use-students";
import type { ExamResult, Student, StudentProfile, SubjectInfo, Teacher } from "../../../types/types";
import { gradeTone } from "../grade-utils";
import { toInputTime } from "./time";

const iconTile = "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600";

/**
 * Correct exam marks. GPA, grade and class position are recalculated.
 * BACKEND: PUT /students/:id/results/:examId  { marks: { [subjectCode]: number } }
 */
export function EditMarksDialog({ student, exam, onClose }: { student: Student; exam: ExamResult; onClose: () => void }) {
  const setMarks = useStudentAdminStore((s) => s.setMarks);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(exam.results.map((r) => [r.code, String(r.obtained)])));

  const parsed = exam.results.map((r) => ({ ...r, value: Number(values[r.code]) }));
  const invalid = parsed.some((r) => values[r.code] === "" || !Number.isFinite(r.value) || r.value < 0 || r.value > r.fullMarks);
  const gps = parsed.map((r) => gradeFor((r.value / r.fullMarks) * 100).gp);
  const gpa = invalid ? null : gps.includes(0) ? 0 : gps.reduce((a, b) => a + b, 0) / gps.length;

  function save() {
    const changed = Object.fromEntries(parsed.filter((r) => r.value !== r.obtained).map((r) => [r.code, r.value]));
    if (Object.keys(changed).length === 0) return onClose();
    setMarks(student.id, exam.id, exam.name, changed);
    toast("Marks updated", { description: `${exam.name} · ${Object.keys(changed).length} subject(s) · GPA ${gpa?.toFixed(2)}` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`Edit marks — ${exam.name}`}
      description={`${student.name} · ${student.className}`}
      icon={
        <span className={iconTile}>
          <PenLine className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <span className="text-sm text-fg-muted sm:mr-auto sm:self-center">
            New GPA: <span className="font-bold text-fg">{gpa === null ? "—" : gpa.toFixed(2)}</span>
          </span>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={invalid}>
            Save marks
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {parsed.map((r) => {
          const bad = values[r.code] === "" || !Number.isFinite(r.value) || r.value < 0 || r.value > r.fullMarks;
          const grade = bad ? null : gradeFor((r.value / r.fullMarks) * 100).grade;
          return (
            <li key={r.code} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{r.subject}</p>
                <p className="font-mono text-[11px] text-fg-subtle">
                  {r.code} · was {r.obtained}
                </p>
              </div>
              <Input
                type="number"
                min={0}
                max={r.fullMarks}
                value={values[r.code]}
                onChange={(e) => setValues((v) => ({ ...v, [r.code]: e.target.value }))}
                aria-label={`${r.subject} marks`}
                invalid={bad}
                className="h-10 w-20 text-right tabular-nums"
              />
              <span className="w-10 text-xs text-fg-subtle">/ {r.fullMarks}</span>
              <span className="w-10 text-right">{grade && <Badge tone={gradeTone(grade)}>{grade}</Badge>}</span>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

/**
 * Swap an optional subject (religion, 4th subject).
 * BACKEND: PUT /students/:id/subjects  { replace: original, with: replacement }
 */
export function ChangeSubjectDialog({
  student,
  subjects,
  swaps,
  onClose,
}: {
  student: Student;
  subjects: SubjectInfo[];
  /** Current swaps: original → replacement */
  swaps: Record<string, string>;
  onClose: () => void;
}) {
  const swapSubject = useStudentAdminStore((s) => s.swapSubject);
  const changeable = subjects.filter((s) => subjectAlternatives(s.name).length > 0);
  const [current, setCurrent] = useState(changeable[0]?.name ?? "");
  const options = subjectAlternatives(current);
  const [replacement, setReplacement] = useState(options[0] ?? "");

  function save() {
    const original = Object.entries(swaps).find(([, v]) => v === current)?.[0] ?? current;
    swapSubject(student.id, original, current, replacement);
    toast("Subject changed", { description: `${current} → ${replacement}` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title="Change subject"
      description="Only optional subjects (religion, 4th subject) can be changed. Compulsory subjects stay fixed."
      icon={
        <span className={iconTile}>
          <BookOpenCheck className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!replacement}>
            Change subject
          </Button>
        </>
      }
    >
      {changeable.length === 0 ? (
        <p className="text-sm text-fg-muted">All subjects in {student.className} are compulsory.</p>
      ) : (
        <div className="space-y-5">
          <FormField label="Subject to replace" required>
            <Select
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value);
                setReplacement(subjectAlternatives(e.target.value)[0] ?? "");
              }}
              className="h-11"
            >
              {changeable.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-center text-fg-subtle">
            <ArrowRight className="h-5 w-5 rotate-90" />
          </div>
          <FormField label="New subject" required>
            <Select value={replacement} onChange={(e) => setReplacement(e.target.value)} className="h-11">
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </FormField>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
            Marks already recorded for the old subject stay in past results. The new subject&apos;s teacher is assigned automatically.
          </p>
        </div>
      )}
    </Dialog>
  );
}

const CUSTOM = "__custom__";

/** Option list plus a "Custom…" choice backed by a free-text value. */
function ChoiceOrCustom({
  label,
  options,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  const isPreset = options.some((o) => o.value === value);
  const [customMode, setCustomMode] = useState(!isPreset);
  return (
    <FormField label={label} required={required} error={error}>
      <div className="space-y-2">
        <Select
          value={customMode ? CUSTOM : value}
          onChange={(e) => {
            if (e.target.value === CUSTOM) {
              setCustomMode(true);
              onChange("");
            } else {
              setCustomMode(false);
              onChange(e.target.value);
            }
          }}
          className="h-11"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value={CUSTOM}>Custom…</option>
        </Select>
        {customMode && <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus invalid={!!error} />}
      </div>
    </FormField>
  );
}

/**
 * Everything about where the student sits: class, section, roll, session,
 * version, shift (incl. custom name & timing), class teacher, enrolment date.
 * Presets are offered, but every field also accepts a custom value.
 * BACKEND: PATCH /students/:id  { className, section, roll, session, version, shift, shiftStart, shiftEnd, classTeacherId | classTeacher, enrolledOn }
 */
export function EditAcademicDialog({ student, profile, onClose }: { student: Student; profile: StudentProfile; onClose: () => void }) {
  const updateDetails = useStudentAdminStore((s) => s.updateDetails);
  const { students } = useStudents();

  const [className, setClassName] = useState(student.className);
  const [section, setSection] = useState(student.section);
  const [roll, setRoll] = useState(String(student.roll));
  const [session, setSession] = useState(profile.session);
  const [version, setVersion] = useState(student.version);
  const [shiftChoice, setShiftChoice] = useState(SHIFTS[student.shift] ? student.shift : CUSTOM);
  const [shiftName, setShiftName] = useState(SHIFTS[student.shift] ? "" : student.shift);
  const [shiftStart, setShiftStart] = useState(toInputTime(minutesToTime(profile.shift.start)));
  const [shiftEnd, setShiftEnd] = useState(toInputTime(minutesToTime(profile.shift.end)));
  const staffTeacher = TEACHERS.find((t) => t.id === profile.classTeacher.id);
  const [teacherId, setTeacherId] = useState(staffTeacher ? staffTeacher.id : CUSTOM);
  const [teacher, setTeacher] = useState({
    name: staffTeacher ? "" : profile.classTeacher.name,
    phone: staffTeacher ? "" : profile.classTeacher.phone,
    email: staffTeacher ? "" : profile.classTeacher.email,
  });
  const [enrolled, setEnrolled] = useState(student.enrolledOn);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectionOptions = [...new Set(["A", "B", ...students.filter((x) => x.className === className).map((x) => x.section)])]
    .sort()
    .map((s) => ({ value: s, label: `Section ${s}` }));
  const rollNumber = Number(roll);
  const rollTaken = students.find(
    (x) => x.id !== student.id && x.className === className && x.section === section.trim() && x.roll === rollNumber,
  );

  function pickShift(value: string) {
    setShiftChoice(value);
    if (SHIFTS[value]) {
      setShiftStart(toInputTime(minutesToTime(SHIFTS[value].start)));
      setShiftEnd(toInputTime(minutesToTime(SHIFTS[value].end)));
    }
  }

  function save() {
    const e: Record<string, string> = {};
    if (!section.trim()) e.section = "Enter a section.";
    if (!Number.isInteger(rollNumber) || rollNumber < 1 || rollNumber > 500) e.roll = "Roll must be between 1 and 500.";
    else if (rollTaken) e.roll = `Roll ${rollNumber} is already used by ${rollTaken.name} in ${className} · ${section}.`;
    if (!session.trim()) e.session = "Enter the session.";
    if (!version.trim()) e.version = "Enter the version / medium.";
    const finalShift = shiftChoice === CUSTOM ? shiftName.trim() : shiftChoice;
    if (!finalShift) e.shift = "Enter a shift name.";
    if (!shiftStart || !shiftEnd || shiftEnd <= shiftStart) e.shiftTime = "End time must be after start time.";
    if (teacherId === CUSTOM && teacher.name.trim().length < 3) e.teacher = "Enter the class teacher's name.";
    if (teacherId === CUSTOM && teacher.phone && !/^01[3-9]\d{8}$/.test(normalizePhone(teacher.phone))) e.teacher = "Enter a valid 11-digit BD mobile number.";
    if (!enrolled) e.enrolled = "Select the enrolment date.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const classTeacher: Teacher =
      teacherId === CUSTOM
        ? {
            id: staffTeacher ? `custom-${uid().slice(0, 8)}` : profile.classTeacher.id,
            name: teacher.name.trim(),
            subject: "Class teacher",
            designation: "Class Teacher",
            phone: teacher.phone ? normalizePhone(teacher.phone) : "",
            email: teacher.email.trim(),
          }
        : TEACHERS.find((t) => t.id === teacherId)!;

    const next = {
      className,
      section: section.trim(),
      roll: rollNumber,
      session: session.trim(),
      version: version.trim(),
      shift: finalShift,
      shiftStart: toMinutes(shiftStart),
      shiftEnd: toMinutes(shiftEnd),
      classTeacher,
      enrolledOn: enrolled,
    };
    const changes = [
      next.className !== student.className && `Class ${student.className} → ${next.className}`,
      next.section !== student.section && `Section ${student.section} → ${next.section}`,
      next.roll !== student.roll && `Roll ${student.roll} → ${next.roll}`,
      next.session !== profile.session && `Session ${profile.session} → ${next.session}`,
      next.version !== student.version && `Version ${student.version} → ${next.version}`,
      next.shift !== student.shift && `Shift ${student.shift} → ${next.shift}`,
      (next.shiftStart !== profile.shift.start || next.shiftEnd !== profile.shift.end) &&
        `Timing ${minutesToTime(next.shiftStart)} – ${minutesToTime(next.shiftEnd)}`,
      next.classTeacher.id !== profile.classTeacher.id || next.classTeacher.name !== profile.classTeacher.name
        ? `Class teacher ${profile.classTeacher.name} → ${next.classTeacher.name}`
        : false,
      next.enrolledOn !== student.enrolledOn && `Enrolled on ${next.enrolledOn}`,
    ].filter(Boolean) as string[];
    if (changes.length === 0) return onClose();
    updateDetails(student.id, next, changes.join(" · "), "academic");
    toast("Academic details updated", { description: changes.join(" · ") });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title="Edit academic details"
      description={`${student.name} · ${student.id} — pick a preset or choose “Custom…” to enter your own value.`}
      icon={
        <span className={iconTile}>
          <GraduationCap className="h-5 w-5" />
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
      <div className="space-y-7">
        {/* Placement */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Class & placement</p>
          <FieldGrid className="lg:grid-cols-4">
            <FormField label="Class" required>
              <Select value={className} onChange={(e) => setClassName(e.target.value)} className="h-11">
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <ChoiceOrCustom label="Section" required options={sectionOptions} value={section} onChange={setSection} placeholder="e.g. C or Rose" error={errors.section} />
            <FormField label="Roll" required error={errors.roll}>
              <Input type="number" min={1} value={roll} onChange={(e) => setRoll(e.target.value)} invalid={!!errors.roll} />
            </FormField>
            <ChoiceOrCustom
              label="Session"
              required
              options={[...new Set([ACADEMIC_SESSION, profile.session])].map((s) => ({ value: s, label: s }))}
              value={session}
              onChange={setSession}
              placeholder="e.g. 2027–28"
              error={errors.session}
            />
          </FieldGrid>
          {className !== student.className && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
              Changing the class also changes the subject list and which classmates are used for results and positions.
            </p>
          )}
        </section>

        {/* Version & shift */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Version & shift</p>
          <FieldGrid className="lg:grid-cols-4">
            <ChoiceOrCustom
              label="Version / medium"
              required
              options={[
                { value: "Bangla", label: "Bangla" },
                { value: "English", label: "English" },
              ]}
              value={version}
              onChange={setVersion}
              placeholder="e.g. English (Cambridge)"
              error={errors.version}
            />
            <FormField label="Shift" required error={errors.shift}>
              <div className="space-y-2">
                <Select value={shiftChoice} onChange={(e) => pickShift(e.target.value)} className="h-11">
                  {Object.values(SHIFTS).map((sh) => (
                    <option key={sh.name} value={sh.name}>
                      {sh.name} ({minutesToTime(sh.start)} – {minutesToTime(sh.end)})
                    </option>
                  ))}
                  <option value={CUSTOM}>Custom…</option>
                </Select>
                {shiftChoice === CUSTOM && (
                  <Input value={shiftName} onChange={(e) => setShiftName(e.target.value)} placeholder="e.g. Evening, Coaching" invalid={!!errors.shift} />
                )}
              </div>
            </FormField>
            <FormField label="Starts at" required error={errors.shiftTime} hint={`Late after ${LATE_AFTER_MINUTES} min`}>
              <Input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} leftIcon={<Clock />} />
            </FormField>
            <FormField label="Ends at" required>
              <Input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} leftIcon={<Clock />} />
            </FormField>
          </FieldGrid>
        </section>

        {/* Class teacher & enrolment */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Class teacher & enrolment</p>
          <FieldGrid>
            <FormField label="Class teacher (guide)" required error={teacherId === CUSTOM ? undefined : errors.teacher}>
              <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
                {TEACHERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.subject}
                  </option>
                ))}
                <option value={CUSTOM}>Other teacher (enter details)…</option>
              </Select>
            </FormField>
            <FormField label="Enrolled on" required error={errors.enrolled} hint="Attendance is counted from this date.">
              <Input type="date" value={enrolled} onChange={(e) => setEnrolled(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
            </FormField>
          </FieldGrid>
          {teacherId === CUSTOM && (
            <FieldGrid className="mt-4 animate-fade-in rounded-2xl border border-line bg-subtle/50 p-4 lg:grid-cols-3">
              <FormField label="Teacher's name" required error={errors.teacher}>
                <Input value={teacher.name} onChange={(e) => setTeacher((t) => ({ ...t, name: e.target.value }))} invalid={!!errors.teacher} />
              </FormField>
              <FormField label="Mobile">
                <Input type="tel" value={teacher.phone} onChange={(e) => setTeacher((t) => ({ ...t, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={teacher.email} onChange={(e) => setTeacher((t) => ({ ...t, email: e.target.value }))} />
              </FormField>
            </FieldGrid>
          )}
        </section>
      </div>
    </Dialog>
  );
}

const CUSTOM_TEACHER = "__custom__";
const EMPTY_TEACHER = { name: "", designation: "Guest Teacher", phone: "", email: "" };

/**
 * Add an extra subject, or change the teacher / periods of an existing one.
 * Teachers come from the staff list or can be entered manually (guest / part-time).
 * BACKEND: POST /students/:id/subjects (new) · PATCH /students/:id/subjects/:code (edit) · DELETE to remove
 */
export function SubjectDialog({
  student,
  subjects,
  subject,
  onClose,
}: {
  student: Student;
  /** All current subjects — used for unique codes. */
  subjects: SubjectInfo[];
  /** Subject being edited; omit to add a new one. */
  subject?: SubjectInfo;
  onClose: () => void;
}) {
  const saveCustomSubject = useStudentAdminStore((s) => s.saveCustomSubject);
  const editSubject = useStudentAdminStore((s) => s.editSubject);
  const isNew = !subject;
  const curriculum = Boolean(subject && !subject.custom);
  const staffTeacher = subject && TEACHERS.find((t) => t.id === subject.teacher.id);

  const [name, setName] = useState(subject?.name ?? "");
  const [code, setCode] = useState(subject?.code ?? "");
  const [periods, setPeriods] = useState(String(subject?.periodsPerWeek ?? 3));
  const [teacherId, setTeacherId] = useState(subject ? (staffTeacher ? staffTeacher.id : CUSTOM_TEACHER) : TEACHERS[0]!.id);
  const [custom, setCustom] = useState(
    subject && !staffTeacher
      ? { name: subject.teacher.name, designation: subject.teacher.designation, phone: subject.teacher.phone, email: subject.teacher.email }
      : EMPTY_TEACHER,
  );
  const [error, setError] = useState("");

  function autoCode(subjectName: string) {
    const prefix = subjectName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "SUB";
    let n = 1;
    while (subjects.some((x) => x.code === `${prefix}-X${String(n).padStart(2, "0")}`)) n += 1;
    return `${prefix}-X${String(n).padStart(2, "0")}`;
  }

  function save() {
    const trimmed = name.trim();
    const periodsNumber = Number(periods);
    if (trimmed.length < 2) return setError("Enter the subject name.");
    if (!Number.isInteger(periodsNumber) || periodsNumber < 1 || periodsNumber > 12) return setError("Periods per week must be between 1 and 12.");
    const finalCode = (code.trim() || autoCode(trimmed)).toUpperCase();
    if (isNew && subjects.some((x) => x.code === finalCode)) return setError(`Code ${finalCode} is already used.`);
    if (isNew && subjects.some((x) => x.name.toLowerCase() === trimmed.toLowerCase())) return setError(`${trimmed} is already in the list.`);

    let teacher: Teacher;
    if (teacherId === CUSTOM_TEACHER) {
      if (custom.name.trim().length < 3) return setError("Enter the teacher's name.");
      if (custom.phone && !/^01[3-9]\d{8}$/.test(normalizePhone(custom.phone))) return setError("Enter a valid 11-digit BD mobile number for the teacher.");
      if (custom.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custom.email)) return setError("Enter a valid email for the teacher.");
      teacher = {
        id: subject && !staffTeacher ? subject.teacher.id : `custom-${uid().slice(0, 8)}`,
        name: custom.name.trim(),
        subject: trimmed,
        designation: custom.designation.trim() || "Guest Teacher",
        phone: custom.phone ? normalizePhone(custom.phone) : "",
        email: custom.email.trim(),
      };
    } else {
      teacher = TEACHERS.find((t) => t.id === teacherId)!;
    }

    if (curriculum && subject) {
      editSubject(student.id, subject, {
        teacher: teacher.id !== subject.teacher.id || teacherId === CUSTOM_TEACHER ? teacher : undefined,
        periodsPerWeek: periodsNumber !== subject.periodsPerWeek ? periodsNumber : undefined,
      });
    } else {
      saveCustomSubject(student.id, { code: finalCode, name: trimmed, teacher, periodsPerWeek: periodsNumber, custom: true }, isNew);
    }
    toast(isNew ? "Subject added" : "Subject updated", { description: `${trimmed} · ${teacher.name}` });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={isNew ? "Add subject" : `Edit ${subject!.name}`}
      description={
        curriculum
          ? "Curriculum subject — you can change its teacher and periods."
          : isNew
            ? `Extra / optional subject for ${student.name}. It is not included in exams already held.`
            : "Custom subject added by admin."
      }
      icon={
        <span className={iconTile}>
          <BookPlus className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{isNew ? "Add subject" : "Save changes"}</Button>
        </>
      }
    >
      <div className="space-y-6">
        <FieldGrid className="lg:grid-cols-3">
          <FormField label="Subject name" required className="sm:col-span-2 lg:col-span-1">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spoken English" disabled={curriculum} />
          </FormField>
          <FormField label="Subject code" hint={isNew ? "Leave empty to generate" : undefined}>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={name ? autoCode(name) : "SPO-X01"} className="font-mono" disabled={!isNew} />
          </FormField>
          <FormField label="Periods / week" required>
            <Input type="number" min={1} max={12} value={periods} onChange={(e) => setPeriods(e.target.value)} />
          </FormField>
        </FieldGrid>

        <div className="rounded-2xl border border-line p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
            <UserRoundPlus className="h-4 w-4 text-indigo-500" />
            Teacher
          </p>
          <FormField label="Assign teacher" required>
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
              {TEACHERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.subject}
                </option>
              ))}
              <option value={CUSTOM_TEACHER}>Other teacher (enter details)…</option>
            </Select>
          </FormField>
          {teacherId === CUSTOM_TEACHER && (
            <FieldGrid className="mt-4 animate-fade-in">
              <FormField label="Teacher's name" required>
                <Input value={custom.name} onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))} placeholder="e.g. Sharmin Akter" />
              </FormField>
              <FormField label="Designation">
                <Input value={custom.designation} onChange={(e) => setCustom((c) => ({ ...c, designation: e.target.value }))} />
              </FormField>
              <FormField label="Mobile">
                <Input type="tel" value={custom.phone} onChange={(e) => setCustom((c) => ({ ...c, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={custom.email} onChange={(e) => setCustom((c) => ({ ...c, email: e.target.value }))} />
              </FormField>
            </FieldGrid>
          )}
        </div>
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}
