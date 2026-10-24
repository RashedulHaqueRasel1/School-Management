# Reports — backend contract

Read-only views over every module. `hooks/use-report-data.ts` gathers students + profiles
(attendance, results), fee accounts & payments, exams, admissions and teachers (attendance +
salary ledger) with the same rules each module uses, so numbers match their own pages.

## Pages

| Page | What it shows |
| --- | --- |
| `/reports` | Students, attendance this month (students / staff), this month's fees paid, latest exam GPA; attendance vs fee collection by month; needs attention (low attendance, 2+ months overdue, failed, applications to review, staff attendance, salary pending — each links to its page); enrollment by class (boys / girls, attendance); admissions funnel |
| `/reports/academic` | Exam-by-exam GPA & pass rate, class × exam GPA heatmap, subject averages (pick an exam), attendance band vs GPA, most improved |
| `/reports/finance` | Income (tuition + admission fees) vs salaries per month, monthly statement with totals, still to collect, overdue by class, payment methods |
| `/reports/downloads` | CSV exports: students, monthly attendance, staff attendance, fee dues, tuition collection, exam results, teachers, salary register, admissions |

"Print report" prints the current tab (sidebar and header are hidden when printing).

## Endpoints

| Report | Endpoint |
| --- | --- |
| Overview | `GET /reports/overview?session=` |
| Academic | `GET /reports/academic?session=&examId=` |
| Finance | `GET /reports/finance?session=` (by payment date: tuition, admission, salaries) |
| Exports | `GET /reports/export/:report?month=&classId=&examId=&format=csv\|xlsx` |

Heavy aggregates should be cached (e.g. nightly + on change) rather than computed per request.
