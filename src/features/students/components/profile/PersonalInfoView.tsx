"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, FileBadge2, FileText, GraduationCap, HeartPulse, Home, PenLine, UserRound } from "lucide-react";

import { InfoCard, InfoFields } from "@/components/shared/InfoCard";
import { Button, buttonStyles } from "@/components/ui/button";
import { DocumentsCard } from "@/features/admissions/components/details/DocumentsCard";
import { ageFrom, formatDate, formatTaka } from "@/features/admissions/utils";

import { minutesToTime } from "../../demoData/profile-data";
import { useStudent } from "../../hooks/use-student";
import { studentSlug } from "../../utils";
import { EditAcademicDialog } from "./admin/AcademicDialogs";
import { EditPersonalDialog } from "./admin/InfoDialogs";
import { IssueTCDialog, RevokeTCDialog, tcHref } from "./admin/TransferDialogs";

export function PersonalInfoView({ slug }: { slug: string }) {
  const { student: s, profile, admission, tuition, transfer } = useStudent(slug);
  const router = useRouter();
  const [dialog, setDialog] = useState<"personal" | "academic" | "tc" | "revoke" | null>(null);
  if (!s || !profile || !tuition) return null;
  const dues = tuition.outstanding + s.feeDue;
  const editButton = (target: "personal" | "academic") => (
    <Button size="sm" variant="outline" onClick={() => setDialog(target)}>
      <PenLine className="h-3.5 w-3.5" />
      Edit
    </Button>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <InfoCard icon={UserRound} title="Personal information" action={editButton("personal")}>
          <InfoFields
            items={[
              ["Full name", s.name],
              ["Name (Bangla)", profile.studentNameBn && <span lang="bn">{profile.studentNameBn}</span>],
              ["Gender", s.gender],
              ["Date of birth", `${formatDate(s.dateOfBirth)} (${ageFrom(s.dateOfBirth)} years)`],
              ["Blood group", s.bloodGroup],
              ["Religion", profile.religion],
              ["Nationality", profile.nationality],
              ["Birth certificate no.", <span key="bc" className="font-mono text-xs">{profile.birthCertificateNo}</span>],
            ]}
          />
        </InfoCard>

        <InfoCard icon={GraduationCap} title="Academic details" action={editButton("academic")}>
          <InfoFields
            className="lg:grid-cols-3"
            items={[
              ["Student ID", <span key="id" className="font-mono text-xs">{s.id}</span>],
              ["Session", profile.session],
              ["Class", s.className],
              ["Section", s.section],
              ["Roll", String(s.roll)],
              ["Version", s.version],
              ["Shift", `${s.shift} · ${minutesToTime(profile.shift.start)} – ${minutesToTime(profile.shift.end)}`],
              ["Enrolled on", formatDate(s.enrolledOn)],
              ["Class teacher", profile.classTeacher.name],
            ]}
          />
        </InfoCard>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InfoCard icon={Home} title="Address" action={editButton("personal")}>
            <InfoFields
              className="sm:grid-cols-1"
              items={[
                ["Present address", s.address],
                ["Permanent address", profile.permanentAddress === s.address ? "Same as present" : profile.permanentAddress],
              ]}
            />
          </InfoCard>
          <InfoCard icon={HeartPulse} title="Health" action={editButton("personal")}>
            <InfoFields
              className="sm:grid-cols-1"
              items={[
                ["Blood group", s.bloodGroup],
                ["Medical notes", profile.medicalNotes || "Nothing reported"],
              ]}
            />
          </InfoCard>
        </div>
      </div>

      <div className="space-y-6">
        <InfoCard icon={FileBadge2} title="Transfer certificate">
          {transfer ? (
            <div className="space-y-4">
              <InfoFields
                className="sm:grid-cols-1"
                items={[
                  ["TC number", <span key="tc" className="font-mono text-xs">{transfer.tcNo}</span>],
                  ["Left on", formatDate(transfer.leavingDate)],
                  ["Reason", transfer.reason],
                  ["Moving to", transfer.destinationSchool],
                  ["Dues", transfer.duesAtIssue ? `${formatTaka(transfer.duesAtIssue)} waived` : "Cleared"],
                ]}
              />
              <div className="flex gap-2">
                <a href={tcHref(transfer.tcNo)} target="_blank" rel="noopener" className={buttonStyles({ size: "sm", className: "flex-1" })}>
                  <Download className="h-3.5 w-3.5" />
                  View / download
                </a>
                <Button size="sm" variant="outline" onClick={() => setDialog("revoke")}>
                  Cancel TC
                </Button>
              </div>
              <p className="text-xs text-fg-subtle">The student can also download this TC from the student portal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-fg-secondary">Issue a TC when the student leaves the school. Dues are checked first, then the record is archived as “Left”.</p>
              <div className={dues ? "rounded-xl bg-rose-50 px-3 py-2.5 text-xs text-rose-700" : "rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700"}>
                {dues ? `Outstanding dues: ${formatTaka(dues)} — clear or waive before issuing.` : "No outstanding dues."}
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => setDialog("tc")}>
                <FileBadge2 className="h-3.5 w-3.5" />
                Issue transfer certificate
              </Button>
            </div>
          )}
        </InfoCard>

        {admission ? (
          <>
            <DocumentsCard admission={admission} />
            <InfoCard icon={FileText} title="Admission record">
              <InfoFields
                className="sm:grid-cols-1"
                items={[
                  ["Application ID", <span key="a" className="font-mono text-xs">{admission.id}</span>],
                  ["Applied on", formatDate(admission.appliedOn)],
                  ["Previous school", admission.previousSchool],
                  ["Previous result", admission.previousResult],
                ]}
              />
              <Link href={s.admissionHref!} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Open full admission record <ArrowRight className="h-4 w-4" />
              </Link>
            </InfoCard>
          </>
        ) : (
          <InfoCard icon={FileText} title="Documents">
            <p className="text-sm text-fg-muted">
              {s.name.split(" ")[0]} joined before the online admission system, so no scanned documents are on file yet.
            </p>
          </InfoCard>
        )}
      </div>
      {dialog === "personal" && (
        <EditPersonalDialog
          student={s}
          profile={profile}
          onClose={() => setDialog(null)}
          onSaved={(name) => {
            const next = studentSlug({ id: s.id, name });
            if (next !== studentSlug(s)) router.replace(window.location.pathname.replace(studentSlug(s), next));
          }}
        />
      )}
      {dialog === "tc" && <IssueTCDialog student={s} tuition={tuition} onClose={() => setDialog(null)} />}
      {dialog === "revoke" && transfer && <RevokeTCDialog student={s} transfer={transfer} onClose={() => setDialog(null)} />}
      {dialog === "academic" && <EditAcademicDialog student={s} profile={profile} onClose={() => setDialog(null)} />}
    </div>
  );
}
