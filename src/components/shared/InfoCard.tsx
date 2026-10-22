import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Titled card used on detail / profile pages. */
export function InfoCard({
  icon: Icon,
  title,
  action,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  /** Right side of the header (badge, link…). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-soft text-fg-muted">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </Card>
  );
}

/** Label / value grid. Empty values render as a muted dash. */
export function InfoFields({ items, className }: { items: [string, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-fg-muted">{label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-fg">{value || <span className="font-normal text-fg-subtle">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
