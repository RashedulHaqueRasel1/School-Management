"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Armchair,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Clock,
  DoorOpen,
  GraduationCap,
  Languages,
  LayoutDashboard,
  ListOrdered,
  Phone,
  Settings2,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
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
import { ACADEMIC_SESSION } from "@/features/admissions/constants";
import { SHIFTS, localToday, minutesToTime } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { sectionCode, sectionLabel } from "../../demoData/mock-data";
import { useSection } from "../../hooks/use-section";
import { useSectionActions } from "../../hooks/use-section-actions";
import { useClassAdminStore } from "../../store/class-admin.store";
import type { ClassSection } from "../../types/types";
import { sectionHref, type SectionTab } from "../../utils";
import { ClassTeacherDialog } from "./admin/SectionDialogs";

type TabDef = { tab?: SectionTab; label: string; icon: LucideIcon };

const TABS: TabDef[] = [
  { label: "Overview", icon: LayoutDashboard },
  { tab: "students", label: "Students", icon: Users },
  { tab: "subjects", label: "Subjects & Teachers", icon: BookOpen },
  { tab: "routine", label: "Routine", icon: CalendarDays },
  { tab: "attendance", label: "Attendance", icon: CalendarCheck },
  { tab: "settings", label: "Settings", icon: Settings2 },
];

type ManageAction = "teacher" | "rolls" | "archive" | "restore" | "delete";

/** Header + tabs shared by every /classes/[slug]/* page. */
export function SectionShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const data = useSection(slug);
  const { hydrated, section } = data;
  const actions = useSectionActions();
  const archive = useClassAdminStore((s) => s.archive);
  const restore = useClassAdminStore((s) => s.restore);
  const removeSection = useClassAdminStore((s) => s.removeSection);
  const router = useRouter();
  const [action, setAction] = useState<ManageAction | null>(null);

  if (!hydrated) return <Skeleton />;
  if (!section || !data.members) {
    return (
      <Card>
        <EmptyState
          icon={GraduationCap}
          title="Section not found"
          description="It may have been renamed, or the link is outdated."
          action={
            <Link href="/classes" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All classes
            </Link>
          }
        />
      </Card>
    );
  }

  const today = localToday();
  const { members } = data;
  const boys = section.students.filter((s) => s.gender === "Male").length;
  const marked = members.map((m) => m.profile.attendance.find((d) => d.date === today)).filter(Boolean);
  const present = marked.filter((d) => d!.status === "present" || d!.status === "late").length;
  const offToday = marked.length > 0 && marked.every((d) => d!.status === "weekend" || d!.status === "holiday");
  const preset = SHIFTS[section.settings.shift] ?? SHIFTS.Morning!;
  const full = section.students.length >= section.settings.capacity;
  const ribbon: { label: string; icon: LucideIcon; tone: RibbonTone } = section.archived
    ? { label: "Archived", icon: Archive, tone: "neutral" }
    : full
      ? { label: "Full", icon: Armchair, tone: "warning" }
      : { label: "Open", icon: ShieldCheck, tone: "success" };

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/classes" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          All classes
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin view · full access
        </span>
      </div>

      <ProfileHero
        role="section"
        avatar={
          <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-sky-50 text-3xl font-black tracking-tight text-sky-700 sm:h-28 sm:w-28">
            {sectionCode(section.className, section.section)}
          </span>
        }
        name={sectionLabel(section.className, section.section)}
        code={section.settings.room}
        ribbon={ribbon}
        badges={
          <>
            <Badge tone="info">{section.level}</Badge>
            {section.custom && <Badge tone="violet">Added by admin</Badge>}
            {section.students.length > section.settings.capacity && <Badge tone="danger">Over capacity</Badge>}
          </>
        }
        actions={
          <>
            <Link href={sectionHref(section, "attendance")} className={buttonStyles({ variant: "outline" })}>
              <CalendarCheck className="h-4 w-4" />
              Attendance
            </Link>
            <Link href="/admissions/new-application" className={buttonStyles({ variant: "outline", size: "icon" })} aria-label="Admit a student" title="Admit a student">
              <UserPlus className="h-4 w-4" />
            </Link>
            <ManageMenu
              archived={section.archived}
              custom={section.custom}
              onSelect={async (a) => {
                if (a !== "restore") return setAction(a);
                const ok = await confirmAction({ title: "Restore this section?", description: `${sectionLabel(section.className, section.section)} will appear in the class list and section pickers again.`, confirmLabel: "Restore" });
                if (!ok) return;
                restore(section.key);
                toast("Section restored");
              }}
            />
          </>
        }
        columns={[
          [
            { icon: GraduationCap, label: "Class", value: section.className },
            { icon: Users, label: "Section", value: section.section },
            { icon: CalendarRange, label: "Session", value: ACADEMIC_SESSION },
          ],
          [
            { icon: DoorOpen, label: "Room", value: section.settings.room },
            { icon: Clock, label: "Shift", value: `${section.settings.shift} · ${minutesToTime(preset.start)} – ${minutesToTime(preset.end)}` },
            { icon: Languages, label: "Version", value: `${section.settings.version} version` },
          ],
          [
            { icon: UserRound, label: "Class teacher", value: section.classTeacher.name },
            { icon: Phone, label: "Teacher mobile", value: section.classTeacher.phone },
            { icon: BookOpen, label: "Subjects", value: `${data.subjects?.length ?? 0} subjects` },
          ],
          [
            { icon: Armchair, label: "Students / seats", value: `${section.students.length} / ${section.settings.capacity}` },
            { icon: Users, label: "Boys · girls", value: `${boys} · ${section.students.length - boys}` },
            {
              icon: CalendarCheck,
              label: "Present today",
              value: offToday ? "Day off" : marked.length ? `${present} of ${section.students.length}` : "Not taken yet",
            },
          ],
        ]}
        footer={
          section.archived && (
            <p className="text-sm text-fg-secondary">
              <span className="font-semibold text-fg">Archived section.</span> It no longer appears in the class list or the student section pickers. Restore it from Manage.
            </p>
          )
        }
      />

      <Suspense fallback={<TabsNav section={section} pathname="" />}>
        <ActiveTabsNav section={section} />
      </Suspense>

      {children}

      {action === "teacher" && <ClassTeacherDialog section={section} teachers={data.teachers} sections={data.sections} onClose={() => setAction(null)} />}
      <ConfirmDialog
        open={action === "rolls"}
        onClose={() => setAction(null)}
        title="Re-assign roll numbers?"
        description={`Roll 1–${section.students.length} in alphabetical order. Students and guardians see the new roll on their profiles.`}
        confirmLabel="Re-assign"
        tone="primary"
        onConfirm={() => {
          actions.renumber(section, "name");
          toast("Roll numbers re-assigned");
          setAction(null);
        }}
      />
      <ConfirmDialog
        open={action === "archive"}
        onClose={() => setAction(null)}
        title={section.students.length ? "Move students out first" : "Archive this section?"}
        description={
          section.students.length
            ? `${section.students.length} student(s) are still in this section. Move them from the Students tab, then archive.`
            : "The section is hidden from lists and pickers. History is kept and it can be restored."
        }
        confirmLabel={section.students.length ? "OK" : "Archive"}
        tone={section.students.length ? "primary" : "danger"}
        onConfirm={() => {
          if (section.students.length === 0) {
            archive(section.key, "Archived by admin");
            toast("Section archived");
          }
          setAction(null);
        }}
      />
      <ConfirmDialog
        open={action === "delete"}
        onClose={() => setAction(null)}
        title={section.students.length ? "Move students out first" : "Delete this section?"}
        description={
          section.students.length
            ? `${section.students.length} student(s) are still in ${sectionLabel(section.className, section.section)}. Move them to another section from the Students tab, then delete.`
            : `${sectionLabel(section.className, section.section)} — its room, settings and routine edits are removed for good. Use Archive instead if you may need it again.`
        }
        confirmLabel={section.students.length ? "OK" : "Delete section"}
        tone={section.students.length ? "primary" : "danger"}
        typeToConfirm={section.students.length ? undefined : deleteName(section)}
        onConfirm={() => {
          if (section.students.length) return setAction(null);
          removeSection(section.key);
          toast("Section deleted", { description: sectionLabel(section.className, section.section) });
          router.push("/classes");
        }}
      />
    </div>
  );
}

