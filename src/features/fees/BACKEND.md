# Fees & Payments — backend contract

School-wide views over the **students' tuition** (no separate records): the ledger is
`buildTuitionLedger` in `students/demoData/fee-data.ts` — the same one the student's Fees tab,
the parent profile, the section page and exam admit cards use. Payments and discounts are
saved on the students (`student-admin-demo` → `tuitionPayments`, `feeSettings`); collecting
reuses the student's `CollectTuitionDialog` and slips print at `/receipts/tuition/[receiptNo]`.
Sent reminders live in `store/fees.store.ts` (localStorage `fees-admin-demo`).

## Pages

| Page | What it does |
| --- | --- |
| `/fees` | Overview — received this month / today, this month's fees paid %, overdue, collected to date, billed vs collected by month, payment methods, by class, recent payments, largest dues |
| `/fees/dues` | Who owes: owing / overdue / due this month / paid up, unpaid month chips, collect, single + bulk SMS reminders, CSV |
| `/fees/payments` | Every payment: today / week / month / session / custom range, method, class, search; total by method; slips; CSV; printable collection report |
| `/fees/structure` | Fee table per class (admission + monthly tuition + year), due-date rule, discounts & scholarships (add / edit) |

"Collect payment" in the header opens a student search, then the collect dialog.

## Rules

- Tuition is due by the 10th of each month; unpaid after it = overdue (part-paid months too).
- Billing runs January–December; new students from their joining month.
- A discount (%) applies to every month's fee.

## Endpoints

| Action | Endpoint |
| --- | --- |
| Summary | `GET /fees/summary?session=` → by month (billed, paid), by method, by class, today / this month |
| Accounts | `GET /fees/accounts?classId=&status=owing\|overdue\|due\|clear&q=` → per student: monthly fee, discount, unpaid months, overdue, due now, last paid, last reminder |
| Collect | `POST /students/:id/tuition/payments { months, method, transactionId, paidOn, note, sms, email }` → receipt |
| Payments | `GET /fees/payments?from=&to=&method=&classId=&q=&page=` (CSV / PDF collection report) |
| Reminders | `POST /fees/reminders { studentIds, message }` — `{student}`, `{amount}`, `{months}` filled per guardian |
| Structure | `GET /fees/structure` · `PUT /fees/structure/:classId { admissionFee, monthlyFee }` |
| Discount | `PUT /students/:id/tuition/settings { discountPercent, discountReason }` |
