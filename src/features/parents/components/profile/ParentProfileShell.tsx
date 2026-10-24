"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BellRing,
  GraduationCap,
  HeartHandshake,
  Home,
  IdCard,
  LogIn,
  Briefcase,
  CalendarClock,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  Link2,
  Mail,
  MessageSquareText,
  Phone,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserPen,
  UserX,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { ProfileHero, type RibbonTone } from "@/components/shared/ProfileHero";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClickOutside } from "@/hooks/use-click-outside";
import { formatDate, formatDateTime, formatTaka } from "@/features/admissions/utils";
import { ACCOUNT_STATUS_LABEL, AccessControlDialog, ResetPasswordDialog } from "@/features/students/components/profile/admin/AccountDialogs";
import { localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";

import { useParent } from "../../hooks/use-parent";
import type { Parent } from "../../types/types";
import { parentHref, type ParentTab } from "../../utils";
import { LinkChildDialog } from "./admin/ChildDialogs";
import { ScheduleMeetingDialog } from "./admin/MeetingDialogs";
import { MessageDialog } from "./admin/MessageDialog";

type TabDef = { tab?: ParentTab; label: string; icon: LucideIcon };

const TABS: TabDef[] = [
  { label: "Overview", icon: LayoutDashboard },
  { tab: "children", label: "Children", icon: Users },
  { tab: "fees", label: "Fees", icon: Wallet },
  { tab: "messages", label: "Messages", icon: MessageSquareText },
  { tab: "meetings", label: "Meetings", icon: CalendarClock },
  { tab: "account", label: "Account", icon: ShieldCheck },
];

type ManageAction = "message" | "meeting" | "link" | "password" | "status";

/** Header + tab navigation shared by every /parents/[slug]/* page. */
export function ParentProfileShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const data = useParent(slug);
  const { hydrated, parent } = data;
  const [action, setAction] = useState<ManageAction | null>(null);

  if (!hydrated) return <ProfileSkeleton />;
  if (!parent || !data.account || !data.subject || !data.meetings || !data.teacherOf) {
    return (
      <Card>
        <EmptyState
          icon={UserX}
          title="Guardian not found"
          description="The link may be outdated — the URL changes when the guardian's name or mobile number is edited, or when they're unlinked from every child."
          action={
            <Link href="/parents" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All guardians
            </Link>
          }
        />
      </Card>
    );
  }

  const { account, meetings, outstanding = 0 } = data;
  const restricted = account.status !== "active";
  const upcoming = meetings.filter((m) => m.status === "scheduled" && m.date >= localToday()).at(-1);
  const current = parent.links.filter((l) => l.student.status !== "left");

  const CHANNEL = { sms: "SMS", email: "Email", both: "SMS + Email" } as const;
  const ribbon: { label: string; icon: LucideIcon; tone: RibbonTone } = parent.inactive
    ? { label: "Former", icon: UserX, tone: "neutral" }
    : account.status === "suspended"
      ? { label: "Suspended", icon: ShieldAlert, tone: "warning" }
      : restricted
        ? { label: ACCOUNT_STATUS_LABEL[account.status], icon: ShieldAlert, tone: "danger" }
        : { label: "Active", icon: ShieldCheck, tone: "success" };

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/parents" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          All guardians
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin view · full access
        </span>
      </div>

      <ProfileHero
        role="guardian"
        avatar={<Avatar name={parent.name} size="lg" className="h-24 w-24 bg-amber-50 text-2xl text-amber-700 sm:h-28 sm:w-28" />}
        name={parent.name}
        code={parent.id}
        ribbon={ribbon}
        badges={
          <>
            {parent.roles.map((r) => (
              <Badge key={r} tone="info">
                {r}
              </Badge>
            ))}
            {!parent.inactive && restricted && account.status === "suspended" && <Badge tone="warning">Until {formatDate(account.suspendedUntil!)}</Badge>}
            {outstanding > 0 && <Badge tone="danger">Family dues {formatTaka(outstanding)}</Badge>}
            {upcoming && <Badge tone="violet">Meeting {formatDate(upcoming.date)}</Badge>}
          </>
        }
        actions={
          <>
            <a href={`tel:${parent.phone}`} className={buttonStyles({ variant: "outline", size: "icon" })} aria-label={`Call ${parent.phone}`} title={parent.phone}>
              <Phone className="h-4 w-4" />
            </a>
            <button type="button" onClick={() => setAction("message")} className={buttonStyles({ variant: "outline" })}>
              <MessageSquareText className="h-4 w-4" />
              Message
            </button>
            <Link href={parentHref(parent, "edit")} className={buttonStyles({ variant: "outline" })}>
              <UserPen className="h-4 w-4" />
              Edit
            </Link>
            <ManageMenu onSelect={setAction} restricted={restricted} />
          </>
        }
        columns={[
          [
            { icon: IdCard, label: "Guardian ID", value: parent.id },
            { icon: HeartHandshake, label: "Relation", value: [...new Set(parent.links.map((l) => l.relation))].join(" / ") },
            { icon: Briefcase, label: "Occupation", value: parent.occupation },
          ],
          [
            { icon: Phone, label: "Mobile", value: parent.phone },
            { icon: Mail, label: "Email", value: parent.email },
            { icon: BellRing, label: "Preferred channel", value: data.profile ? `${CHANNEL[data.profile.preferredChannel]} · ${data.profile.language}` : "" },
          ],
          [
            { icon: Users, label: "Children", value: `${current.length} at school${parent.links.length > current.length ? ` · ${parent.links.length - current.length} left` : ""}` },
            {
              icon: GraduationCap,
              label: "Classes",
              value: current.map((l) => `${l.student.name.split(" ")[0]} (${l.student.className.replace("Class ", "C-")} ${l.student.section})`).join(", "),
            },
            {
              icon: Wallet,
              label: "Family dues",
              value: outstanding > 0 ? <span className="text-rose-600">{formatTaka(outstanding)}</span> : <span className="text-emerald-600">All paid</span>,
            },
          ],
          [
            { icon: Home, label: "Address", value: parent.address },
            { icon: KeyRound, label: "Portal username", value: account.username },
            { icon: LogIn, label: "Last login", value: formatDateTime(account.lastLoginAt) },
          ],
        ]}
      />

      <Suspense fallback={<TabsNav parent={parent} pathname="" />}>
        <ActiveTabsNav parent={parent} />
      </Suspense>

      {children}

      {action === "message" && <MessageDialog recipients={[parent]} onClose={() => setAction(null)} />}
      {action === "meeting" && <ScheduleMeetingDialog parent={parent} teacherOf={data.teacherOf} onClose={() => setAction(null)} />}
      {action === "link" && <LinkChildDialog parent={parent} students={data.students} guardiansByStudent={data.guardiansByStudent} onClose={() => setAction(null)} />}
      {action === "password" && <ResetPasswordDialog subject={data.subject} account={account} onClose={() => setAction(null)} />}
      {action === "status" && <AccessControlDialog subject={data.subject} account={account} onClose={() => setAction(null)} />}
    </div>
  );
}

