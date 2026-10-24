"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, ArrowLeft, CalendarClock, Copy, Eye, Mail, Megaphone, MessageSquareText, Paperclip, Pencil, Pin, PinOff, Printer, Send, Trash2, type LucideIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENT_USER, SCHOOL_INFO } from "@/features/admissions/constants";
import { formatDate, formatDateTime, formatFileSize, uid } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useNotices, type NoticeView } from "../hooks/use-notices";
import { useNoticeAdminStore } from "../store/notice-admin.store";
import { CATEGORY_STYLE, STATUS_STYLE, audienceLabel, noticeHref, noticePrintHref, nowIso, relativeTime } from "../utils";

/**
 * One notice: the message as it appears on the portal, delivery and read
 * stats, and admin actions. BACKEND: GET /notices/by-slug/:slug · GET /notices/:id/stats
 */
export function NoticeDetailView({ slug }: { slug: string }) {
  const { notices, hydrated, now } = useNotices();
  const notice = notices.find((n) => n.slug === slug);
  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-soft" />;
  if (!notice) {
    return (
      <Card>
        <EmptyState
          icon={Megaphone}
          title="Notice not found"
          description="It may have been deleted, or the link is outdated."
          action={
            <Link href="/notices" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All notices
            </Link>
          }
        />
      </Card>
    );
  }
  return <Detail notice={notice} now={now} slugs={notices.map((n) => n.slug)} />;
}

