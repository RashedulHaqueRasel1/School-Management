"use client";

import { CURRENT_USER, SCHOOL_INFO } from "@/features/admissions/constants";
import { formatDate, formatDateTime, formatTaka } from "@/features/admissions/utils";

import { useStudent } from "../../hooks/use-student";
import { useStudents } from "../../hooks/use-students";
import { studentHref, studentSlug } from "../../utils";
import { PaperSheet, PrintNotFound, PrintSkeleton, PrintToolbar, SchoolLetterhead, usePrintTitle } from "./PrintShell";

/** Transfer Certificate, e.g. /certificates/tc/TC-2026-0310 */
export function TransferCertificateView({ tcNo }: { tcNo: string }) {
  const number = tcNo.split("-").pop();
  const { students, hydrated } = useStudents();
  const target = students.find((s) => s.id.endsWith(`-${number}`));
  const { student, transfer, profile } = useStudent(target ? studentSlug(target) : "");
  usePrintTitle(transfer && student ? `Transfer Certificate ${tcNo} - ${student.name}` : null);

  if (!hydrated) return <PrintSkeleton />;
  if (!student || !profile || !transfer || transfer.tcNo !== tcNo) {
    return <PrintNotFound title="Certificate not found" text={`No valid transfer certificate with number ${tcNo}. It may have been cancelled.`} />;
  }

  const father = profile.guardians.find((g) => g.role === "Father")?.name ?? student.guardianName;
  const mother = profile.guardians.find((g) => g.role === "Mother")?.name ?? "—";
  const he = student.gender === "Female" ? "she" : "he";
  const his = student.gender === "Female" ? "her" : "his";

  const rows: [string, string][] = [
    ["Student's name", student.name],
    ["Father's name", father],
    ["Mother's name", mother],
    ["Date of birth", formatDate(student.dateOfBirth)],
    ["Student ID", student.id],
    ["Class & section", `${transfer.lastClass} · Section ${student.section} · Roll ${student.roll}`],
    ["Version / shift", `${student.version} · ${student.shift}`],
    ["Date of admission", formatDate(student.enrolledOn)],
    ["Date of leaving", formatDate(transfer.leavingDate)],
    ["Reason for leaving", transfer.reason],
    ["Moving to", transfer.destinationSchool || "—"],
    ["Conduct & character", transfer.conduct],
    ["Dues", transfer.duesAtIssue > 0 ? `${formatTaka(transfer.duesAtIssue)} waived by the school` : "All dues cleared"],
  ];

  return (
    <>
      <PrintToolbar backHref={studentHref(student, "profile")} backLabel={`Back to ${student.name}`} title={`Transfer Certificate ${tcNo} - ${student.name}`} />
      <PaperSheet>
        <SchoolLetterhead
          badge="Transfer Certificate"
          meta={[
            ["Certificate no.", tcNo],
            ["Issued on", formatDate(transfer.issuedOn)],
          ]}
        />
        <div className="my-8 h-px bg-slate-200" />

        <p className="text-center text-sm leading-relaxed text-slate-700">
          This is to certify that <span className="font-semibold text-slate-900">{student.name}</span> was a bona fide student of {SCHOOL_INFO.name}. {he.charAt(0).toUpperCase() + he.slice(1)} has
          left the school on <span className="font-semibold">{formatDate(transfer.leavingDate)}</span>. To the best of our knowledge {his} conduct and character were{" "}
          <span className="font-semibold">{transfer.conduct.toLowerCase()}</span>. We wish {his === "her" ? "her" : "him"} every success in the future.
        </p>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <dl className="divide-y divide-slate-200 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[180px_1fr] gap-4 px-4 py-2.5">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {transfer.remarks && (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm italic text-slate-700 print:[print-color-adjust:exact]">“{transfer.remarks}”</p>
        )}

        <section className="mt-20 grid grid-cols-3 gap-8 text-center text-sm">
          {[
            [profile.classTeacher.name, "Class teacher"],
            [transfer.issuedBy || CURRENT_USER, "Office / Admin"],
            ["", "Head teacher (seal & signature)"],
          ].map(([name, role]) => (
            <div key={role}>
              <div className="h-px bg-slate-400" />
              <p className="mt-2 min-h-5 font-semibold">{name}</p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>
          ))}
        </section>

        <footer className="mt-12 border-t border-dashed border-slate-300 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Verify this certificate with the school office quoting {tcNo}. Computer-generated document.
          <br />
          Generated {formatDateTime(new Date().toISOString())} · {SCHOOL_INFO.website}
        </footer>
      </PaperSheet>
    </>
  );
}
