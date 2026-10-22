"use client";

import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  /** Shows a dash — e.g. "some rows selected". */
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label": string;
  className?: string;
};

export function Checkbox({ checked, indeterminate, onCheckedChange, className, ...props }: CheckboxProps) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={props["aria-label"]}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition",
        on
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-fg-subtle/60 bg-surface hover:border-indigo-400",
        className,
      )}
    >
      {indeterminate ? <Minus className="h-3 w-3" strokeWidth={3} /> : checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}
