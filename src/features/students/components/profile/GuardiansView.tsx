"use client";

import { useState } from "react";

import { BellRing, Briefcase, CreditCard, Home, Mail, MessageSquareText, PenLine, Phone, Star, UserPlus } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { InfoCard, InfoFields } from "@/components/shared/InfoCard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActivityTimeline } from "@/features/admissions/components/details/ActivityTimeline";
import { cn } from "@/lib/utils";

import { useStudent } from "../../hooks/use-student";
import { EditGuardianDialog } from "./admin/InfoDialogs";

export function GuardiansView({ slug }: { slug: string }) {
  const { student, profile, admission } = useStudent(slug);
  /** index of the guardian being edited, "new" to add one */
  const [editing, setEditing] = useState<number | "new" | null>(null);
  if (!student || !profile) return null;
  const hasLocal = profile.guardians.some((g) => g.role === "Local guardian");

  const primary = profile.guardians.find((g) => g.isPrimary) ?? profile.guardians[0]!;
  const messages = admission?.history.filter((e) => e.message) ?? [];

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 bg-linear-to-r from-indigo-50 to-transparent p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-glow">
          <BellRing className="h-5 w-5" />
        </span>
        <p className="text-sm text-fg-secondary">
          School updates (attendance alerts, results, fee reminders) go to{" "}
          <span className="font-semibold text-fg">
            {primary.name} ({primary.relation})
          </span>{" "}
          by SMS at <span className="font-semibold text-fg">{primary.phone}</span>
          {primary.email && (
            <>
              {" "}
              and email at <span className="font-semibold text-fg">{primary.email}</span>
            </>
          )}
          .
        </p>
        {!hasLocal && (
          <Button variant="outline" size="sm" className="shrink-0 sm:ml-auto" onClick={() => setEditing("new")}>
            <UserPlus className="h-3.5 w-3.5" />
            Add local guardian
          </Button>
        )}
      </Card>

      <div className={cn("grid grid-cols-1 gap-6", profile.guardians.length > 2 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
        {profile.guardians.map((g, index) => (
          <Card key={g.role} className={cn("relative p-5 sm:p-6", g.isPrimary && "ring-2 ring-indigo-500/30")}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{g.role}</p>
              <div className="flex items-center gap-1.5">
                {g.isPrimary && (
                  <Badge tone="info">
                    <Star className="h-3 w-3" /> Primary
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(index)}
                  aria-label={`Edit ${g.role.toLowerCase()}`}
                  className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-indigo-600"
                >
                  <PenLine className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={g.name} size="lg" className="h-14 w-14 text-base" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-fg">{g.name}</p>
                <p className="text-sm text-fg-muted">{g.relation}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <Row icon={Briefcase} label="Occupation" value={g.occupation} />
              <Row icon={Phone} label="Mobile" value={g.phone && <a href={`tel:${g.phone}`} className="hover:text-indigo-600">{g.phone}</a>} />
              <Row icon={Mail} label="Email" value={g.email && <a href={`mailto:${g.email}`} className="hover:text-indigo-600">{g.email}</a>} />
              <Row icon={CreditCard} label="NID" value={g.nid} />
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href={g.phone ? `tel:${g.phone}` : undefined}
                aria-disabled={!g.phone}
                className={cn("flex items-center justify-center gap-1.5 rounded-xl border border-line-strong py-2 text-xs font-semibold text-fg-secondary hover:bg-subtle", !g.phone && "pointer-events-none opacity-40")}
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a
                href={g.phone ? `sms:${g.phone}` : undefined}
                aria-disabled={!g.phone}
                className={cn("flex items-center justify-center gap-1.5 rounded-xl border border-line-strong py-2 text-xs font-semibold text-fg-secondary hover:bg-subtle", !g.phone && "pointer-events-none opacity-40")}
              >
                <MessageSquareText className="h-3.5 w-3.5" /> SMS
              </a>
            </div>
          </Card>
        ))}
      </div>

      <InfoCard icon={Home} title="Family address">
        <InfoFields
          items={[
            ["Present address", student.address],
            ["Permanent address", profile.permanentAddress === student.address ? "Same as present" : profile.permanentAddress],
          ]}
        />
      </InfoCard>

      {messages.length > 0 ? (
        <ActivityTimeline events={messages} />
      ) : (
        <Card>
          <EmptyState
            icon={MessageSquareText}
            title="No messages yet"
            description="SMS and email sent to the guardians will be listed here once the communication module is connected."
          />
        </Card>
      )}
      {editing !== null && (
        <EditGuardianDialog
          key={String(editing)}
          student={student}
          guardians={profile.guardians}
          index={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
      <dt className="w-24 shrink-0 text-fg-muted">{label}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium text-fg">{value || <span className="font-normal text-fg-subtle">—</span>}</dd>
    </div>
  );
}
