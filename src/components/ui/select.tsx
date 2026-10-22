import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectProps = React.ComponentProps<"select"> & {
  invalid?: boolean;
};

/** Styled native select (keyboard & mobile friendly out of the box). */
export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-xl border border-line-strong bg-surface pl-3.5 pr-9 text-sm text-fg shadow-card transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
          invalid && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
}
