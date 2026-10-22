"use client";

import { SCHOOL_INFO } from "@/features/admissions/constants";
import { formatDate } from "@/features/admissions/utils";
import { PaperSheet, PrintNotFound, PrintSkeleton, PrintToolbar, SchoolLetterhead, usePrintTitle } from "@/features/students/components/print/PrintShell";

import { useTeacher } from "../../hooks/use-teacher";
import { useTeachers } from "../../hooks/use-teachers";
import { teacherHref, teacherSlug } from "../../utils";

function serviceLength(from: string, to: string) {
  let months = (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7));
  if (to.slice(8) < from.slice(8)) months -= 1;
  months = Math.max(0, months);
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} year${y > 1 ? "s" : ""}`, m && `${m} month${m > 1 ? "s" : ""}`].filter(Boolean).join(" ") || "less than a month";
}

/** Experience / release certificate, e.g. /certificates/experience/EXP-001-2026 */
export function ExperienceCertificateView({ certNo }: { certNo: string }) {
  const number = certNo.split("-")[1];
  const { teachers, hydrated } = useTeachers();
  const target = teachers.find((t) => t.id === `TCH-${number}`);
  const { teacher, release } = useTeacher(target ? teacherSlug(target) : "");
  usePrintTitle(teacher && release ? `Experience certificate ${certNo} - ${teacher.name}` : null);

  if (!hydrated) return <PrintSkeleton />;
  if (!teacher || !release || release.certNo !== certNo) return <PrintNotFound title="Certificate not found" text={`No experience certificate with number ${certNo}.`} />;

  const pronoun = teacher.gender === "Female" ? { s: "She", o: "her", p: "Her" } : { s: "He", o: "him", p: "His" };
  const conduct = release.conduct.replace(/His\/her/g, pronoun.p).replace(/his\/her/g, pronoun.o);

  return (
    <>
      <PrintToolbar backHref={teacherHref(teacher, "profile")} backLabel={`Back to ${teacher.name}`} title={`Experience certificate ${certNo} - ${teacher.name}`} />
      <PaperSheet>
        <SchoolLetterhead
          badge="Experience Certificate"
          meta={[
            ["Certificate no.", certNo],
            ["Date", formatDate(release.issuedOn)],
          ]}
        />
        <div className="my-8 h-px bg-slate-200" />

        <h2 className="text-center text-2xl font-bold tracking-tight">To Whom It May Concern</h2>

        <div className="mx-auto mt-8 max-w-[160mm] space-y-5 text-[15px] leading-8 text-slate-700">
          <p>
            This is to certify that <span className="font-semibold text-slate-900">{teacher.name}</span> (Staff ID <span className="font-mono">{teacher.id}</span>) served{" "}
            {SCHOOL_INFO.name} as <span className="font-semibold text-slate-900">{teacher.designation}</span> in the {teacher.department} department from{" "}
            <span className="font-semibold text-slate-900">{formatDate(teacher.joinedOn)}</span> to{" "}
            <span className="font-semibold text-slate-900">{formatDate(release.lastWorkingDay)}</span> — a period of {serviceLength(teacher.joinedOn, release.lastWorkingDay)}.
          </p>
          <p>
            During this time {pronoun.s.toLowerCase()} taught {teacher.subjects.join(", ")} on a {teacher.employmentType.toLowerCase()} basis. {conduct}
          </p>
          <p>
            {pronoun.s} left the school on account of {release.type.toLowerCase()}
            {release.type === "Termination" ? "" : ` (${release.reason})`}. We have no claim against {pronoun.o}
            {release.settlement > 0 ? " after the final salary settlement." : "."}
          </p>
          <p>We wish {pronoun.o} every success in the future.</p>
        </div>

        <section className="mt-20 grid grid-cols-2 gap-10 text-sm">
          <div>
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">{release.issuedBy}</p>
            <p className="text-xs text-slate-500">Prepared by</p>
          </div>
          <div className="text-right">
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">Head Teacher</p>
            <p className="text-xs text-slate-500">{SCHOOL_INFO.name}</p>
          </div>
        </section>

        <footer className="mt-12 border-t border-dashed border-slate-300 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Verify this certificate at {SCHOOL_INFO.website} with number {certNo}.
        </footer>
      </PaperSheet>
    </>
  );
}
