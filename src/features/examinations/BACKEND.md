# Examinations — backend contract

Demo exams = the session's exams in `students/demoData/profile-data.ts` (`EXAMS`, same ids
the student results use). Routine and rooms are generated (`demoData/mock-data.ts`);
admin changes live in `store/exam-admin.store.ts` (localStorage `exam-admin-demo`).
Log every change: `{ examId, category, action, detail, at, by }`.

## Pages

| Page | What it does |
| --- | --- |
| `/examinations` | All exams (status filter, class, search), stats, "Coming up" papers, routine CSV, **New exam** |
| `/examinations/[slug]` | Overview — exam days, today's / next papers, checklist (routine → seats → admit cards → results), changes |
| `…/schedule` | Routine grid (days × classes); click a paper to move it; clash check; reset; CSV / print |
| `…/seating` | Rooms + invigilators, generated seat plan (classes alternate), find a student's seat, print |
| `…/admit-cards` | Candidates with room / seat; withheld at 2+ unpaid tuition months unless released; print |
| `…/results` | GPA by class, grade spread, merit list, CSV — or publish when marks are in |
| `…/settings` | Edit (regenerates the routine), cancel / restore, delete (admin-created only) |
| `/admit-cards/[slug]?class=&student=` | Printable admit cards, two per A4 |

Status: `scheduled` → `ongoing` (between first and last paper) → `completed` (marks entry) → `published`; or `cancelled`.

## Data model

```
exams(id, slug, name, type, session, start_date, start_time, full_marks, pass_marks, instructions, cancelled_at, cancel_reason, published_at)
exam_classes(exam_id, class_id)
exam_papers(id, exam_id, class_id, subject_id, date, start, duration)      -- unique (exam_id, class_id, subject_id)
exam_rooms(id, exam_id, room, capacity, invigilator_id, sort)
exam_seats(exam_id, student_id, room_id, seat)                              -- generated, stored once published
admit_card_releases(exam_id, student_id, by, at)
exam_audit(...)
```

## Endpoints

| Action | Endpoint |
| --- | --- |
| List | `GET /exams?status=&classId=` → with papers count, dates, candidate count |
| One | `GET /exams/by-slug/:slug` |
| Create | `POST /exams { name, type, startDate, classes, startTime, fullMarks, passMarks, instructions }` — generates papers (skip Fridays & holidays) |
| Edit | `PATCH /exams/:id { … }` — date / class / time / type changes regenerate papers |
| Cancel | `POST /exams/:id/cancel { reason }` · `POST /exams/:id/restore` · `DELETE /exams/:id` (no results only) |
| Routine | `GET /exams/:id/papers` · `PUT /exams/:id/papers/:paperId { date, start, duration }` (409 on clash) · `POST /exams/:id/papers/reset` |
| Rooms | `PUT /exams/:id/rooms [{ room, capacity, invigilatorId }]` · `GET /exams/:id/seat-plan` |
| Admit cards | `GET /exams/:id/admit-cards?classId=&studentId=` (PDF) · `POST /exams/:id/admit-cards/:studentId/release` |
| Results | `GET /exams/:id/results/summary` · `POST /exams/:id/publish` · `DELETE /exams/:id/publish` |

Marks are entered per student (`PUT /students/:id/exams/:examId/marks`) — the same data the
student Academics tab and the Subjects results use.
