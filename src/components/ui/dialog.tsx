"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useOverlay } from "@/hooks/use-overlay";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Optional icon shown left of the title. */
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof sizes;
  children?: React.ReactNode;
};

export function Dialog({ open, onClose, title, description, icon, footer, size = "md", children }: DialogProps) {
  useOverlay(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92vh] w-full animate-dialog-in flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-popover sm:rounded-3xl",
          sizes[size],
        )}
      >
        <div className="flex items-start gap-4 px-6 pb-4 pt-6">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
            {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children && <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2.5 border-t border-line bg-subtle/60 px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