function ManageMenu({ onSelect, restricted }: { onSelect: (a: ManageAction) => void; restricted: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const items: { action: ManageAction; label: string; hint: string; icon: LucideIcon; danger?: boolean }[] = [
    { action: "meeting", label: "Schedule meeting", hint: "Parent–teacher meeting with SMS invitation", icon: CalendarClock },
    { action: "link", label: "Link a child", hint: "Sibling or another student", icon: Link2 },
    { action: "password", label: "Reset password", hint: "New guardian-portal password by SMS", icon: KeyRound },
    {
      action: "status",
      label: restricted ? "Restore portal access" : "Suspend / block / disable",
      hint: restricted ? "Allow sign-in again" : "Stop guardian-portal sign-in",
      icon: ShieldAlert,
      danger: !restricted,
    },
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

function ActiveTabsNav(props: { parent: Parent }) {
  return <TabsNav {...props} pathname={usePathname()} />;
}

function TabsNav({ parent, pathname }: { parent: Parent; pathname: string }) {
  return (
    <nav aria-label="Guardian sections" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] print:hidden">
      <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card lg:min-w-0">
        {TABS.map(({ tab, label, icon: Icon }) => {
          const href = parentHref(parent, tab);
          const active = pathname === href || (!tab && pathname === parentHref(parent, "edit"));
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
              {tab === "children" && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-soft text-fg-muted")}>{parent.links.length}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading guardian">
      <div className="h-5 w-28 animate-pulse rounded bg-soft" />
      <Card className="overflow-hidden">
        <div className="h-28 animate-pulse bg-soft" />
        <div className="flex items-end gap-4 px-6 pb-6">
          <div className="-mt-12 h-28 w-28 animate-pulse rounded-2xl bg-soft ring-4 ring-surface" />
          <div className="space-y-2">
            <div className="h-7 w-56 animate-pulse rounded bg-soft" />
            <div className="h-4 w-80 animate-pulse rounded bg-soft" />
          </div>
        </div>
      </Card>
      <div className="h-14 animate-pulse rounded-2xl bg-soft" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-[360px] animate-pulse" />
        <Card className="h-[360px] animate-pulse lg:col-span-2" />
      </div>
    </div>
  );
}
