"use client";

import { useMemo } from "react";

import { ACADEMIC_SESSION, SCHOOL_INFO } from "@/features/admissions/constants";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";
import { useExams } from "@/features/examinations/hooks/use-exams";
import { summarize as attendanceSummary } from "@/features/students/components/profile/attendance-utils";
import { PrintNotFound, PrintSkeleton, PrintToolbar, usePrintTitle } from "@/features/students/components/print/PrintShell";
import { useStudentProfiles } from "@/features/students/hooks/use-student-profiles";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";

import { buildSheet, remarksFor, subjectGrade, type SheetRow } from "../../utils";

const SCALE: [string, string, string][] = [
  ["80–100", "A+", "5.00"],
  ["70–79", "A", "4.00"],
  ["60–69", "A-", "3.50"],
  ["50–59", "B", "3.00"],
  ["40–49", "C", "2.00"],
  ["33–39", "D", "1.00"],
  ["0–32", "F", "0.00"],
];

/** Printable report cards (one per page) for a class / section or one student — published results only. */
export function ReportCardPrint({ slug, className, section, studentId }: { slug: string; className?: string; section?: string; studentId?: string }) {
  const { exams, hydrated: examsReady } = useExams();
  const { profiles, hydrated: profilesReady } = useStudentProfiles();
  const marks = useStudentAdminStore((s) => s.marks);
  const customSubjects = useStudentAdminStore((s) => s.customSubjects);
  const exam = exams.find((e) => e.slug === slug);

  const rows = useMemo(() => {
    if (!exam || exam.status !== "published") return [];
    const target = studentId ? exam.candidates.find((s) => s.id === studentId)?.className : className;
    if (!target) return [];
    const sheet = buildSheet(exam, target, profiles, marks, (id) => new Set((customSubjects[id] ?? []).map((s) => s.code)));
    return sheet.map((r) => ({ row: r, sheet })).filter(({ row }) => row.complete && (!studentId || row.student.id === studentId) && (!section || row.student.section === section));
  }, [exam, profiles, marks, customSubjects, className, section, studentId]);

  usePrintTitle(exam && rows.length ? `Report cards - ${exam.name}` : null);
  if (!examsReady || !profilesReady) return <PrintSkeleton />;
  if (!exam || rows.length === 0) return <PrintNotFound title="No report cards" text="The exam was not found, its results are not published yet, or no result is complete." />;

  return (
    <>
      <PrintToolbar backHref="/results/tabulation" backLabel="Back to results" title={`Report cards - ${exam.name}`} />
      <div className="mx-auto w-full max-w-[210mm] space-y-8 print:space-y-0">
        {rows.map(({ row, sheet }) => (
          <ReportCard key={row.student.id} row={row} sheet={sheet} examName={exam.name} endDate={exam.endDate} attendance={profiles.get(row.student.id)?.profile.attendance ?? []} />
        ))}
      </div>
    </>
  );
}

