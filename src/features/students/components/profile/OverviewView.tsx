"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, BellRing, CalendarCheck, Mail, Phone, Star, Trophy, Wallet } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatTaka } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

import { localToday } from "../../demoData/profile-data";
import { useStudent } from "../../hooks/use-student";
import { studentHref } from "../../utils";
import { AttendanceCalendar } from "./AttendanceCalendar";
import { summarize } from "./attendance-utils";
import { gradeTone } from "./grade-utils";
import { TodayCard } from "./TodayCard";

export function OverviewView({ slug }: { slug: string }) {
  const { student, profile, leaveRequests, weekend } = useStudent(slug);
  const today = localToday();
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  if (!student || !profile) return null;

  const session = summarize(profile.attendance);
  const published = profile.exams.filter((e) => e.status === "published");
  const latest = published.at(-1);
  const primary = profile.guardians.find((g) => g.isPrimary) ?? profile.guardians[0]!;

  const stats = [
    { label: "Attendance rate", value: `${session.rate}%`, hint: `${session.present + session.late} of ${session.schoolDays} school days`, icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Latest GPA", value: latest ? latest.gpa.toFixed(2) : "—", hint: latest ? `${latest.name} · ${latest.grade}` : "No exam yet", icon: Award, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Class position", value: latest ? `${latest.position}` : "—", hint: latest ? `out of ${latest.classSize} students` : "After first exam", icon: Trophy, accent: "bg-amber-50 text-amber-600" },
    { label: "Admission fee", value: student.feeDue > 0 ? formatTaka(student.feeDue) : "Clear", hint: student.feeDue > 0 ? "Balance due" : "Nothing outstanding", icon: Wallet, accent: student.feeDue > 0 ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600" },
  ];

  const awaiting = leaveRequests.filter((r) => r.stage === "admin");

  return (
    <div className="space-y-6">
      {awaiting.length > 0 && (
        <Card className="flex flex-col gap-3 border-amber-200/70 bg-amber-50 p-4 sm:flex-row sm:items-center sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <BellRing className="h-5 w-5" />
          </span>
          <p className="flex-1 text-sm text-amber-800 dark:text-amber-700">
            <span className="font-semibold">
              {awaiting.length} leave request{awaiting.length > 1 ? "s" : ""} waiting for your approval
            </span>{" "}
            — already recommended by the class teacher.
          </p>
          <Link href={studentHref(student, "leave")} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-800 hover:underline dark:text-amber-700">
            Review now <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <TodayCard days={profile.attendance} shift={profile.shift} weekend={weekend} />
        <AttendanceCalendar
          days={profile.attendance}
          shift={profile.shift}
          enrolledOn={student.enrolledOn}
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon, accent }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums text-fg">{value}</p>
              <p className="truncate text-xs text-fg-subtle">{hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Latest result */}
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Latest result</h2>
              <p className="mt-0.5 text-xs text-fg-muted">{latest ? `${latest.name} · GPA ${latest.gpa.toFixed(2)} · Position ${latest.position}/${latest.classSize}` : "No published exam yet"}</p>
            </div>
            <Link href={studentHref(student, "academics")} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All results <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {latest ? (
            <ul className="space-y-3.5">
              {latest.results.map((r) => (
                <li key={r.code} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[180px_minmax(0,1fr)_88px]">
                  <span className="truncate text-sm font-medium text-fg">{r.subject}</span>
                  <span className="order-3 col-span-2 h-2 overflow-hidden rounded-full bg-soft sm:order-none sm:col-span-1">
                    <span className="block h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500" style={{ width: `${r.obtained}%` }} />
                  </span>
                  <span className="flex items-center justify-end gap-2 text-sm">
                    <span className="font-semibold tabular-nums text-fg">{r.obtained}</span>
                    <Badge tone={gradeTone(r.grade)} className="w-9 justify-center">
                      {r.grade}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-subtle px-4 py-8 text-center text-sm text-fg-muted">
              {student.name.split(" ")[0]} joined after this session&apos;s exams. Results will appear after the{" "}
              {profile.exams.find((e) => e.status === "upcoming")?.name ?? "next exam"}.
            </p>
          )}
        </Card>

        <div className="space-y-6">
          {/* Class teacher */}
          <Card className="p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Class teacher</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={profile.classTeacher.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-fg">{profile.classTeacher.name}</p>
                <p className="truncate text-xs text-fg-muted">
                  {profile.classTeacher.designation} · {profile.classTeacher.subject}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={`tel:${profile.classTeacher.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-line-strong py-2 text-xs font-semibold text-fg-secondary hover:bg-subtle">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a href={`mailto:${profile.classTeacher.email}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-line-strong py-2 text-xs font-semibold text-fg-secondary hover:bg-subtle">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </div>
          </Card>

          {/* Primary guardian */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Primary guardian</p>
              <Badge tone="info">
                <Star className="h-3 w-3" /> Gets updates
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={primary.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-fg">{primary.name}</p>
                <p className="truncate text-xs text-fg-muted">
                  {primary.relation} · {primary.phone}
                </p>
              </div>
            </div>
            <Link href={studentHref(student, "guardians")} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All guardians <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
