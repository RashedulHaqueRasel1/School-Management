import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoProps = {
  /** `dark` = white text for navy backgrounds. */
  tone?: "light" | "dark";
  /** Hide the wordmark (icon only). */
  iconOnly?: boolean;
  subtitle?: string;
  className?: string;
};

export function Logo({ tone = "light", iconOnly, subtitle, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
        <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
      </div>
      {!iconOnly && (
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "truncate text-[15px] font-bold tracking-tight",
              tone === "dark" ? "text-white" : "text-fg",
            )}
          >
            EduManage
          </p>
          {subtitle && (
            <p
              className={cn(
                "truncate text-xs",
                tone === "dark" ? "text-slate-400" : "text-fg-muted",
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
