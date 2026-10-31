"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useSettingsStore, type SavableKey, type SettingsState } from "../store/settings.store";

/** Local draft of one settings section + whether it differs from what's saved. */
export function useDraft<K extends SavableKey>(key: K) {
  const saved = useSettingsStore((s) => s[key]);
  const savedAt = useSettingsStore((s) => s.savedAt[key]);
  const save = useSettingsStore((s) => s.save);
  const [draft, setDraft] = useState<SettingsState[K]>(saved);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  return {
    draft,
    setDraft,
    patch: (p: Partial<SettingsState[K]>) => setDraft((d) => ({ ...d, ...p })),
    dirty,
    savedAt,
    discard: () => setDraft(saved),
    commit: (label: string) => {
      save(key, draft);
      toast(`${label} saved`);
    },
  };
}

type SectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  savedAt?: string;
};

export function SectionHeader({ icon: Icon, title, description, accent, savedAt }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", accent)}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fg">{title}</h2>
          <p className="mt-0.5 max-w-xl text-sm text-fg-muted">{description}</p>
        </div>
      </div>
      {savedAt && (
        <p className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Saved {formatDateTime(savedAt)}
        </p>
      )}
    </div>
  );
}

type PanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
};

/** A titled card inside a settings section. */
export function Panel({ title, description, children, className, action }: PanelProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-line bg-subtle/60 px-5 py-4 sm:px-6">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  );
}

type RowProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
};

/** Label on the left, control on the right — for switches and short selects. */
export function SettingRow({ title, description, icon: Icon, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-soft text-fg-muted">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">{title}</p>
          {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Floating bar shown while a section has unsaved changes. */
export function SaveBar({ dirty, onDiscard, onSave, disabled }: { dirty: boolean; onDiscard: () => void; onSave: () => void; disabled?: boolean }) {
  return (
    <div
      aria-hidden={!dirty}
      className={cn(
        "sticky bottom-4 z-20 mt-6 transition-all duration-200",
        dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-[0_12px_40px_-12px_rgb(15_23_42/0.35)] backdrop-blur sm:px-5">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          You have unsaved changes
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard} tabIndex={dirty ? 0 : -1}>
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </Button>
          <Button size="sm" onClick={onSave} disabled={disabled} tabIndex={dirty ? 0 : -1}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Pill-style multi toggle (e.g. working days, shifts). */
export function ChipToggle({ options, value, onChange, min = 0 }: { options: string[]; value: string[]; onChange: (v: string[]) => void; min?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            disabled={on && value.length <= min}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : options.filter((x) => x === o || value.includes(x)))}
            className={cn(
              "h-9 rounded-xl border px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed",
              on
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/15"
                : "border-line-strong bg-surface text-fg-muted hover:border-fg-subtle/50 hover:text-fg",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
