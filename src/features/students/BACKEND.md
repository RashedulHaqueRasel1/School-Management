# Students — backend hand-off

Demo data: `demoData/` (generated, deterministic per student) + admin edits in
`store/student-admin.store.ts` (localStorage). Each store action maps to one endpoint below.
Every write must also append an **audit entry** (who, what, when) — shown on the Account tab.

| UI | Endpoint | Notes |
|---|---|---|
| Students list | `GET /students?search=&class=&section=&gender=&source=&sort=&page=` | |
| Profile | `GET /students/by-slug/:slug` | Slug = `slugify(name)-<id number>`; resolve by the number |
| Attendance | `GET /students/:id/attendance?from=&to=` | Gate scanner check-in/out + status per day |
| Correct a day | `PUT /students/:id/attendance/:date` · `DELETE` to undo | `{ status, checkIn, checkOut, note }` |
| Leave list | `GET /students/:id/leave-requests` | |
| Student applies (portal) | `POST /students/:id/leave-requests` | stage = `teacher` |
| Class teacher decides | `POST /leave-requests/:id/decision` `{ role: "teacher", approved, note }` | approved → stage `admin`, rejected → `rejected` |
| Admin decides (final) | `POST /leave-requests/:id/decision` `{ role: "admin", approved, note, notifyGuardian }` | Allowed at `teacher` stage too (overrides that step). Approved days become `leave` in attendance |
| Admin files leave | `POST /students/:id/leave-requests` `{ …, autoApprove }` (multipart with optional attachment) | |
| Leave attachment | `GET /leave-requests/:id/attachment` | Signed URL; staff + the student only |
| Results | `GET /students/:id/results` | GPA rule: any F → GPA 0.00 |
| Edit marks | `PUT /students/:id/results/:examId` `{ marks: { [subjectCode]: number } }` | Recalculate GPA, grade and class position |
| Change subject | `PUT /students/:id/subjects` `{ replace, with }` | Only optional groups (religion, 4th subject) |
| Add extra subject | `POST /students/:id/subjects` `{ name, code, periodsPerWeek, teacherId \| teacher }` | `teacher` = guest teacher entered manually (create a staff record or a lightweight guest teacher). Not part of exams already held |
| Change teacher / periods | `PATCH /students/:id/subjects/:code` `{ teacherId \| teacher, periodsPerWeek }` | Curriculum subjects can't be renamed or removed |
| Remove extra subject | `DELETE /students/:id/subjects/:code` | Custom subjects only |
| Academic details | `PATCH /students/:id` `{ className, section, roll, session, version, shift, shiftStart, shiftEnd, classTeacherId \| classTeacher, enrolledOn }` | Section, version, shift and class teacher accept custom values. Roll must be unique within class + section (return 409). Shift times are minutes from midnight; "late" = after start + 10 min |
| Personal info | `PATCH /students/:id` | Name change changes the profile URL |
| Guardians | `PUT /students/:id/guardians` | Exactly one `isPrimary`; it needs a mobile number |
| Reset password | `POST /students/:id/account/reset-password` `{ mustChange, sendSmsTo }` | Server generates + hashes the password and sends the SMS. Never store or log plain passwords |
| Portal access | `PATCH /students/:id/account` `{ status: "active" \| "suspended" \| "blocked" \| "disabled", reason, suspendedUntil }` | Revoke sessions on any non-active status. Reject logins unless active. A suspension ends automatically after `suspendedUntil` (check at login + nightly job) |
| Tuition ledger | `GET /students/:id/tuition` | Months from enrolment to session end; fee by class minus discount; due by the 10th |
| Collect tuition | `POST /students/:id/tuition/payments` `{ allocations: [{ month, amount }], method, transactionId, paidOn, note, notify }` | One receipt can cover several months. Payments are permanent (no edit/delete) |
| Tuition slip | `GET /receipts/tuition/:receiptNo.pdf` | Same layout as `/receipts/tuition/:receiptNo` |
| Fee discount | `PUT /students/:id/tuition/settings` `{ discountPercent, discountReason }` | |
| Issue TC | `POST /students/:id/transfer-certificate` `{ leavingDate, reason, destinationSchool, conduct, lastClass, remarks, waiveDues }` | 409 if dues > 0 and not waived. Sets status `left`, archives the record (hidden from active lists, kept forever) |
| TC document | `GET /certificates/tc/:tcNo.pdf` | Admin + the student (portal download) |
| Cancel TC | `DELETE /students/:id/transfer-certificate` `{ reason }` | Re-admits; TC number voided |
| Audit log | `GET /students/:id/audit` | |

Permissions: all of the above are **admin-only** (RBAC in `proxy.ts` + server checks). Class teachers
may only decide leave for their own class; students may only create leave requests and read their data.

## Weekend & swaps (students and teachers)

Each person can have their own weekend plan (default: the school's weekly holiday, Friday).

```
GET /students/:id/weekend   → { days: number[], swaps: WeekendSwap[] }
PUT /students/:id/weekend   { days, swaps }        (same for /teachers/:id/weekend)
WeekendSwap = { id, workOn: "YYYY-MM-DD", offOn: "YYYY-MM-DD", reason, by, at }
```

- `days`: weekly off days, 0 = Sunday … 6 = Saturday (1–3 days).
- A swap makes `workOn` (a weekly off day) a working day and `offOn` (a working day) the day off.
  Only future swaps can be added or cancelled; past ones are part of the attendance history.
- Attendance (weekend rows), leave-day counts and — for teachers — the class routine must use the person's plan.
- Log every change in the audit trail (category `attendance`).
