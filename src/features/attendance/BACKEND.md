# Attendance — backend contract

School-wide views over the attendance that lives on **students** and **teachers**
(no separate records): the registers write the same corrections as the student /
teacher profiles and the section register (`student-admin-demo`, `teacher-admin-demo`).
Sent absence SMS are kept in `store/attendance.store.ts` (localStorage `attendance-admin-demo`).

## Pages

| Page | What it does |
| --- | --- |
| `/attendance` | Daily overview — rates, day breakdown, last 7 school days, sections still to mark, absent students (guardian SMS), staff away / late |
| `/attendance/students` | Student register for one day, grouped by section — P / L / A / Lv, "mark rest present" |
| `/attendance/staff` | Staff register for one day — same controls, filter by department |
| `/attendance/reports` | Monthly report (students by section or staff), daily chart, below 85% list, CSV export |

The selected date is shared by the first three tabs (not saved).

## Endpoints

| Action | Endpoint |
| --- | --- |
| Day summary | `GET /attendance/summary?date=` → totals, per-section counts, absent students, staff away |
| Student register | `GET /attendance?date=&classId=` · `PUT /attendance/:date [{ studentId, status }]` |
| Staff register | `GET /staff-attendance?date=` · `PUT /staff-attendance/:date [{ teacherId, status }]` |
| Absence SMS | `POST /attendance/absence-alerts { date, studentIds }` — skip students already alerted that day |
| Monthly report | `GET /attendance/report?month=YYYY-MM&type=students\|staff` (CSV via `Accept: text/csv`) |

Rate = (present + late) / (present + late + absent + leave); weekends and holidays are excluded.
