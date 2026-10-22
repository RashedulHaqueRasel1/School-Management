import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  /** Icon rendered inside the field on the left. */
  leftIcon?: React.ReactNode;
  /** Element rendered inside the field on the right (e.g. a show-password toggle). */
  rightSlot?: React.ReactNode;
  /** Error state (red border, aria-invalid). */
  invalid?: boolean;
};

export function Input({ className, leftIcon, rightSlot, invalid, ...props }: InputProps) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle [&_svg]:h-[18px] [&_svg]:w-[18px]">
          {leftIcon}
        </span>
      )}
      <input
        aria-invalid={invalid || undefined}
        className={cn(
          "h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-fg shadow-card transition placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
          leftIcon && "pl-11",
          rightSlot && "pr-11",
          invalid && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10",
          className,
        )}
        {...props}
      />
      {rightSlot && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
      )}
    </div>
  );
}