function ReportCard({ row: r, sheet, examName, endDate, attendance }: { row: SheetRow; sheet: SheetRow[]; examName: string; endDate: string; attendance: Parameters<typeof attendanceSummary>[0] }) {
  const att = attendanceSummary(attendance.filter((d) => d.date <= endDate));
  const highest = (column: string) => Math.max(...sheet.map((x) => x.marks[column] ?? 0));
  const ranked = sheet.filter((x) => x.complete).length;
  return (
    <article className="relative overflow-hidden rounded-lg bg-white text-slate-900 shadow-2xl print:min-h-[273mm] print:rounded-none print:shadow-none" style={{ breakAfter: "page" }}>
      <div className="h-2 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-500 print:[print-color-adjust:exact]" />
      <div className="p-8 sm:p-10 print:p-0 print:pt-6">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{SCHOOL_INFO.name}</h1>
            <p className="text-xs text-slate-500">
              {SCHOOL_INFO.address} · EIIN {SCHOOL_INFO.eiin}
            </p>
          </div>
          <div className="text-right">
            <p className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white print:[print-color-adjust:exact]">Report card</p>
            <p className="mt-1.5 text-sm font-semibold">{examName}</p>
            <p className="text-xs text-slate-500">Session {ACADEMIC_SESSION}</p>
          </div>
        </header>

        <div className="mt-5 flex gap-5">
          <StudentAvatar name={r.student.name} photo={r.student.photo} size="lg" className="h-20 w-20" />
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {(
              [
                ["Name", r.student.name],
                ["Student ID", r.student.id],
                ["Class", `${r.student.className} · Section ${r.student.section}`],
                ["Roll", String(r.student.roll)],
                ["Guardian", r.student.guardianName],
                ["Attendance", att.schoolDays ? `${att.rate}% (${att.present + att.late}/${att.schoolDays} days)` : "—"],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500 print:[print-color-adjust:exact]">
              <th className="px-2 py-2">Subject</th>
              <th className="px-2 py-2 text-center">Full</th>
              <th className="px-2 py-2 text-center">Pass</th>
              <th className="px-2 py-2 text-center">Obtained</th>
              <th className="px-2 py-2 text-center">Highest</th>
              <th className="px-2 py-2 text-center">Grade</th>
              <th className="px-2 py-2 text-center">GP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {r.subjects.map((s) => {
              const v = r.marks[s.column]!;
              const g = subjectGrade(v, s);
              return (
                <tr key={s.code}>
                  <td className="px-2 py-1.5 font-medium">
                    {s.name} <span className="font-mono text-[10px] text-slate-400">{s.code}</span>
                  </td>
                  <td className="px-2 py-1.5 text-center tabular-nums">{s.fullMarks}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums">{s.passMarks}</td>
                  <td className={`px-2 py-1.5 text-center font-semibold tabular-nums ${g.gp === 0 ? "text-rose-600" : ""}`}>{v}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums text-slate-500">{highest(s.column)}</td>
                  <td className="px-2 py-1.5 text-center font-semibold">{g.grade}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums">{g.gp.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-semibold">
              <td className="px-2 py-2">Total</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.outOf}</td>
              <td />
              <td className="px-2 py-2 text-center tabular-nums">{r.total}</td>
              <td />
              <td className="px-2 py-2 text-center">{r.grade}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.gpa.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              ["GPA", r.gpa.toFixed(2)],
              ["Grade", r.grade],
              ["Position", r.position ? `${r.position} of ${ranked}` : "—"],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-slate-200 px-4 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{k}</p>
              <p className="text-2xl font-bold tabular-nums">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Remarks</p>
            <p className="mt-1 text-sm">{remarksFor(r.failed.length ? 0 : r.gpa)}</p>
            {r.failed.length > 0 && <p className="mt-1 text-sm text-rose-600">Failed: {r.failed.join(", ")}</p>}
          </div>
          <table className="text-[10px]">
            <thead>
              <tr className="text-slate-500">
                <th className="px-2 text-left font-semibold">Marks</th>
                <th className="px-2 font-semibold">Grade</th>
                <th className="px-2 font-semibold">GP</th>
              </tr>
            </thead>
            <tbody>
              {SCALE.map(([m, g, gp]) => (
                <tr key={g}>
                  <td className="px-2 tabular-nums">{m}</td>
                  <td className="px-2 text-center font-semibold">{g}</td>
                  <td className="px-2 text-center tabular-nums">{gp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-8 text-center text-[11px] text-slate-500">
          {["Class Teacher", "Guardian", "Head Teacher"].map((s) => (
            <div key={s}>
              <div className="border-t border-slate-400" />
              <p className="mt-1">{s}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[10px] text-slate-400">Issued {formatDate(new Date().toISOString().slice(0, 10))} · computer-generated report card</p>
      </div>
    </article>
  );
}
