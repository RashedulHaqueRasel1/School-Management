# Subjects — backend contract

Demo: the catalog is derived from the national curriculum the student profiles
use (`demoData/catalog.ts`); admin changes are in `store/subject-admin.store.ts`
(localStorage `subject-admin-demo`). Subject teachers per section are the
teachers' assignments (shared with Classes & Sections). Log every change:
`{ subjectId, category, action, detail, at, by }`.

## Data model

```
subjects(id, name UNIQUE, code, type: Core|Religion|Optional (4th)|Pre-primary|Elective,
         periods_per_week, full_marks, pass_marks, description, archived_at)
subject_classes(subject_id, class_id)
teaching_assignments(teacher_id, section_id, subject_id, periods_per_week)   -- shared
student_subjects(student_id, subject_id, teacher_id)                         -- extra / chosen subjects
syllabus_topics(id, subject_id, class_id, order, title, status: completed|in-progress|upcoming, month)
subject_audit(...)
```

## Endpoints

| Action | Endpoint |
| --- | --- |
| List | `GET /subjects?type=&classId=&archived=` → with `studentCount`, `teachers`, `latestAverage`, `passRate` |
| One | `GET /subjects/by-slug/:slug` |
| Create | `POST /subjects { name, code, type, classIds, periodsPerWeek, fullMarks, passMarks, description, enrolNow, teacherId }` — `enrolNow` adds it to every current student of those classes |
| Edit | `PATCH /subjects/:id` (does not change recorded marks) |
| Archive | `POST /subjects/:id/archive` · `POST /subjects/:id/restore` |
| Section teacher | `PUT /sections/:sectionId/subjects/:subjectId { teacherId, periodsPerWeek }` |
| Whole class | `PUT /subjects/:id/classes/:classId/teacher { teacherId, periodsPerWeek }` — every section of the class |
| Syllabus | `GET /subjects/:id/syllabus/:classId` · `PUT …` (full list) · `DELETE …` (back to the default plan) |
| Results | `GET /subjects/:id/results?examId=` → per class: count, average, highest, lowest, pass rate, A+; per student: marks, grade |

Until a teacher is assigned, a curriculum subject uses the school's default
subject teacher (same as the student profile).
