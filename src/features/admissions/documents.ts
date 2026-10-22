import { getFile } from "@/lib/indexed-db-storage";
import { buildSamplePdf, buildSampleImage, downloadBlob } from "@/lib/sample-files";

import type { Admission, DocumentFile } from "./types/types";
import { formatDate } from "./utils";

/*
 * Document access for the demo.
 * Uploaded files live in IndexedDB (keyed by document id). The seeded demo
 * documents have no real file, so a clearly-labelled sample is generated.
 * TODO (backend phase): GET /admissions/:id/documents/:docId → signed download URL.
 */

export function isPreviewable(doc: Pick<DocumentFile, "type">) {
  return doc.type.startsWith("image/") || doc.type === "application/pdf";
}

function titleFromName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Returns the stored file, or a generated sample for seeded demo documents. */
export async function loadDocument(doc: DocumentFile, admission: Admission): Promise<Blob> {
  const stored = await getFile(doc.id).catch(() => undefined);
  if (stored) return stored;

  const title = titleFromName(doc.name);
  const lines = [
    `Student: ${admission.studentName}`,
    `Application ID: ${admission.id}`,
    `Date of birth: ${formatDate(admission.dateOfBirth)}`,
    `Applying for: ${admission.applyingClass} (${admission.version} version)`,
    `Submitted with the application on ${formatDate(admission.appliedOn)}.`,
    "Real scanned files are stored on the server once the backend is connected.",
  ];
  return doc.type.startsWith("image/") ? buildSampleImage(title, lines) : buildSamplePdf(title, lines);
}

export async function downloadDocument(doc: DocumentFile, admission: Admission) {
  downloadBlob(await loadDocument(doc, admission), doc.name);
}
