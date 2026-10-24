# Notices — backend contract

Demo board in `demoData/mock-data.ts` (dated relative to today); admin changes in
`store/notice-admin.store.ts` (localStorage `notice-admin-demo`). Reach is counted from the
current students (by class), their guardians (unique phone) and active teachers. "Seen" is
simulated in the demo — the backend records real portal opens.

## Pages

| Page | What it does |
| --- | --- |
| `/notices` | Board: tiles (on the board, published this month, seen %, scheduled & drafts), status / category / audience filters, search, pinned first, scheduled list, by category |
| `/notices/new` · `/notices/[slug]/edit` | Composer: title, category, priority, message, attachment, audience (students / parents / teachers + classes), publish now / schedule, expiry, pin, SMS, email — live preview and reach |
| `/notices/[slug]` | The notice, details, delivery (seen by group, SMS, email), publish now, pin, duplicate, archive / restore, delete, print |
| `/notice-print/[slug]` | Printable official notice for the physical board |

The dashboard "Notice Board" card shows the latest published notices.

Status: `draft` (no publish time) → `scheduled` (publish time in the future) → `published` →
`expired` (after "remove on" date) · `archived` (hidden, kept for records).

## Data model

```
notices(id, slug, title, body, category, priority, publish_at NULL, expires_on NULL, pinned, archived_at,
        send_sms, send_email, attachment_url, created_by, created_at, updated_at)
notice_audience(notice_id, group ENUM(students, parents, teachers))
notice_classes(notice_id, class_id)                -- none = every class
notice_reads(notice_id, user_id, read_at)          -- portal opens
notice_deliveries(notice_id, channel, recipient, status, sent_at)
```

## Endpoints

| Action | Endpoint |
| --- | --- |
| List | `GET /notices?status=&category=&group=&q=` → with reach and seen counts |
| One | `GET /notices/by-slug/:slug` · `GET /notices/:id/stats` |
| Create | `POST /notices { title, body, category, priority, groups, classes, publishAt, expiresOn, pinned, sms, email, attachment }` |
| Edit | `PATCH /notices/:id` — publish time is fixed once live; SMS / email are not re-sent |
| Publish now | `POST /notices/:id/publish` |
| Archive | `POST /notices/:id/archive` · `POST /notices/:id/restore` · `DELETE /notices/:id` |
| Portal | `GET /portal/notices` (for the signed-in student / parent / teacher) · `POST /portal/notices/:id/read` |

A scheduler publishes due notices and queues their SMS / email when they go live.
