"use client";

import { cn } from "@/lib/utils";

type RadioCardProps = {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

/** Selectable card backed by a real radio input (keyboard accessible). */
export function RadioCard({ name, value, checked, onSelect, title, description, icon, className }: RadioCardProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition",
        checked
          ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20"
          : "border-line-strong bg-surface hover:border-fg-subtle/50",
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{title}</span>
        {description && <span className="mt-0.5 block truncate text-xs text-fg-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2",
          checked ? "border-indigo-600" : "border-fg-subtle/60",
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
      </span>
    </label>
  );
}
