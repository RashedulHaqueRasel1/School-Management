import { formatDate } from "@/features/admissions/utils";
import { getFile } from "@/lib/indexed-db-storage";
import { buildSampleImage, buildSamplePdf, downloadBlob } from "@/lib/sample-files";

import { LEAVE_TYPES } from "./demoData/profile-data";
import type { LeaveRequest, Student } from "./types/types";

/*
 * Leave attachments (medical certificates, invitation cards…).
 * Files attached by an admin are kept in IndexedDB; the seeded demo requests
 * get a generated sample certificate.
 * TODO (backend phase): GET /leave-requests/:id/attachment → signed URL.
 */

export const leaveFileKey = (requestId: string) => `leave:${requestId}`;

export async function loadLeaveAttachment(request: LeaveRequest, student: Student): Promise<Blob> {
  const stored = await getFile(leaveFileKey(request.id)).catch(() => undefined);
  if (stored) return stored;

  const days = request.from === request.to ? formatDate(request.from) : `${formatDate(request.from)} to ${formatDate(request.to)}`;
  const lines =
    request.type === "sick"
      ? [
          `Patient: ${student.name} (${student.className}, Section ${student.section})`,
          `Student ID: ${student.id}`,
          `This is to certify that the above patient was under my treatment`,
          `for fever and upper respiratory infection and is advised rest`,
          `from ${days}.`,
          "",
          "Dr. Farhana Haque, MBBS, FCPS (Paediatrics)",
          "City Care Hospital, Dhanmondi, Dhaka · Reg. no. A-48213",
        ]
      : [
          `Student: ${student.name} (${student.id})`,
          `Leave type: ${LEAVE_TYPES[request.type]}`,
          `Dates: ${days}`,
          `Reason: ${request.reason}`,
        ];
  const title = request.type === "sick" ? "Medical Certificate" : "Supporting Document";
  return /\.(jpe?g|png|webp)$/i.test(request.attachment ?? "") ? buildSampleImage(title, lines) : buildSamplePdf(title, lines);
}

export async function downloadLeaveAttachment(request: LeaveRequest, student: Student) {
  downloadBlob(await loadLeaveAttachment(request, student), request.attachment ?? "attachment.pdf");
}
