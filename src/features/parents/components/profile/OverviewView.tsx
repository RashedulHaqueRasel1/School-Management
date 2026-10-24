"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, GraduationCap, Home, MessageSquareText, NotebookPen, Star, UserRound } from "lucide-react";

import { InfoCard, InfoFields } from "@/components/shared/InfoCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDateTime, formatTaka } from "@/features/admissions/utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";

import { TEMPLATE_LABEL } from "../../demoData/mock-data";
import { useParent } from "../../hooks/use-parent";
import { parentHref } from "../../utils";
import { formatMeetingTime } from "./admin/MeetingDialogs";

const CHANNEL_LABEL = { sms: "SMS", email: "Email", both: "SMS + Email" } as const;

export function ParentOverviewView({ slug }: { slug: string }) {
  const { parent, ledgers, messages, meetings, profile, teacherOf } = useParent(slug);
  if (!parent || !ledgers || !messages || !meetings || !profile || !teacherOf) return null;
  const upcoming = meetings.filter((m) => m.status === "scheduled" && m.date >= localToday()).reverse();

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <GraduationCap className="h-4 w-4 text-fg-muted" />
              Children
            </h2>
            <Link href={parentHref(parent, "children")} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {parent.links.map((l) => {
              const ledger = ledgers.get(l.student.id);
              const left = l.student.status === "left";
              return (
                <Link key={l.student.id} href={studentHref(l.student)} className={cn("group rounded-2xl border border-line p-4 transition hover:-translate-y-0.5 hover:shadow-card-hover", left && "opacity-70")}>
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={l.student.name} photo={l.student.photo} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fg group-hover:text-indigo-600">{l.student.name}</p>
                      <p className="text-xs text-fg-muted">
                        {l.student.className} · Section {l.student.section} · Roll {l.student.roll}
                      </p>
                    </div>
                    {l.isPrimary && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-label="Primary contact" />}
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
                    <div>
                      <dt className="text-fg-subtle">As</dt>
                      <dd className="font-medium text-fg">{l.relation}</dd>
                    </div>
                    <div>
                      <dt className="text-fg-subtle">Class teacher</dt>
                      <dd className="truncate font-medium text-fg">{teacherOf(l.student.id)}</dd>
                    </div>
                    <div>
                      <dt className="text-fg-subtle">Tuition</dt>
                      <dd className={cn("font-semibold", left ? "text-fg-muted" : ledger && ledger.outstanding > 0 ? "text-rose-600" : "text-emerald-600")}>
                        {left ? "Left (TC)" : ledger && ledger.outstanding > 0 ? `${formatTaka(ledger.outstanding)} due` : "Clear"}
                      </dd>
                    </div>
                  </dl>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <MessageSquareText className="h-4 w-4 text-fg-muted" />
              Recent messages
            </h2>
            <Link href={parentHref(parent, "messages")} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All messages <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="space-y-2.5">
            {messages.slice(0, 4).map((m) => (
              <li key={m.id} className="rounded-xl bg-subtle px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-fg">{m.subject}</p>
                  <Badge>{TEMPLATE_LABEL[m.template]}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-fg-secondary">{m.body}</p>
                <p className="mt-1 text-xs text-fg-subtle">
                  {CHANNEL_LABEL[m.channel]} · {formatDateTime(m.sentAt)} · {m.sentBy}
                </p>
              </li>
            ))}
            {messages.length === 0 && <li className="py-6 text-center text-sm text-fg-muted">No messages yet.</li>}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <InfoCard icon={UserRound} title="Contact details">
          <InfoFields
            className="sm:grid-cols-1"
            items={[
              ["Mobile", parent.phone],
              ["Email", parent.email],
              ["Occupation", parent.occupation],
              ["NID", parent.nid],
              ["Preferred channel", `${CHANNEL_LABEL[profile.preferredChannel]} · ${profile.language}`],
            ]}
          />
        </InfoCard>
        <InfoCard icon={Home} title="Address">
          <p className="text-sm text-fg-secondary">{parent.address || "—"}</p>
        </InfoCard>
        <InfoCard icon={CalendarClock} title="Upcoming meetings">
          {upcoming.length === 0 ? (
            <p className="text-sm text-fg-muted">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li key={m.id} className="rounded-xl bg-violet-50 px-3 py-2.5">
                  <p className="text-sm font-semibold text-violet-800 dark:text-violet-700">{formatMeetingTime(m)}</p>
                  <p className="text-xs text-violet-700/80">
                    {m.studentName} · {m.withWhom} · {m.mode}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
        {profile.notes && (
          <InfoCard icon={NotebookPen} title="Admin notes">
            <p className="whitespace-pre-wrap text-sm text-fg-secondary">{profile.notes}</p>
          </InfoCard>
        )}
      </div>
    </div>
  );
}
