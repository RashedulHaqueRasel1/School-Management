import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-soft text-fg-secondary ring-line-strong",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  warning: "bg-amber-50 text-amber-700 ring-amber-200/70",
  danger: "bg-rose-50 text-rose-700 ring-rose-200/70",
  info: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
  violet: "bg-violet-50 text-violet-700 ring-violet-200/70",
} as const;

const dots: Record<keyof typeof tones, string> = {
  neutral: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-indigo-500",
  violet: "bg-violet-500",
};

export type BadgeTone = keyof typeof tones;

type BadgeProps = React.ComponentProps<"span"> & {
  tone?: BadgeTone;
  /** Show a small status dot before the label. */
  dot?: boolean;
};

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}
