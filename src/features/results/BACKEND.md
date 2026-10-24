# Results — backend contract

Results are built from the **exams** (`features/examinations`) and the marks on the **students**
(`student-admin-demo` → `marks[studentId][examId][subjectCode]`). Demo exams read the generated
results on the student profile (admin corrections included); exams created by admins only have
the marks entered here. Publishing uses the exam (`exam-admin-demo` → `published`).

## Pages

| Page | What it does |
| --- | --- |
| `/results` | Overview for the selected exam (all classes or one): publish banner + progress, GPA / pass / A+ / entry tiles, by-class table, merit list, subject performance, failed students, CSV |
| `/results/marks` | Mark entry — class → subject, one box per student (Enter = next), live grade, validation, save |
| `/results/tabulation` | Students × subjects with total, GPA, grade, position; section filter; CSV / print; report cards |
| `/report-cards/[examSlug]?class=&section=&student=` | Printable report cards (published results only) |

The exam / class picker is shared across the tabs (not saved).

## Rules

- Subject fails below the exam's pass marks → grade F, GP 0; any F → GPA 0.00 (grade F).
- GPA = average GP of every subject (Bangladesh scale: A+ 5 · A 4 · A- 3.5 · B 3 · C 2 · D 1 · F 0).
- Position: rank in the class by GPA, then total marks (complete results only).
- Religion papers (Islam / Hindu / …) share one column on sheets.
- Publish only when every mark is in; published results stay editable (corrections show at once).

## Endpoints

| Action | Endpoint |
| --- | --- |
| Summary | `GET /results/summary?examId=&classId=` → per class: entered / papers, avg GPA, pass rate, grade counts |
| Sheet | `GET /results/tabulation?examId=&classId=&section=` (JSON / CSV / PDF) |
| Mark entry | `GET /exams/:examId/marks?classId=&subject=` · `PUT /exams/:examId/marks { classId, subject, marks: [{ studentId, obtained }] }` |
| Publish | `POST /exams/:id/publish` (409 while marks are missing) · `DELETE /exams/:id/publish` |
| Report cards | `GET /results/report-cards?examId=&classId=&section=&studentId=` (PDF) |
