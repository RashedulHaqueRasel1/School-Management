import Link from "next/link";
import { CalendarCheck, Clock, Megaphone, Plus, Sparkles, Wallet } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";

const highlights = [
  { label: "Attendance today", value: "94.2%", icon: CalendarCheck },
  { label: "Pending approvals", value: "12", icon: Clock },
  { label: "Fees due this month", value: "৳ 1.2L", icon: Wallet },
  { label: "Events this week", value: "3", icon: Megaphone },
];

export function WelcomeBanner() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-navy-950 px-6 py-8 text-white shadow-card ring-1 ring-transparent sm:px-10 sm:py-10 dark:ring-white/10">
      {/* Decorative layers */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid-white [mask-image:radial-gradient(ellipse_at_top_right,black_10%,transparent_65%)]" />
      <div aria-hidden className="absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-indigo-500/40 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />

      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-inset ring-white/15">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            Academic Year 2026–27 · Term 2
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">
            Welcome back, Admin
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-[15px]">
            Here&apos;s a snapshot of your school today. Attendance is up{" "}
            <span className="font-semibold text-emerald-300">2.1%</span> this week and{" "}
            <span className="font-semibold text-white">12 admissions</span> are waiting for review.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/admissions/new-application" className={buttonStyles({ variant: "white" })}>
              <Plus className="h-4 w-4" />
              New Admission
            </Link>
            <Link href="/notices" className={buttonStyles({ variant: "glass" })}>
              <Megaphone className="h-4 w-4" />
              Publish Notice
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:w-[420px]">
          {highlights.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 backdrop-blur-sm transition hover:bg-white/[0.09]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-indigo-200">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xl font-bold tabular-nums tracking-tight">{value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
