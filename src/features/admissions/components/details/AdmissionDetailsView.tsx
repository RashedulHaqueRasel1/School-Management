"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileSearch,
  GraduationCap,
  HeartPulse,
  Home,
  Lock,
  Pencil,
  Phone,
  Printer,
  Star,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { STATUS_CONFIG } from "../../constants";
import { useAdmissionsHydrated, useAdmissionsStore } from "../../store/admissions.store";
import type { Admission, AdmissionStatus, ParentInfo } from "../../types/types";
import { PAYMENT_STATUS_BADGE, ageFrom, canDelete, enrolledOn, formatDate, isStatusLocked, paymentStatusOf, slugFor } from "../../utils";
import { AdmissionStatusBadge } from "../AdmissionStatusBadge";
import { RecordPaymentDialog } from "../RecordPaymentDialog";
import { StatusUpdateDialog } from "../StatusUpdateDialog";
import { StudentAvatar } from "../StudentAvatar";
import { ActivityTimeline } from "./ActivityTimeline";
import { ApplicationProgress } from "./ApplicationProgress";
import { DocumentsCard } from "./DocumentsCard";
import { PaymentCard } from "./PaymentCard";

function InfoCard({ icon: Icon, title, badge, children }: { icon: typeof UserRound; title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-soft text-fg-muted">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
        {badge}
      </div>
      {children}
    </Card>
  );
}

