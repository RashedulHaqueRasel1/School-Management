import { BookOpen, BriefcaseBusiness, ClipboardList, GraduationCap, HeartHandshake, School, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type HeroField = { icon: LucideIcon; label: string; value: React.ReactNode };

const RIBBON_TONES = {
  success: "from-emerald-500 to-teal-500",
  warning: "from-amber-500 to-orange-500",
  danger: "from-rose-500 to-pink-500",
  violet: "from-violet-500 to-fuchsia-500",
  neutral: "from-slate-500 to-slate-600",
  info: "from-indigo-500 to-violet-500",
} as const;

export type RibbonTone = keyof typeof RIBBON_TONES;

/**
 * Each profile type has its own colour and identity so admins can tell at a
 * glance whose profile is open (student / teacher / guardian).
 */
const ROLE_THEME = {
  student: {
    label: "Student",
    icon: GraduationCap,
    stripe: "from-indigo-500 via-violet-500 to-fuchsia-500",
    wash: "via-indigo-50/40 to-violet-50/70",
    glow: "bg-indigo-100/40",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
    fieldIcon: "text-indigo-500",
    ring: "ring-indigo-200",
    badge: "bg-linear-to-br from-indigo-500 to-violet-600",
    avatarShape: "rounded-full",
  },
  teacher: {
    label: "Teacher",
    icon: BriefcaseBusiness,
    stripe: "from-emerald-500 via-teal-500 to-sky-500",
    wash: "via-emerald-50/40 to-sky-50/60",
    glow: "bg-emerald-100/40",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    fieldIcon: "text-emerald-600",
    ring: "ring-emerald-200",
    badge: "bg-linear-to-br from-emerald-500 to-teal-600",
    avatarShape: "rounded-2xl",
  },
  guardian: {
    label: "Parent / Guardian",
    icon: HeartHandshake,
    stripe: "from-amber-400 via-orange-500 to-rose-500",
    wash: "via-amber-50/40 to-orange-50/70",
    glow: "bg-amber-100/50",
    chip: "bg-amber-50 text-amber-700 ring-amber-200/70",
    fieldIcon: "text-orange-500",
    ring: "ring-amber-200",
    badge: "bg-linear-to-br from-amber-500 to-orange-600",
    avatarShape: "rounded-full",
  },
  section: {
    label: "Class section",
    icon: School,
    stripe: "from-sky-500 via-cyan-500 to-indigo-500",
    wash: "via-sky-50/50 to-indigo-50/50",
    glow: "bg-sky-100/40",
    chip: "bg-sky-50 text-sky-700 ring-sky-200/70",
    fieldIcon: "text-sky-600",
    ring: "ring-sky-200",
    badge: "bg-linear-to-br from-sky-500 to-cyan-600",
    avatarShape: "rounded-2xl",
  },
  subject: {
    label: "Subject",
    icon: BookOpen,
    stripe: "from-violet-500 via-fuchsia-500 to-pink-500",
    wash: "via-violet-50/40 to-pink-50/50",
    glow: "bg-violet-100/40",
    chip: "bg-violet-50 text-violet-700 ring-violet-200/70",
    fieldIcon: "text-violet-600",
    ring: "ring-violet-200",
    badge: "bg-linear-to-br from-violet-500 to-fuchsia-600",
    avatarShape: "rounded-2xl",
  },
  exam: {
    label: "Examination",
    icon: ClipboardList,
    stripe: "from-rose-500 via-orange-500 to-amber-400",
    wash: "via-rose-50/40 to-orange-50/50",
    glow: "bg-rose-100/40",
    chip: "bg-rose-50 text-rose-700 ring-rose-200/70",
    fieldIcon: "text-rose-500",
    ring: "ring-rose-200",
    badge: "bg-linear-to-br from-rose-500 to-orange-500",
    avatarShape: "rounded-2xl",
  },
} as const;

export type ProfileRole = keyof typeof ROLE_THEME;

/**
 * Profile header shared by student / teacher / guardian profiles:
 * photo, name + badges, then label/value fields in columns
 * and a diagonal status ribbon in the corner.
 */
export function ProfileHero({
  role,
  avatar,
  name,
  code,
  badges,
  actions,
  columns,
  ribbon,
  footer,
}: {
  role: ProfileRole;
  /** Photo / initials, already shaped for the role (round, or rounded square for staff). */
  avatar: React.ReactNode;
  name: string;
  /** ID chip next to the name. */
  code?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  /** Up to four columns of fields. */
  columns: HeroField[][];
  ribbon?: { label: string; icon?: LucideIcon; tone: RibbonTone };
  /** Banner under the fields (e.g. "left the school"). */
  footer?: React.ReactNode;
}) {
  const theme = ROLE_THEME[role];
  const RoleIcon = theme.icon;
  const RibbonIcon = ribbon?.icon;
  return (
    // No overflow-hidden on the card itself: the Manage dropdown must be able to
    // extend past it. Only the decorative layers are clipped to the rounded corners.
    <Card className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-linear-to-r print:[print-color-adjust:exact]", theme.stripe)} />
        <div className={cn("absolute inset-0 bg-linear-to-br from-transparent", theme.wash)} />
        <div className={cn("absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl", theme.glow)} />
      </div>

      {ribbon && (
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-40 w-40 overflow-hidden rounded-tr-[inherit] print:hidden">
          <div
            className={cn(
              "absolute right-[-58px] top-[34px] flex w-[230px] rotate-45 items-center justify-center gap-1.5 bg-linear-to-r py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_6px_16px_-6px_rgb(15_23_42/0.45)]",
              RIBBON_TONES[ribbon.tone],
            )}
          >
            {RibbonIcon && <RibbonIcon className="h-3.5 w-3.5" />}
            {ribbon.label}
          </div>
        </div>
      )}

      <div className="relative flex flex-col gap-6 p-5 pt-6 sm:p-6 sm:pt-7 lg:flex-row lg:items-center lg:gap-8 lg:p-7 lg:pt-8">
        <div className="relative shrink-0 self-center lg:self-auto">
          <div className={cn("bg-surface p-1.5 shadow-card ring-2", theme.avatarShape === "rounded-full" ? "rounded-full" : "rounded-[1.4rem]", theme.ring)}>{avatar}</div>
          <span
            className={cn("absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-card ring-4 ring-surface", theme.badge)}
            title={theme.label}
          >
            <RoleIcon className="h-4 w-4" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between xl:pr-32">
            <div className="min-w-0">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset", theme.chip)}>
                <RoleIcon className="h-3 w-3" />
                {theme.label}{role === "section" || role === "subject" || role === "exam" ? "" : " profile"}
              </span>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[26px]">{name}</h1>
                {code && <span className="rounded-md bg-soft px-2 py-0.5 font-mono text-xs font-semibold text-fg-secondary">{code}</span>}
              </div>
              {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
            </div>
            {actions && <div className="flex flex-wrap gap-2 print:hidden xl:shrink-0 xl:flex-nowrap">{actions}</div>}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-y-4 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-line">
            {columns.map((column, i) => (
              <dl key={i} className={cn("space-y-4", "sm:pr-4 xl:px-6", i === 0 && "xl:pl-0")}>
                {column.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex min-w-0 gap-3">
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", theme.fieldIcon)} />
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{label}</dt>
                      <dd className="mt-0.5 break-words text-sm font-semibold text-fg">{value || <span className="font-normal text-fg-subtle">—</span>}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ))}
          </div>
        </div>
      </div>

      {footer && <div className="relative border-t border-line px-5 py-4 sm:px-6 lg:px-7">{footer}</div>}
    </Card>
  );
}
