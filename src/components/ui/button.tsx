import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow hover:from-indigo-500 hover:to-indigo-500",
  outline:
    "border border-line-strong bg-surface text-fg-secondary shadow-card hover:border-fg-subtle/50 hover:bg-subtle hover:text-fg",
  ghost: "text-fg-muted hover:bg-soft hover:text-fg",
  white: "bg-white text-slate-900 shadow-sm hover:bg-slate-100",
  danger:
    "bg-linear-to-b from-rose-500 to-rose-600 text-white shadow-[0_8px_20px_-6px_rgb(244_63_94/0.5)] hover:from-rose-500 hover:to-rose-500",
  glass:
    "bg-white/10 text-white ring-1 ring-inset ring-white/15 backdrop-blur hover:bg-white/15",
} as const;

const sizes = {
  sm: "h-8 rounded-lg px-3 text-xs",
  md: "h-10 rounded-xl px-4 text-sm",
  lg: "h-11 rounded-xl px-5 text-sm",
  icon: "h-10 w-10 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Class names for a button — also usable on `<Link>` to render link-buttons. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