function Fields({ items, className }: { items: [string, React.ReactNode][]; className?: string }) {
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

function ParentFields({ person }: { person: ParentInfo | { name: string; relation: string; phone: string; email: string } }) {
  return (
    <Fields
      className="sm:grid-cols-1"
      items={[
        ["Name", person.name],
        ["Mobile", person.phone && <a href={`tel:${person.phone}`} className="hover:text-indigo-600">{person.phone}</a>],
        ["Email", person.email && <a href={`mailto:${person.email}`} className="hover:text-indigo-600">{person.email}</a>],
        ...("occupation" in person ? ([["Occupation", person.occupation], ["NID", person.nid]] as [string, React.ReactNode][]) : []),
      ]}
    />
  );
}

/** Order of the quick status buttons in the header. */
const ACTION_ORDER: AdmissionStatus[] = ["in_review", "waitlisted", "rejected", "approved"];

export function AdmissionDetailsView({ slug }: { slug: string }) {
  const hydrated = useAdmissionsHydrated();
  const admission = useAdmissionsStore((s) => s.admissions.find((a) => slugFor(a) === slug));

  if (!hydrated) return <DetailsSkeleton />;
  if (!admission) {
    return (
      <Card>
        <EmptyState
          icon={FileSearch}
          title="Application not found"
          description="It may have been deleted, or the student's name was changed (the link changes with the name)."
          action={
            <Link href="/admissions" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              Back to admissions
            </Link>
          }
        />
      </Card>
    );
  }
  return <Details admission={admission} />;
}

function Details({ admission: a }: { admission: Admission }) {
  const router = useRouter();
  const remove = useAdmissionsStore((s) => s.remove);
  const [statusTarget, setStatusTarget] = useState<AdmissionStatus | null>(null);
  const [recording, setRecording] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const feeStatus = paymentStatusOf(a);
  const locked = isStatusLocked(a);
  const enrolledDate = enrolledOn(a);
  // After the first payment the decision is final — no status buttons at all.
  const actions = locked ? [] : ACTION_ORDER.filter((s) => s !== a.status);
  const primaryLabel = (who: "father" | "mother" | "guardian") =>
    a.primaryContact === who ? (
      <Badge tone="info" className="ml-auto">
        <Star className="h-3 w-3" /> Receives updates
      </Badge>
    ) : undefined;

  return (
    <div className="animate-fade-up space-y-6">
      <Link href="/admissions" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        All applications
      </Link>

      {/* Header */}
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-linear-to-r from-indigo-500/10 via-violet-500/10 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <StudentAvatar name={a.studentName} photo={a.photo} size="xl" className="ring-4 ring-surface shadow-card" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{a.studentName}</h1>
                <AdmissionStatusBadge status={a.status} enrolled={locked} />
              </div>
              {a.studentNameBn && <p className="mt-0.5 text-sm text-fg-muted" lang="bn">{a.studentNameBn}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">
                <span className="font-mono text-xs font-semibold text-fg-secondary">{a.id}</span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {a.applyingClass} · {a.version} · {a.shift}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Applied {formatDate(a.appliedOn)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={a.source === "online" ? "violet" : "neutral"}>{a.source === "online" ? "Online application" : "Office entry"}</Badge>
                <Badge tone={PAYMENT_STATUS_BADGE[feeStatus].tone}>Fee: {PAYMENT_STATUS_BADGE[feeStatus].label}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:max-w-md lg:justify-end">
            {actions.map((status) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              return (
                <Button
                  key={status}
                  size="md"
                  variant={status === "approved" ? "primary" : "outline"}
                  onClick={() => setStatusTarget(status)}
                  className={cn(status === "rejected" && "text-rose-600 dark:text-rose-400")}
                >
                  <Icon className="h-4 w-4" />
                  {config.action}
                </Button>
              );
            })}
            <Link href={`/admissions/${slugFor(a)}/edit`} className={buttonStyles({ variant: "outline" })}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <ActionMenu
              label="More actions"
              items={[
                ...(locked
                  ? []
                  : [{ label: "Move to pending", icon: STATUS_CONFIG.pending.icon, onSelect: () => setStatusTarget("pending"), disabled: a.status === "pending" }]),
                { label: "Print application", icon: Printer, onSelect: () => window.print() },
                { type: "separator" },
                canDelete(a)
                  ? { label: "Delete application", icon: Trash2, onSelect: () => setConfirmDelete(true), danger: true }
                  : { label: "Delete (has payments)", icon: Trash2, onSelect: () => {}, disabled: true },
              ]}
            />
          </div>
        </div>

        {locked && (
          <div className="relative mt-6 flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <GraduationCap className="h-4 w-4" />
              </span>
              <p className="text-sm text-emerald-700">
                <span className="font-semibold">Enrolled as a student{enrolledDate ? ` on ${formatDate(enrolledDate)}` : ""}.</span>{" "}
                The admission fee payment has started, so this decision is final and the status can no longer be changed.
              </p>
            </div>
            <Link href="/students" className={buttonStyles({ size: "sm", className: "shrink-0" })}>
              <GraduationCap className="h-4 w-4" />
              View in Students
            </Link>
          </div>
        )}
      </Card>

      <ApplicationProgress admission={a} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <InfoCard icon={UserRound} title="Student information">
            <Fields
              items={[
                ["Date of birth", `${formatDate(a.dateOfBirth)} (${ageFrom(a.dateOfBirth)} years)`],
                ["Gender", a.gender],
                ["Blood group", a.bloodGroup],
                ["Religion", a.religion],
                ["Nationality", a.nationality],
                ["Birth certificate no.", a.birthCertificateNo && <span className="font-mono text-xs">{a.birthCertificateNo}</span>],
              ]}
            />
          </InfoCard>

          <InfoCard icon={BookOpen} title="Previous education">
            <Fields
              className="sm:grid-cols-3"
              items={[
                ["School", a.previousSchool],
                ["Last class", a.previousClass],
                ["Result", a.previousResult],
              ]}
            />
          </InfoCard>

          <div className={cn("grid grid-cols-1 gap-6", a.primaryContact === "guardian" ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <InfoCard icon={Users} title="Father" badge={primaryLabel("father")}>
              <ParentFields person={a.father} />
            </InfoCard>
            <InfoCard icon={Users} title="Mother" badge={primaryLabel("mother")}>
              <ParentFields person={a.mother} />
            </InfoCard>
            {a.primaryContact === "guardian" && (
              <InfoCard icon={Phone} title={`Guardian (${a.localGuardian.relation})`} badge={primaryLabel("guardian")}>
                <ParentFields person={a.localGuardian} />
              </InfoCard>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InfoCard icon={Home} title="Address">
              <Fields
                className="sm:grid-cols-1"
                items={[
                  ["Present address", a.presentAddress],
                  ["Permanent address", a.permanentAddress === a.presentAddress ? "Same as present" : a.permanentAddress],
                ]}
              />
            </InfoCard>
            <InfoCard icon={HeartPulse} title="Health & special needs">
              <p className={cn("text-sm", a.medicalNotes ? "text-fg" : "text-fg-subtle")}>{a.medicalNotes || "Nothing reported."}</p>
            </InfoCard>
          </div>

          <DocumentsCard admission={a} />

          {a.internalNotes && (
            <InfoCard icon={Lock} title="Internal notes">
              <p className="whitespace-pre-line text-sm text-fg">{a.internalNotes}</p>
            </InfoCard>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <PaymentCard admission={a} onRecord={() => setRecording(true)} />
          <ActivityTimeline events={a.history} />
        </div>
      </div>

      {statusTarget && <StatusUpdateDialog key={statusTarget} admissions={[a]} status={statusTarget} onClose={() => setStatusTarget(null)} />}
      {recording && <RecordPaymentDialog admission={a} onClose={() => setRecording(false)} />}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          remove([a.id]);
          toast("Application deleted", { description: `${a.studentName}'s application was removed.`, tone: "info" });
          router.push("/admissions");
        }}
        title="Delete this application?"
        description={`${a.studentName}'s application and message history will be permanently removed.`}
        typeToConfirm={a.id}
      />
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading application">
      <div className="h-5 w-32 animate-pulse rounded bg-soft" />
      <Card className="flex items-center gap-5 p-6">
        <div className="h-28 w-28 animate-pulse rounded-2xl bg-soft" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-64 animate-pulse rounded bg-soft" />
          <div className="h-4 w-80 animate-pulse rounded bg-soft" />
        </div>
      </Card>
      <Card className="h-36 animate-pulse" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="h-80 animate-pulse xl:col-span-2" />
        <Card className="h-80 animate-pulse" />
      </div>
    </div>
  );
}
