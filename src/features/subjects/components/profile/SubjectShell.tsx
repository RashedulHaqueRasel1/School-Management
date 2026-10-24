"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Award,
  BookOpen,
  BookOpenCheck,
  ChevronDown,
  Clock,
  GraduationCap,
  Hash,
  LayoutDashboard,
  ListChecks,
  School,
  Settings2,
  ShieldCheck,
  Tag,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProfileHero, type RibbonTone } from "@/components/shared/ProfileHero";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { classRange } from "../../demoData/catalog";
import { useSubject } from "../../hooks/use-subject";
import type { SubjectSummary } from "../../hooks/use-subjects";
import { useSubjectAdminStore } from "../../store/subject-admin.store";
import { TYPE_ACCENT, TYPE_TONE, subjectHref, type SubjectTab } from "../../utils";

type TabDef = { tab?: SubjectTab; label: string; icon: LucideIcon };

const TABS: TabDef[] = [
  { label: "Overview", icon: LayoutDashboard },
  { tab: "classes", label: "Classes & Teachers", icon: School },
  { tab: "syllabus", label: "Syllabus", icon: ListChecks },
  { tab: "results", label: "Results", icon: Award },
  { tab: "settings", label: "Settings", icon: Settings2 },
];

/** Header + tabs shared by every /subjects/[slug]/* page. */
export function SubjectShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const data = useSubject(slug);
  const { hydrated, subject } = data;
  const archive = useSubjectAdminStore((s) => s.archive);
  const restore = useSubjectAdminStore((s) => s.restore);
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (!hydrated) return <Skeleton />;
  if (!subject || !data.teaching || !data.syllabus) {
    return (
      <Card>
        <EmptyState
          icon={BookOpen}
          title="Subject not found"
          description="The link may be outdated."
          action={
            <Link href="/subjects" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All subjects
            </Link>
          }
        />
      </Card>
    );
  }

  const topics = subject.classes.flatMap((c) => data.syllabus!(c).topics);
  const progress = topics.length ? Math.round((topics.filter((t) => t.status === "completed").length / topics.length) * 100) : 0;
  const ribbon: { label: string; icon: LucideIcon; tone: RibbonTone } = subject.archived
    ? { label: "Archived", icon: Archive, tone: "neutral" }
    : subject.custom
      ? { label: "Extra", icon: Tag, tone: "violet" }
      : { label: "Curriculum", icon: ShieldCheck, tone: "success" };

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/subjects" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          All subjects
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin view · full access
        </span>
      </div>

      <ProfileHero
        role="subject"
        avatar={<span className={cn("flex h-24 w-24 items-center justify-center rounded-2xl font-mono text-2xl font-black sm:h-28 sm:w-28", TYPE_ACCENT[subject.type])}>{subject.code}</span>}
        name={subject.name}
        code={subject.code}
        ribbon={ribbon}
        badges={
          <>
            <Badge tone={TYPE_TONE[subject.type]}>{subject.type}</Badge>
            {subject.teachers.length === 0 && <Badge tone="warning">No qualified teacher</Badge>}
            {subject.average !== undefined && subject.average < 50 && <Badge tone="danger">Low results</Badge>}
          </>
        }
        actions={
          <>
            <Link href={subjectHref(subject, "classes")} className={buttonStyles({ variant: "outline" })}>
              <UserCheck className="h-4 w-4" />
              Assign teachers
            </Link>
            <ManageMenu
              archived={subject.archived}
              onArchive={() => setConfirmArchive(true)}
              onRestore={() => {
                restore(subject.name);
                toast("Subject restored");
              }}
              settingsHref={subjectHref(subject, "settings")}
            />
          </>
        }
        columns={columns(subject, data.teaching.length, progress)}
        footer={subject.description && <p className="text-sm text-fg-secondary">{subject.description}</p>}
      />

      <Suspense fallback={<TabsNav slug={subject.slug} pathname="" />}>
        <ActiveTabsNav slug={subject.slug} />
      </Suspense>

      {children}

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archive this subject?"
        description="It's hidden from the subject list and pickers. Students who already study it keep their records. You can restore it any time."
        confirmLabel="Archive"
        onConfirm={() => {
          archive(subject.name, "Archived by admin");
          toast("Subject archived");
          setConfirmArchive(false);
        }}
      />
    </div>
  );
}

function columns(s: SubjectSummary, sections: number, progress: number) {
  return [
    [
      { icon: Hash, label: "Subject code", value: s.code },
      { icon: Tag, label: "Type", value: s.type },
      { icon: GraduationCap, label: "Taught in", value: classRange(s.classes) },
    ],
    [
      { icon: Clock, label: "Periods / week", value: `${s.periodsPerWeek} per section` },
      { icon: Target, label: "Full · pass marks", value: `${s.fullMarks} · ${s.passMarks}` },
      { icon: School, label: "Sections", value: `${sections} section${sections === 1 ? "" : "s"}` },
    ],
    [
      { icon: Users, label: "Students", value: `${s.learners.length} studying` },
      { icon: UserCheck, label: "Qualified teachers", value: s.teachers.length ? s.teachers.map((t) => t.name).join(", ") : "None yet" },
      { icon: BookOpenCheck, label: "Syllabus covered", value: `${progress}% (all classes)` },
    ],
    [
      { icon: TrendingUp, label: "Latest average", value: s.average === undefined ? "No results yet" : `${Math.round(s.average)}%` },
      { icon: Award, label: "Pass rate", value: s.passRate === undefined ? "—" : `${Math.round(s.passRate)}%` },
      { icon: ListChecks, label: "Latest exam", value: s.latestExam ?? "—" },
    ],
  ];
}

function ManageMenu({ archived, onArchive, onRestore, settingsHref }: { archived: boolean; onArchive: () => void; onRestore: () => void; settingsHref: string }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={buttonStyles()}>
        <Settings2 className="h-4 w-4" />
        Manage
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 origin-top-right animate-dropdown rounded-2xl border border-line bg-surface p-1.5 shadow-popover">
          <Link href={settingsHref} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-soft">
            <Settings2 className="mt-0.5 h-4 w-4 text-fg-subtle" />
            <span>
              <span className="block text-sm font-medium text-fg">Edit subject</span>
              <span className="block text-xs text-fg-muted">Code, type, marks, periods, classes</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (archived) onRestore();
              else onArchive();
            }}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-soft"
          >
            {archived ? <ArchiveRestore className="mt-0.5 h-4 w-4 text-fg-subtle" /> : <Archive className="mt-0.5 h-4 w-4 text-rose-500" />}
            <span>
              <span className={cn("block text-sm font-medium", archived ? "text-fg" : "text-rose-600 dark:text-rose-400")}>{archived ? "Restore subject" : "Archive subject"}</span>
              <span className="block text-xs text-fg-muted">{archived ? "Show it in lists again" : "Hide from lists; records are kept"}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function ActiveTabsNav({ slug }: { slug: string }) {
  return <TabsNav slug={slug} pathname={usePathname()} />;
}

function TabsNav({ slug, pathname }: { slug: string; pathname: string }) {
  return (
    <nav aria-label="Subject pages" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ tab, label, icon: Icon }) => {
          const href = subjectHref({ slug }, tab);
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow" : "text-fg-muted hover:bg-soft hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading subject">
      <div className="h-5 w-28 animate-pulse rounded bg-soft" />
      <Card className="h-56 animate-pulse" />
      <div className="h-14 animate-pulse rounded-2xl bg-soft" />
      <Card className="h-80 animate-pulse" />
    </div>
  );
}
