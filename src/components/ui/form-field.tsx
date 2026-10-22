import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  required?: boolean;
  /** Validation message shown under the control. */
  error?: string;
  /** Helper text shown when there is no error. */
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

/** Label + control + hint/error. The wrapping <label> links the text to its control. */
export function FormField({ label, required, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-fg-secondary">
          {label}
          {required ? (
            <span className="text-rose-500" aria-hidden>
              *
            </span>
          ) : (
            <span className="text-xs font-normal text-fg-subtle">(optional)</span>
          )}
        </span>
        {children}
      </label>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}

export function FieldGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2", className)} {...props} />;
}
