# Teachers module — backend contract

The frontend currently runs on demo data (`demoData/mock-data.ts`) plus admin
changes saved in localStorage (`store/teacher-admin.store.ts`, key
`teacher-admin-demo`). Replace each store action with the API call below.
Every write must also add an **audit entry** `{ teacherId, category, action, detail, at, by }`
(shown on the Account tab).

## Teachers

| Action | Endpoint | Notes |
| --- | --- | --- |
| List | `GET /teachers?search=&department=&designation=&employmentType=&status=active\|left` | Add `onLeaveToday: boolean` per row. |
| Get one | `GET /teachers/by-slug/:slug` | Slug = `name-number`, e.g. `mahmuda-akter-001`. |
| Add | `POST /teachers` (multipart: photo, documents) | Server generates `TCH-NNN`. Body = `TeacherInput` + `basicSalary` + `createAccount`. If `createAccount`, create the portal user and SMS username + temporary password. |
| Edit | `PATCH /teachers/:id` | Partial `TeacherInput`. |
| Documents | `GET /teachers/:id/documents/:docId` | Signed URL for preview / download. |

## Attendance (staff biometric)

- `GET /teachers/:id/attendance?from=&to=` → `AttendanceDay[]` (status, checkIn, checkOut, minutes, note).
- `PUT /teachers/:id/attendance/:date` `{ status, checkIn, checkOut, note }` — admin correction. `DELETE` removes it.
- Staff shift = class shift start − 20 min to end + 30 min. Late = more than 10 min after the staff start.

## Leave

- `GET /teachers/:id/leaves` → `TeacherLeave[]` + `balance: [{ type, quota, used, left }]` for the current year.
- `POST /teachers/:id/leaves` (multipart, optional attachment) — filed by admin; `approveNow` flag.
- `POST /teacher-leaves/:id/decision` `{ approved, note, substituteId }` — SMS the teacher (and the substitute).
- Approved leave days show as `leave` in attendance.
- Quota per year: casual 10, sick 14, earned 20, maternity 120 (female staff).

## Classes & routine

- `GET /teachers/:id/assignments` → `TeachingAssignment[]` (`className, section, subject, periodsPerWeek`).
- `PUT /teachers/:id/assignments` — whole list. Warn if total > 30 periods/week.
- `GET /teachers/:id/routine` → `RoutineSlot[]` (`day 0–6, period 1–6, assignment`). The demo builds this from the assignments; the real routine comes from the timetable module.
- Class teacher assignments are managed per section (student → Academic details).

## Salary

- `GET /teachers/:id/salary?year=` → `SalaryLedger` (settings, months with paid/pending/upcoming, payments).
- `PUT /teachers/:id/salary` → `SalarySettings` (basic, houseRentPercent, medical, transport, pfPercent, taxPercent).
- `POST /teachers/:id/salary/payments` `{ month, bonus, extraDeduction, method, reference, paidOn, note }` → `{ slipNo }` (`PS-<staffNo>-<yyyymm>`). Payments are **never deleted**. SMS the teacher.
- `GET /payslips/:slipNo` — printable payslip (also downloadable from the teacher portal).
- A month becomes "due" after it ends.

## Weekend & swaps

Same contract as students — `GET/PUT /teachers/:id/weekend` (see `features/students/BACKEND.md`). Routine periods are not placed on the teacher's weekly off days.

## Portal account

Same as students (`features/students/BACKEND.md`):
`POST /teachers/:id/account/reset-password`, `PUT /teachers/:id/account/status { status, reason, suspendedUntil }`.
Passwords are never returned except the one-time temporary password.

## Release (resignation / termination / retirement)

- `POST /teachers/:id/release` `{ type, lastWorkingDay, reason, noticeServed, handoverNote, conduct }` → `{ certNo }` (`EXP-<staffNo>-<yyyy>`).
  Sets status `left`, disables portal login, records unpaid salary as settlement.
- `DELETE /teachers/:id/release` `{ reason }` — undo; restore portal access.
- `GET /certificates/experience/:certNo` — printable experience certificate.
