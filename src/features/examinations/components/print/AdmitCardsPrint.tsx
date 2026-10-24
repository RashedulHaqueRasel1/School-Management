"use client";

import { ACADEMIC_SESSION, SCHOOL_INFO } from "@/features/admissions/constants";
import { formatDate } from "@/features/admissions/utils";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { PrintNotFound, PrintSkeleton, PrintToolbar, usePrintTitle } from "@/features/students/components/print/PrintShell";
import { WEEKDAY_NAMES, weekdayOf } from "@/features/students/demoData/profile-data";

import { useExam } from "../../hooks/use-exam";
import { examHref, timeRange } from "../../utils";

/** Printable admit cards (two per A4 page) for a class, one student, or everyone ready. */
export function AdmitCardsPrint({ slug, className, studentId }: { slug: string; className?: string; studentId?: string }) {
  const { exam, candidates, hydrated } = useExam(slug);
  const list = (candidates ?? []).filter((c) => c.eligible && (!className || c.student.className === className) && (!studentId || c.student.id === studentId));
  usePrintTitle(exam && list.length ? `Admit cards - ${exam.name}` : null);

  if (!hydrated) return <PrintSkeleton />;
  if (!exam || list.length === 0) return <PrintNotFound title="No admit cards" text="The exam was not found, or no candidate's card is ready to print." />;

  return (
    <>
      <PrintToolbar backHref={examHref(exam, "admit-cards")} backLabel="Back to admit cards" title={`Admit cards - ${exam.name}`} />
      <div className="mx-auto w-full max-w-[210mm] space-y-6 print:space-y-0">
        {list.map((c, i) => {
          const papers = exam.papers.filter((p) => p.className === c.student.className);
          return (
            <article
              key={c.student.id}
              className="overflow-hidden rounded-lg bg-white text-slate-900 shadow-2xl print:h-[136mm] print:rounded-none print:border print:border-dashed print:border-slate-300 print:shadow-none"
              style={{ breakAfter: i % 2 === 1 ? "page" : "auto" }}
            >
              <div className="h-1.5 bg-linear-to-r from-rose-500 via-orange-500 to-amber-400 print:[print-color-adjust:exact]" />
              <div className="p-6 print:p-5">
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <h1 className="text-lg font-bold tracking-tight">{SCHOOL_INFO.name}</h1>
                    <p className="text-[11px] text-slate-500">
                      {SCHOOL_INFO.address} · EIIN {SCHOOL_INFO.eiin}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="inline-block rounded-md bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white print:[print-color-adjust:exact]">Admit card</p>
                    <p className="mt-1 text-xs font-semibold">{exam.name}</p>
                    <p className="text-[11px] text-slate-500">Session {ACADEMIC_SESSION}</p>
                  </div>
                </header>

                <div className="mt-4 flex gap-4">
                  <StudentAvatar name={c.student.name} photo={c.student.photo} size="xl" />
                  <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    {(
                      [
                        ["Name", c.student.name],
                        ["Student ID", c.student.id],
                        ["Class", `${c.student.className} · Section ${c.student.section}`],
                        ["Roll", String(c.student.roll)],
                        ["Room", c.room ?? "—"],
                        ["Seat", c.seat ? String(c.seat) : "—"],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
                        <dd className="font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <table className="mt-4 w-full text-xs">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500 print:[print-color-adjust:exact]">
                      <th className="px-2 py-1.5">Date</th>
                      <th className="px-2 py-1.5">Day</th>
                      <th className="px-2 py-1.5">Subject</th>
                      <th className="px-2 py-1.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {papers.map((p) => (
                      <tr key={p.id}>
                        <td className="px-2 py-1">{formatDate(p.date)}</td>
                        <td className="px-2 py-1">{WEEKDAY_NAMES[weekdayOf(p.date)]}</td>
                        <td className="px-2 py-1 font-medium">{p.subject}</td>
                        <td className="px-2 py-1 tabular-nums">{timeRange(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex items-end justify-between gap-6">
                  <p className="max-w-md text-[10px] leading-relaxed text-slate-500">{exam.instructions}</p>
                  <div className="shrink-0 text-center">
                    <div className="w-36 border-t border-slate-400" />
                    <p className="mt-1 text-[10px] text-slate-500">Head Teacher</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