/** What the admin types to delete a section, e.g. "Class 6 C". */
export const deleteName = (s: Pick<ClassSection, "className" | "section">) => `${s.className} ${s.section}`;

function ManageMenu({ onSelect, archived, custom }: { onSelect: (a: ManageAction) => void; archived: boolean; custom: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const items: { action: ManageAction; label: string; hint: string; icon: LucideIcon; danger?: boolean }[] = [
    { action: "teacher", label: "Change class teacher", hint: "Updates every student and the teacher", icon: UserRound },
    { action: "rolls", label: "Re-assign roll numbers", hint: "1…n in alphabetical order", icon: ListOrdered },
    archived
      ? { action: "restore", label: "Restore section", hint: "Show it in lists again", icon: ArchiveRestore }
      : { action: "archive", label: "Archive section", hint: "Only when it has no students", icon: Archive, danger: true },
    ...(custom ? [{ action: "delete" as const, label: "Delete section", hint: "Added by mistake? Remove it for good", icon: Trash2, danger: true }] : []),
  ];
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={buttonStyles()}>
        <Settings2 className="h-4 w-4" />
        Manage
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 origin-top-right animate-dropdown rounded-2xl border border-line bg-surface p-1.5 shadow-popover">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.action}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect(item.action);
                }}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-soft"
              >
                <Icon className={cn("mt-0.5 h-4 w-4", item.danger ? "text-rose-500" : "text-fg-subtle")} />
                <span>
                  <span className={cn("block text-sm font-medium", item.danger ? "text-rose-600 dark:text-rose-400" : "text-fg")}>{item.label}</span>
                  <span className="block text-xs text-fg-muted">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActiveTabsNav(props: { section: ClassSection }) {
  return <TabsNav {...props} pathname={usePathname()} />;
}

function TabsNav({ section, pathname }: { section: ClassSection; pathname: string }) {
  return (
    <nav aria-label="Section pages" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ tab, label, icon: Icon }) => {
          const href = sectionHref(section, tab);
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
              {tab === "students" && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-soft text-fg-muted")}>{section.students.length}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading section">
      <div className="h-5 w-28 animate-pulse rounded bg-soft" />
      <Card className="h-56 animate-pulse" />
      <div className="h-14 animate-pulse rounded-2xl bg-soft" />
      <Card className="h-80 animate-pulse" />
    </div>
  );
}
