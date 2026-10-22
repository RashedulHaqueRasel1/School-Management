"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type FilePreviewDialogProps = {
  fileName: string;
  description?: string;
  /** Loads the file (IndexedDB, API, generated sample…). */
  load: () => Promise<Blob>;
  onClose: () => void;
};

/** Preview a PDF or image in a modal, with download / open-in-new-tab. */
export function FilePreviewDialog({ fileName, description, load, onClose }: FilePreviewDialogProps) {
  const [file, setFile] = useState<{ url: string; type: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    load()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setFile({ url: objectUrl, type: blob.type });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // `load` is recreated by callers on every render; the file only needs loading once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName]);

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={fileName}
      description={description}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <FileText className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          {file && (
            <a href={file.url} target="_blank" rel="noopener" className={buttonStyles({ variant: "ghost", className: "sm:mr-auto" })}>
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {file ? (
            <a href={file.url} download={fileName} className={buttonStyles()}>
              <Download className="h-4 w-4" />
              Download
            </a>
          ) : (
            <Button disabled>
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
        </>
      }
    >
      <div className="flex min-h-[50vh] items-center justify-center rounded-2xl bg-subtle p-2">
        {failed ? (
          <p className="text-sm text-fg-muted">This file could not be loaded.</p>
        ) : !file ? (
          <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" />
        ) : file.type === "application/pdf" ? (
          <iframe src={file.url} title={fileName} className="h-[65vh] w-full rounded-xl bg-white" />
        ) : file.type.startsWith("image/") ? (
          <Image src={file.url} alt={fileName} width={1000} height={700} unoptimized className="h-auto max-h-[65vh] w-auto rounded-xl object-contain" />
        ) : (
          <p className="text-sm text-fg-muted">No preview for this file type — use Download.</p>
        )}
      </div>
    </Dialog>
  );
}
