"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastStore, type ToastTone } from "@/store/toast.store";

const toneStyle: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "text-emerald-500" },
  error: { icon: XCircle, className: "text-rose-500" },
  info: { icon: Info, className: "text-indigo-500" },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex print:hidden w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const { icon: Icon, className } = toneStyle[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-popover"
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", className)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-fg-muted">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded-md p-0.5 text-fg-subtle transition hover:bg-soft hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
