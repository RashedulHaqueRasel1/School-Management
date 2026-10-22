"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, UploadCloud, X } from "lucide-react";

import { putFile } from "@/lib/indexed-db-storage";
import { cn } from "@/lib/utils";

import type { DocumentFile } from "../../types/types";
import { formatFileSize, uid } from "../../utils";

const MAX_FILE_MB = 10;

type DocumentsUploadProps = {
  value: DocumentFile[];
  onChange: (documents: DocumentFile[]) => void;
};

/**
 * Supporting documents (birth certificate, previous report card, TC…).
 * Demo stores each file in IndexedDB (metadata goes in the form values).
 * TODO (backend phase): upload each file and store its URL in `DocumentFile`.
 */
export function DocumentsUpload({ value, onChange }: DocumentsUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const accepted = [...files].filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    setError(accepted.length < files.length ? `Files larger than ${MAX_FILE_MB} MB were skipped.` : "");
    const added = accepted.map((file) => ({ file, doc: { id: uid(), name: file.name, size: file.size, type: file.type } }));
    // Keep the actual file in IndexedDB so it can be viewed / downloaded later.
    for (const { file, doc } of added) void putFile(doc.id, file).catch(() => setError("Could not store a file in this browser."));
    onChange([...value, ...added.map((a) => a.doc)]);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
          dragging ? "border-indigo-500 bg-indigo-50" : "border-line-strong bg-subtle hover:border-indigo-400 hover:bg-indigo-50/50",
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-fg">
          <span className="text-indigo-600">Click to upload</span> or drag and drop
        </span>
        <span className="text-xs text-fg-muted">Birth certificate, previous report card, transfer certificate · PDF, JPG, PNG up to {MAX_FILE_MB} MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-xs font-medium text-amber-600">{error}</p>}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((doc) => {
            const Icon = doc.type.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-soft text-fg-muted">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{doc.name}</p>
                  <p className="text-xs text-fg-subtle">{formatFileSize(doc.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((d) => d.id !== doc.id))}
                  aria-label={`Remove ${doc.name}`}
                  className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
