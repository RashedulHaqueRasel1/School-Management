import { cn } from "@/lib/utils";

export function Textarea({ className, invalid, ...props }: React.ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg shadow-card transition placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
        invalid && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10",
        className,
      )}
      {...props}
    />
  );
}
