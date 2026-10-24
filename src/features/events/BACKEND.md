# Events & Holidays — backend contract

The calendar merges three sources:

| Source | Where | Editable |
| --- | --- | --- |
| School events & holidays | `demoData/mock-data.ts` + `store/event-admin.store.ts` (localStorage `event-admin-demo`) | yes |
| Government holidays | `HOLIDAYS` in `students/demoData/profile-data.ts` | no (official list) |
| Exams | `features/examinations` (`useExams`) | in Examinations |

**Holidays close the school everywhere.** Every "is this a holiday?" check goes through
`holidayName(date)` (profile-data). `HolidaySync` (mounted in the dashboard and print layouts)
feeds the school holidays into it, so attendance (students, staff, registers, reports), exam
routines (papers skip holidays), leave day counts and weekend swaps all follow the calendar.

## Pages

| Page | What it does |
| --- | --- |
| `/events` | Month calendar (Sat–Fri, Fridays and holidays shaded), category filters, day panel, coming up; double-click a day to add |
| `/events/list` | Upcoming / past / all, search, category, grouped by month |
| `/events/holidays` | The year's holidays (government + school), closed school days, next holiday, add / edit school holidays |

Add / edit in a dialog: name, category, dates (multi-day), time or all day, location, audience
(students / parents / teachers + classes), details, "also post a notice" (holidays also send SMS).
Warnings: past dates (attendance becomes holiday) and overlaps with exams / other holidays.

## Data model

```
events(id, title, category, start_date, end_date, start_time NULL, end_time NULL, location, description,
       created_by, created_at, deleted_at)
event_audience(event_id, group ENUM(students, parents, teachers))
event_classes(event_id, class_id)              -- none = every class
holidays = events WHERE category = 'Holiday'   -- plus the government list (per year)
```

## Endpoints

| Action | Endpoint |
| --- | --- |
| Calendar | `GET /calendar?from=&to=&category=&q=` → events + government holidays + exams |
| Holidays | `GET /calendar/holidays?year=` · `GET /calendar/government-holidays?year=` |
| Create | `POST /events { title, category, startDate, endDate, startTime, endTime, location, groups, classes, description, postNotice }` |
| Edit | `PATCH /events/:id` · `DELETE /events/:id` |

When a holiday is added, changed or removed the server re-evaluates attendance for those days
and regenerates (unedited) exam routines; `postNotice` creates a notice (see `features/notices`).
