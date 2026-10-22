"use client";

import { useState } from "react";

import { FilePreviewDialog } from "@/components/shared/FilePreviewDialog";
import { Download, Eye, FileText, ImageIcon, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { toast } from "@/store/toast.store";

import { downloadDocument, isPreviewable, loadDocument } from "../../documents";
import type { Admission, DocumentFile } from "../../types/types";
import { formatFileSize } from "../../utils";

export function DocumentsCard({ admission }: { admission: Admission }) {
  const [previewing, setPreviewing] = useState<DocumentFile | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function download(doc: DocumentFile) {
    setDownloading(doc.id);
    try {
      await downloadDocument(doc, admission);
    } catch {
      toast("Download failed", { description: doc.name, tone: "error" });
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-soft text-fg-muted">
          <FileText className="h-4 w-4" />
        </span>
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">Documents</h2>
        <span className="text-xs text-fg-subtle">{admission.documents.length} file(s)</span>
      </div>

      {admission.documents.length === 0 ? (
        <p className="text-sm text-fg-subtle">No documents uploaded.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {admission.documents.map((doc) => {
            const Icon = doc.type.startsWith("image/") ? ImageIcon : FileText;
            const busy = downloading === doc.id;
            return (
              <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => (isPreviewable(doc) ? setPreviewing(doc) : void download(doc))}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  title={isPreviewable(doc) ? "Preview" : "Download"}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg hover:text-indigo-600">{doc.name}</span>
                    <span className="block text-xs text-fg-subtle">{formatFileSize(doc.size)}</span>
                  </span>
                </button>
                {isPreviewable(doc) && (
                  <button
                    type="button"
                    onClick={() => setPreviewing(doc)}
                    aria-label={`Preview ${doc.name}`}
                    title="Preview"
                    className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void download(doc)}
                  disabled={busy}
                  aria-label={`Download ${doc.name}`}
                  title="Download"
                  className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {previewing && (
        <FilePreviewDialog
          fileName={previewing.name}
          description={`${formatFileSize(previewing.size)} · ${admission.studentName} · ${admission.id}`}
          load={() => loadDocument(previewing, admission)}
          onClose={() => setPreviewing(null)}
        />
      )}
    </Card>
  );
}
