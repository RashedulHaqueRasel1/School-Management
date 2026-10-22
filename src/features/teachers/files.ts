import { getFile } from "@/lib/indexed-db-storage";
import { buildSampleImage, buildSamplePdf, downloadBlob } from "@/lib/sample-files";
import type { DocumentFile } from "@/features/admissions/types/types";
import { formatDate } from "@/features/admissions/utils";

import type { Teacher, TeacherLeave } from "./types/types";

/*
 * File access for the demo. Uploaded files live in IndexedDB; seeded demo
 * files have no real content, so a labelled sample is generated.
 * TODO (backend phase): GET /teachers/:id/documents/:docId → signed URL.
 */

export const teacherLeaveFileKey = (leaveId: string) => `teacher-leave-${leaveId}`;

function titleFromName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function loadTeacherDocument(doc: DocumentFile, teacher: Teacher): Promise<Blob> {
  const stored = await getFile(doc.id).catch(() => undefined);
  if (stored) return stored;
  const lines = [
    `Teacher: ${teacher.name} (${teacher.id})`,
    `${teacher.designation} · ${teacher.department}`,
    `Joined on ${formatDate(teacher.joinedOn)}`,
    "Real scanned files are stored on the server once the backend is connected.",
  ];
  const title = titleFromName(doc.name);
  return doc.type.startsWith("image/") ? buildSampleImage(title, lines) : buildSamplePdf(title, lines);
}

export async function downloadTeacherDocument(doc: DocumentFile, teacher: Teacher) {
  downloadBlob(await loadTeacherDocument(doc, teacher), doc.name);
}

export async function loadTeacherLeaveAttachment(leave: TeacherLeave, teacher: Teacher): Promise<Blob> {
  const stored = await getFile(teacherLeaveFileKey(leave.id)).catch(() => undefined);
  if (stored) return stored;
  const days = leave.from === leave.to ? formatDate(leave.from) : `${formatDate(leave.from)} to ${formatDate(leave.to)}`;
  return buildSamplePdf(titleFromName(leave.attachment ?? "Leave attachment"), [
    `Patient: ${teacher.name} (${teacher.id})`,
    "This is to certify that the above patient was under my treatment",
    `and is advised rest from ${days}.`,
    "Dr. A. K. M. Hasan, MBBS, FCPS (Medicine)",
  ]);
}

export async function downloadTeacherLeaveAttachment(leave: TeacherLeave, teacher: Teacher) {
  downloadBlob(await loadTeacherLeaveAttachment(leave, teacher), leave.attachment ?? "attachment.pdf");
}
