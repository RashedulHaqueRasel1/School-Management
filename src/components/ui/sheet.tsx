"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useOverlay } from "@/hooks/use-overlay";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Rendered under the title (badges, meta…). */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

/** Right-side slide-over panel. */
export function Sheet({ open, onClose, title, header, footer, children }: SheetProps) {
  useOverlay(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg animate-sheet-in flex-col border-l border-line bg-surface shadow-popover"
      >
        <div className="flex items-start gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">{header ?? <h2 className="text-lg font-semibold text-fg">{title}</h2>}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex flex-wrap gap-2.5 border-t border-line bg-subtle/60 px-6 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}
