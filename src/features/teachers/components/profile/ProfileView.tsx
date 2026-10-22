"use client";

import { useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Download, Eye, FileText, GraduationCap, HeartPulse, ImageIcon, LogOut, Phone, UserPen, UserRound } from "lucide-react";

import { FilePreviewDialog } from "@/components/shared/FilePreviewDialog";
import { InfoCard, InfoFields } from "@/components/shared/InfoCard";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isPreviewable } from "@/features/admissions/documents";
import type { DocumentFile } from "@/features/admissions/types/types";
import { ageFrom, formatDate, formatFileSize } from "@/features/admissions/utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { toast } from "@/store/toast.store";

import { downloadTeacherDocument, loadTeacherDocument } from "../../files";
import { useTeacher } from "../../hooks/use-teacher";
import { teacherHref, yearsOfService } from "../../utils";
import { ReleaseDialog } from "./admin/ReleaseDialogs";

export function TeacherProfileView({ slug }: { slug: string }) {
  const { teacher, salary, release } = useTeacher(slug);
  const [previewing, setPreviewing] = useState<DocumentFile | null>(null);
  const [releasing, setReleasing] = useState(false);
  if (!teacher || !salary) return null;
  const service = yearsOfService(teacher, localToday());

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href={teacherHref(teacher, "edit")} className={buttonStyles()}>
          <UserPen className="h-4 w-4" />
          Edit profile
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <InfoCard icon={UserRound} title="Personal">
          <InfoFields
            items={[
              ["Full name", teacher.name],
              ["Gender", teacher.gender],
              ["Date of birth", teacher.dateOfBirth ? `${formatDate(teacher.dateOfBirth)} · ${ageFrom(teacher.dateOfBirth)} yrs` : ""],
              ["Blood group", teacher.bloodGroup],
              ["Religion", teacher.religion],
              ["NID", teacher.nid],
            ]}
          />
        </InfoCard>
        <InfoCard icon={Phone} title="Contact">
          <InfoFields
            items={[
              ["Mobile", teacher.phone],
              ["Email", teacher.email],
              ["Present address", teacher.presentAddress],
              ["Permanent address", teacher.permanentAddress],
            ]}
          />
          <div className="mt-5 rounded-xl bg-subtle p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              <HeartPulse className="h-3.5 w-3.5" />
              Emergency contact
            </p>
            <p className="mt-1.5 text-sm font-medium text-fg">
              {teacher.emergencyContact.name || "—"}
              {teacher.emergencyContact.relation && <span className="font-normal text-fg-muted"> · {teacher.emergencyContact.relation}</span>}
            </p>
            {teacher.emergencyContact.phone && <p className="text-sm text-fg-secondary">{teacher.emergencyContact.phone}</p>}
          </div>
        </InfoCard>
        <InfoCard icon={BriefcaseBusiness} title="Employment">
          <InfoFields
            items={[
              ["Staff ID", teacher.id],
              ["Designation", teacher.designation],
              ["Department", teacher.department],
              ["Employment type", teacher.employmentType],
              ["Joined on", formatDate(teacher.joinedOn)],
              ["Service", `${service} year(s) here + ${teacher.priorExperience} before`],
              ["Shift", teacher.shift],
              ["Subjects", teacher.subjects.join(", ")],
              ["Bank account", teacher.bankAccount],
            ]}
          />
        </InfoCard>
        <InfoCard icon={GraduationCap} title="Qualification">
          <InfoFields
            items={[
              ["Highest degree", teacher.qualification.degree],
              ["Institution", teacher.qualification.institution],
              ["Passing year", teacher.qualification.year],
            ]}
          />
        </InfoCard>
      </div>

      <InfoCard icon={FileText} title="Documents" action={<span className="text-xs text-fg-subtle">{teacher.documents.length} file(s)</span>}>
        {teacher.documents.length === 0 ? (
          <p className="text-sm text-fg-subtle">No documents uploaded. Add them from Edit profile.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {teacher.documents.map((doc) => {
              const Icon = doc.type.startsWith("image/") ? ImageIcon : FileText;
              const download = () => downloadTeacherDocument(doc, teacher).catch(() => toast("Download failed", { tone: "error" }));
              return (
                <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                  <button type="button" onClick={() => (isPreviewable(doc) ? setPreviewing(doc) : void download())} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg hover:text-indigo-600">{doc.name}</span>
                      <span className="block text-xs text-fg-subtle">{formatFileSize(doc.size)}</span>
                    </span>
                  </button>
                  {isPreviewable(doc) && (
                    <button type="button" onClick={() => setPreviewing(doc)} aria-label={`Preview ${doc.name}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600">
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => void download()} aria-label={`Download ${doc.name}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600">
                    <Download className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </InfoCard>

      {!release && (
        <Card className="flex flex-col gap-4 border-rose-200/70 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <LogOut className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-fg">Resignation, termination or retirement</p>
            <p className="text-xs text-fg-muted">Moves the teacher to the Left list, disables portal access and issues an experience certificate. Can be undone.</p>
          </div>
          <Button variant="outline" className="text-rose-600 dark:text-rose-400" onClick={() => setReleasing(true)}>
            Release teacher
          </Button>
        </Card>
      )}

      {previewing && (
        <FilePreviewDialog
          fileName={previewing.name}
          description={`${formatFileSize(previewing.size)} · ${teacher.name} · ${teacher.id}`}
          load={() => loadTeacherDocument(previewing, teacher)}
          onClose={() => setPreviewing(null)}
        />
      )}
      {releasing && <ReleaseDialog teacher={teacher} salary={salary} onClose={() => setReleasing(false)} />}
    </div>
  );
}