function Detail({ notice: n, now, slugs }: { notice: NoticeView; now: string; slugs: string[] }) {
  const router = useRouter();
  const update = useNoticeAdminStore((s) => s.update);
  const add = useNoticeAdminStore((s) => s.add);
  const remove = useNoticeAdminStore((s) => s.remove);
  const [confirm, setConfirm] = useState<"delete" | "publish" | null>(null);
  const style = CATEGORY_STYLE[n.category];
  const Icon = style.icon;
  const status = STATUS_STYLE[n.status];
  const went = n.status === "published" || n.status === "expired" || n.status === "archived";
  const rate = n.reach.total ? Math.round((n.seen / n.reach.total) * 100) : 0;

  function duplicate() {
    let slug = `${n.slug}-copy`;
    while (slugs.includes(slug)) slug = `${n.slug}-copy-${uid().slice(0, 3).toLowerCase()}`;
    const at = new Date().toISOString();
    add({ ...n, id: `NTC-${uid().slice(0, 6).toUpperCase()}`, slug, title: `${n.title} (copy)`, publishAt: null, pinned: false, archived: false, createdBy: CURRENT_USER, createdAt: at, updatedAt: at, custom: true });
    toast("Notice duplicated", { description: "Saved as a draft — edit and publish it." });
    router.push(noticeHref({ slug }, true));
  }

  const actions: { label: string; icon: LucideIcon; onClick: () => void; danger?: boolean; hidden?: boolean }[] = [
    { label: n.pinned ? "Unpin" : "Pin to top", icon: n.pinned ? PinOff : Pin, onClick: () => (update(n.id, { pinned: !n.pinned }), toast(n.pinned ? "Unpinned" : "Pinned to the top")), hidden: n.archived },
    { label: "Duplicate", icon: Copy, onClick: duplicate },
    {
      label: n.archived ? "Restore" : "Archive",
      icon: n.archived ? ArchiveRestore : Archive,
      onClick: () => (update(n.id, { archived: !n.archived, pinned: false }), toast(n.archived ? "Notice restored" : "Notice archived", { description: n.archived ? undefined : "Removed from the portal board." })),
    },
    { label: "Delete", icon: Trash2, onClick: () => setConfirm("delete"), danger: true },
  ];

  const breakdown = (
    [
      ["Students", n.reach.students],
      ["Parents", n.reach.parents],
      ["Teachers", n.reach.teachers],
    ] as const
  ).filter(([, v]) => v > 0);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/notices" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          All notices
        </Link>
        <div className="flex flex-wrap gap-2">
          <a href={noticePrintHref(n)} target="_blank" rel="noopener" className={buttonStyles({ variant: "outline" })}>
            <Printer className="h-4 w-4" />
            Print
          </a>
          {(n.status === "draft" || n.status === "scheduled") && (
            <Button variant="outline" onClick={() => setConfirm("publish")}>
              <Send className="h-4 w-4" />
              Publish now
            </Button>
          )}
          <Link href={noticeHref(n, true)} className={buttonStyles()}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="relative overflow-hidden xl:col-span-2">
          <div className={cn("h-1.5", style.bar)} />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", style.tile)}>
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={style.tone}>{n.category}</Badge>
                  {n.priority !== "normal" && <Badge tone={n.priority === "urgent" ? "danger" : "warning"}>{n.priority === "urgent" ? "Urgent" : "Important"}</Badge>}
                  <Badge tone={status.tone} dot>
                    {status.label}
                  </Badge>
                  {n.pinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-xl font-bold leading-snug tracking-tight text-fg sm:text-2xl">{n.title}</h1>
                <p className="mt-1 text-sm text-fg-muted">
                  {SCHOOL_INFO.name} · {n.createdBy} · {n.publishAt ? formatDateTime(n.publishAt) : "Not published"}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 border-t border-line pt-6 text-[15px] leading-relaxed text-fg-secondary">
              {n.body.split(/\n\s*\n/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
            {n.attachment && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Paperclip className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{n.attachment.name}</p>
                  <p className="text-xs text-fg-muted">{formatFileSize(n.attachment.size)}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {(
                [
                  ["Status", n.status === "scheduled" ? `Goes live ${relativeTime(n.publishAt!, now)}` : n.status === "published" ? `Live since ${relativeTime(n.publishAt!, now)}` : status.label],
                  ["Publish time", n.publishAt ? formatDateTime(n.publishAt) : "—"],
                  ["Removed on", n.expiresOn ? formatDate(n.expiresOn) : "Stays until archived"],
                  ["Audience", audienceLabel(n)],
                  ["Last edited", relativeTime(n.updatedAt, nowIso())],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className="text-right font-medium text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
              <Eye className="h-4 w-4 text-fg-muted" />
              Delivery
            </h2>
            {went ? (
              <>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-bold tabular-nums text-fg">{rate}%</p>
                  <p className="text-xs text-fg-muted">
                    seen by {n.seen} of {n.reach.total}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {breakdown.map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="text-fg-secondary">{k}</span>
                      <span className="tabular-nums text-fg-muted">
                        {Math.round((v * rate) / 100)} / {v}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-subtle px-3 py-3 text-sm text-fg-muted">
                <CalendarClock className="h-4 w-4" />
                {n.status === "draft" ? "Not sent — still a draft." : `Will reach ${n.reach.total} people when it goes live.`}
              </p>
            )}
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <p className="flex items-center gap-2 text-fg-secondary">
                <MessageSquareText className={cn("h-4 w-4", n.sms ? "text-emerald-600" : "text-fg-subtle")} />
                {n.sms ? (went ? `SMS sent to ${n.reach.phones} phones` : `SMS to ${n.reach.phones} phones`) : "No SMS"}
              </p>
              <p className="flex items-center gap-2 text-fg-secondary">
                <Mail className={cn("h-4 w-4", n.email ? "text-sky-600" : "text-fg-subtle")} />
                {n.email ? (went ? "Emailed to everyone with an address" : "Email when it goes live") : "No email"}
              </p>
            </div>
          </Card>

          <Card className="p-2">
            {actions
              .filter((a) => !a.hidden)
              .map(({ label, icon: AIcon, onClick, danger }) => (
                <button key={label} type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-soft">
                  <AIcon className={cn("h-4 w-4", danger ? "text-rose-500" : "text-fg-subtle")} />
                  <span className={danger ? "text-rose-600 dark:text-rose-400" : "text-fg"}>{label}</span>
                </button>
              ))}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        title="Delete this notice?"
        description={went ? "It disappears from every portal. Archive it instead to keep a record." : "The notice is removed. This cannot be undone."}
        onConfirm={() => {
          remove(n.id);
          toast("Notice deleted");
          router.push("/notices");
        }}
      />
      <ConfirmDialog
        open={confirm === "publish"}
        onClose={() => setConfirm(null)}
        title="Publish now?"
        description={`It goes live for ${n.reach.total} people${n.sms ? ` and an SMS goes to ${n.reach.phones} phones` : ""}.`}
        confirmLabel="Publish"
        onConfirm={() => {
          update(n.id, { publishAt: nowIso() });
          toast("Notice published", { description: n.title });
          setConfirm(null);
        }}
      />
    </div>
  );
}
