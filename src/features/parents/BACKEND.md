# Parents & Guardians — backend contract

A guardian is identified by **mobile number**. Siblings share one guardian record
(father/mother of several students). In the demo, guardians are built from every
student's guardian list (`students` module) plus `store/parent-admin.store.ts`
(localStorage key `parent-admin-demo`). Every write adds an audit entry
`{ parentId, category, action, detail, at, by }` (shown on the Account tab).

## Data model

```
parents(id, name, phone UNIQUE, email, occupation, nid, address, preferred_channel, language, notes)
student_guardians(student_id, parent_id, role: Father|Mother|Local guardian, relation, is_primary)
  -- one row per role per student; exactly one is_primary per student
parent_messages(id, parent_id, template, channel, subject, body, student_id?, sent_at, sent_by, bulk, status)
parent_meetings(id, parent_id, student_id, date, time, mode, with_whom, agenda, status, outcome, created_by)
```

When a student's primary guardian changes, update the student's contact columns
(guardian name / phone / email) — the student list and SMS recipients use them.

## Endpoints

| Action | Endpoint |
| --- | --- |
| List | `GET /parents?search=&role=&className=&portal=&multiChild=` |
| One | `GET /parents/by-slug/:slug` (slug = `name-last4digits`) |
| Add | `POST /parents { ...guardian, children: [{ studentId, role, relation, isPrimary }] }` — if the phone exists, link the children to that guardian. Creates the portal login (username = mobile) and SMS a temporary password. |
| Edit | `PATCH /parents/:id` — changing the phone must keep history (messages, meetings, account). Reject a phone that belongs to another guardian. |
| Link child | `POST /parents/:id/children { studentId, role, relation, isPrimary }` — replaces whoever held that role for the student. |
| Unlink child | `DELETE /parents/:id/children/:studentId { reason }` — refuse if it is the student's only guardian; if primary, promote another guardian. |
| Primary contact | `PUT /students/:studentId/primary-guardian { parentId }` |
| Messages | `GET /parents/:id/messages` · `POST /parents/messages { parentIds[], channel: sms\|email\|both, subject, body, studentId? }` — `{guardian}` / `{child}` placeholders are filled per recipient; guardians without email get SMS only. Return delivery status from the SMS gateway. |
| Meetings | `GET /parents/:id/meetings` · `POST /parents/:id/meetings { studentId, date, time, mode, withWhom, agenda, notify }` · `PATCH /parent-meetings/:id { status, outcome }` |
| Fees | Uses the students' tuition APIs (`GET /students/:id/tuition`, `POST /students/:id/tuition/payments`). Family dues = sum over current children. |
| Portal | `POST /parents/:id/account/reset-password` · `PUT /parents/:id/account/status { status, reason, suspendedUntil }` — one login sees all linked children. |
