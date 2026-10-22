# Admissions — backend hand-off

The UI currently runs on demo data (`store/admissions.store.ts`, saved in
localStorage). Every store action maps 1:1 to an endpoint below — replace each
one with a TanStack Query mutation in `hooks/` that calls `api/`.

Types live in `types/types.ts` and are the source of truth for request/response shapes.

## Endpoints

| UI action | Endpoint | Notes |
|---|---|---|
| List page | `GET /admissions?search=&status=&class=&gender=&fee=&sort=&page=&pageSize=` | Return `{ items, total, statusCounts }` |
| Details page | `GET /admissions/by-slug/:slug` | Slug = `slugify(studentName)-<number>` e.g. `ayesha-rahman-1042`. Resolve by the trailing number. |
| New application | `POST /admissions` | Body = `AdmissionInput`. Server sets `id`, `appliedOn`, `status: "pending"` and **sends the confirmation SMS** |
| Edit | `PUT /admissions/:id` | Body = `AdmissionInput` |
| Change status | `PATCH /admissions/:id/status` | See *Guardian notifications*. Return **409** once the application has a payment (decision is final) |
| Record payment | `POST /admissions/:id/payments` | Server generates `receiptNo`; body includes `notify: { channels: ["sms","email"] }` |
| Receipt PDF | `GET /receipts/:receiptNo.pdf` | Same layout as the `/receipts/:receiptNo` page; attach it to the receipt email |
| ~~Delete / edit payment~~ | **none** | Payments are append-only. Do not expose update/delete endpoints; reject them at the DB level too |
| Delete | `DELETE /admissions/:id` | Return **409** if the application has any payment. Soft delete recommended |
| Photo / documents | `POST /uploads` (multipart) | Return a URL; store it in `photo` / `documents[].url` |
| View / download document | `GET /admissions/:id/documents/:docId` | Return a short-lived signed URL; staff-only (RBAC) |
| Public tracking (future) | `GET /public/admissions/track?id=ADM-2026-1042&phone=017…` | Returns the 5-step progress only — no private data |

## Guardian notifications

Every status change and payment can notify the guardian. The UI sends:

```jsonc
PATCH /admissions/:id/status
{
  "status": "rejected",                       // pending | in_review | approved | waitlisted | rejected
  "note": "Did not pass the admission test",  // required for rejected & waitlisted
  "notify": {
    "channels": ["sms", "email"],             // may be empty = don't notify
    "message": "Dear Faruk Chowdhury, …"      // final text, already edited by the admin
  }
}
```

The server must:

1. Save the new status and append an `ActivityEvent` (`type: "status"`, `note`, `message`).
2. Resolve the recipient with the **primary contact** (`primaryContact` → father / mother / localGuardian phone & email).
3. Push one job per channel to a queue (SMS gateway e.g. SSL Wireless / BulkSMSBD, email via SMTP / SES).
4. Store each as `GuardianNotification { channel, to, state: "queued" }` and update it to
   `sent` or `failed` from the provider's delivery report.
   The activity timeline shows these states (Queued / Delivered / Failed).

Payments (`POST /admissions/:id/payments` with `notify.channels`) follow the same flow with the
receipt message (`buildPaymentMessage` in `utils.ts`). The **email must attach the PDF money receipt**
(render the `/receipts/:receiptNo` layout server-side, e.g. with Puppeteer / Playwright or a PDF library).

## Payment records are permanent

Nobody — including super admins — can edit or delete a payment, and an application that has
payments cannot be deleted. This keeps a reliable financial audit trail. If a payment was entered
by mistake, the future fix is a separate **refund / adjustment** entry that references the original
receipt, never a deletion.

## Enrolment (admission → student)

The **first payment** recorded on an approved application enrols the applicant, in the same DB transaction:

1. Create a `Student` (see `features/students/types/types.ts`) with ID `STU-<year>-<number>`, copying
   student + primary-contact data from the application and linking `admissionId`.
2. Assign a section (the smaller section of the class) and the next roll number in that section.
3. Lock the application status — no further status changes, and the application can't be deleted.

The Students page lists existing students plus these new ones (`GET /students`). Remaining admission-fee
dues stay visible on the student until fully paid.

## Payment flow

1. Application is **approved** → approval SMS tells the guardian the fee amount.
2. Guardian pays: cash at the office, or bKash / Nagad / Rocket / bank transfer to the school account.
3. Staff records it (amount, method, TrxID / bank reference, date, received by). Partial payments are allowed;
   `due = admissionFee − sum(payments)`.
4. Server issues a receipt number and sends the receipt by SMS and/or email (PDF attached).
   The office can print the receipt (or "Save as PDF") from `/receipts/:receiptNo` and hand it to the guardian.
5. Recommended: verify mobile-banking TrxIDs with the provider API, or replace manual entry with a payment
   gateway (SSLCommerz / bKash PGW) whose callback creates the payment automatically.
6. The first payment automatically enrols the applicant as a student (see *Enrolment* above).
