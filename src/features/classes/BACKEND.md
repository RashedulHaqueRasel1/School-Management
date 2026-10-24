# Classes & Sections — backend contract

Demo data: standard sections A/B for every class (`demoData/mock-data.ts`), admin
changes in `store/class-admin.store.ts` (localStorage `class-admin-demo`).
Student section / roll / class teacher live on the **students**; subject
teachers live on the **teachers' assignments** — the section pages write there so
every profile stays in sync. Log every change: `{ sectionId, category, action, detail, at, by }`.

## Data model

```
classes(id, name, level, order)
sections(id, class_id, name, room, capacity, shift, version, class_teacher_id, note, archived_at)
students.section_id, students.roll            -- unique (section_id, roll)
teaching_assignments(teacher_id, section_id, subject, periods_per_week)
routine_periods(section_id, day 0-6, period 1-6, subject, teacher_id NULL = free)
section_audit(...)
```

## Endpoints

| Action | Endpoint |
| --- | --- |
| List | `GET /sections?level=&shift=&archived=` → with `studentCount`, `classTeacher` |
| One | `GET /sections/by-slug/:slug` (slug = `class-6-a`) |
| Create | `POST /sections { className, section, room, capacity, shift, version, classTeacherId }` — creates the class if new |
| Edit | `PATCH /sections/:id { room, capacity, shift, version, note }` |
| Class teacher | `PATCH /sections/:id { classTeacherId }` — also update every student's class teacher |
| Archive | `POST /sections/:id/archive` (409 if it still has students) · `POST /sections/:id/restore` |
| Move students | `POST /sections/:id/students/move { studentIds, toSectionId }` — rolls continue after the target's last roll; class teacher = target's |
| Rolls | `PUT /sections/:id/rolls { order: "name" \| "current" }` · `PATCH /students/:id { roll }` (swap with the holder) |
| Subject teacher | `PUT /sections/:id/subjects/:subject { teacherId, periodsPerWeek }` — moves the assignment from the previous teacher |
| Routine | `GET /sections/:id/routine` · `PUT /sections/:id/routine/:day/:period { subject, teacherId }` (null = free) · `DELETE` = back to generated. Warn when the teacher is busy in another section. |
| Register | `PUT /sections/:id/attendance/:date [{ studentId, status }]` — same data as the student's attendance |

Until a teacher is assigned, a subject uses the school's default subject teacher
(the same one the student profile shows).
