"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Eye, GraduationCap, Mail, MessageSquareText, Paperclip, Pin, Send, Trash2, Upload, Users, UsersRound, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_OPTIONS, CURRENT_USER, SCHOOL_INFO } from "@/features/admissions/constants";
import { formatFileSize, slugify, smsSegments, uid } from "@/features/admissions/utils";
import { classOrder } from "@/features/classes/demoData/mock-data";
import { addDaysIso } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useNotices, type NoticeView } from "../hooks/use-notices";
import { useNoticeAdminStore } from "../store/notice-admin.store";
import type { Notice, NoticeCategory, NoticeDraft, NoticeGroup, NoticePriority } from "../types/types";
import { CATEGORIES, CATEGORY_STYLE, audienceLabel, noticeHref, nowIso } from "../utils";

const GROUPS: { key: NoticeGroup; label: string; icon: LucideIcon }[] = [
  { key: "students", label: "Students", icon: GraduationCap },
  { key: "parents", label: "Parents", icon: UsersRound },
  { key: "teachers", label: "Teachers", icon: Users },
];

const PRIORITIES: { key: NoticePriority; label: string; on: string }[] = [
  { key: "normal", label: "Normal", on: "bg-surface text-fg shadow-card" },
  { key: "important", label: "Important", on: "bg-amber-500 text-white" },
  { key: "urgent", label: "Urgent", on: "bg-rose-500 text-white" },
];

type When = "now" | "schedule";

const blank = (): NoticeDraft => ({
  title: "",
  body: "",
  category: "General",
  priority: "normal",
  groups: ["students", "parents"],
  classes: [],
  publishAt: null,
  expiresOn: undefined,
  pinned: false,
  sms: false,
  email: true,
  attachment: undefined,
});

/**
 * Write / edit a notice with audience, schedule and delivery, and a live preview.
 * BACKEND: POST /notices · PATCH /notices/:id  (SMS / email are queued when it goes live)
 */
export function NoticeForm({ notice }: { notice?: NoticeView }) {
  const router = useRouter();
  const { notices, reachOf, now } = useNotices();
  const add = useNoticeAdminStore((s) => s.add);
  const update = useNoticeAdminStore((s) => s.update);
  const live = notice && (notice.status === "published" || notice.status === "expired");
  const [value, setValue] = useState<NoticeDraft>(() => (notice ? { ...notice } : blank()));
  const [when, setWhen] = useState<When>(notice?.status === "scheduled" ? "schedule" : "now");
  const [date, setDate] = useState(notice?.status === "scheduled" ? notice.publishAt!.slice(0, 10) : addDaysIso(now.slice(0, 10) || new Date().toISOString().slice(0, 10), 1));
  const [time, setTime] = useState(notice?.status === "scheduled" ? notice.publishAt!.slice(11, 16) : "09:00");
  const [error, setError] = useState("");
  const set = (patch: Partial<NoticeDraft>) => {
    setValue((v) => ({ ...v, ...patch }));
    setError("");
  };

  const reach = reachOf(value);
  const segments = smsSegments(`${value.title}: ${value.body}`.slice(0, 300));
  const classes = [...CLASS_OPTIONS].sort((a, b) => classOrder(a) - classOrder(b));

  async function save(mode: "draft" | "publish") {
    if (value.title.trim().length < 5) return setError("Write a title (at least 5 characters).");
    if (value.body.trim().length < 10) return setError("Write the notice message.");
    if (!value.groups.length) return setError("Choose who should see it.");
    const scheduledAt = `${date}T${time}:00`;
    if (mode === "publish" && !live && when === "schedule" && scheduledAt <= nowIso()) return setError("Pick a future date and time, or publish now.");
    if (value.expiresOn && value.expiresOn < (live ? notice!.publishAt! : when === "schedule" ? scheduledAt : nowIso()).slice(0, 10)) return setError("The expiry date is before the notice goes live.");

    const goingLive = mode === "publish" && !live;
    const ok = await confirmAction({
      title: mode === "draft" ? "Save as draft?" : live ? "Update this notice?" : when === "schedule" ? "Schedule this notice?" : "Publish this notice now?",
      description: goingLive
        ? `It goes to ${reach.total} people${value.sms ? ` · SMS to ${reach.phones} phones` : ""}${value.email ? " · email" : ""}.`
        : live
          ? "Changes appear on every portal right away."
          : "It stays private until you publish it.",
      confirmLabel: mode === "draft" ? "Save draft" : live ? "Update" : when === "schedule" ? "Schedule" : "Publish",
    });
    if (!ok) return;

    const publishAt = live ? notice!.publishAt : mode === "draft" ? null : when === "schedule" ? scheduledAt : nowIso();
    const data = { ...value, title: value.title.trim(), body: value.body.trim(), publishAt };
    let slug = notice?.slug ?? slugify(data.title);
    if (!notice && notices.some((n) => n.slug === slug)) slug = `${slug}-${uid().slice(0, 4).toLowerCase()}`;

    if (notice) update(notice.id, data);
    else {
      const at = new Date().toISOString();
      add({ ...data, id: `NTC-${uid().slice(0, 6).toUpperCase()}`, slug, archived: false, createdBy: CURRENT_USER, createdAt: at, updatedAt: at, custom: true } satisfies Notice);
    }
    const label = mode === "draft" ? "Draft saved" : live ? "Notice updated" : when === "schedule" ? "Notice scheduled" : "Notice published";
    const channels = mode === "publish" && !live && [value.sms && `SMS to ${reach.phones}`, value.email && "email"].filter(Boolean).join(" & ");
    toast(label, { description: channels ? `${data.title} · ${channels}` : data.title });
    router.push(noticeHref({ slug }));
  }

  return (
    <div className="animate-fade-up">
      <Link href={notice ? noticeHref(notice) : "/notices"} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        {notice ? "Back to notice" : "All notices"}
      </Link>
      <PageHeader
        title={notice ? "Edit notice" : "New notice"}
        description={live ? "Changes show on the portal straight away. SMS and email are not sent again." : "Shown on the student, parent and teacher portals — with optional SMS and email."}
        actions={
          <>
            {!live && (
              <Button variant="outline" onClick={() => save("draft")}>
                Save draft
              </Button>
            )}
            <Button onClick={() => save("publish")}>
              {live ? null : when === "schedule" ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {live ? "Save changes" : when === "schedule" ? "Schedule" : "Publish now"}
            </Button>
          </>
        }
      />

      {error && <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30">{error}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Card className="space-y-5 p-5 sm:p-6">
            <FormField label="Title" required>
              <Input value={value.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} placeholder="e.g. Annual sports day on 12 December" />
            </FormField>
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg-secondary">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const Icon = CATEGORY_STYLE[c].icon;
                  const on = value.category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set({ category: c as NoticeCategory, ...(c === "Urgent" && value.priority === "normal" ? { priority: "urgent" as const } : {}) })}
                      aria-pressed={on}
                      className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition", on ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-secondary hover:bg-soft")}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg-secondary">Priority</p>
              <div className="inline-flex rounded-xl bg-soft p-1">
                {PRIORITIES.map((p) => (
                  <button key={p.key} type="button" onClick={() => set({ priority: p.key })} aria-pressed={value.priority === p.key} className={cn("rounded-lg px-3.5 py-1.5 text-xs font-semibold transition", value.priority === p.key ? p.on : "text-fg-muted hover:text-fg")}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <FormField label="Message" required hint="Leave a blank line between paragraphs.">
              <Textarea rows={9} value={value.body} onChange={(e) => set({ body: e.target.value })} placeholder="Write the notice…" />
            </FormField>
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg-secondary">
                Attachment <span className="text-xs font-normal text-fg-subtle">(optional · PDF or image)</span>
              </p>
              {value.attachment ? (
                <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                  <Paperclip className="h-4 w-4 text-fg-subtle" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{value.attachment.name}</span>
                  <span className="text-xs text-fg-muted">{formatFileSize(value.attachment.size)}</span>
                  <button type="button" onClick={() => set({ attachment: undefined })} aria-label="Remove attachment" className="rounded-lg p-1 text-fg-subtle hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-4 text-sm text-fg-muted transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <Upload className="h-4 w-4" />
                  Choose a file
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) set({ attachment: { name: f.name, size: f.size } });
                    }}
                  />
                </label>
              )}
            </div>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Audience</h2>
              <p className="text-xs text-fg-muted">Who sees it on their portal.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {GROUPS.map(({ key, label, icon: Icon }) => {
                const on = value.groups.includes(key);
                const n = reachOf({ groups: [key], classes: value.classes });
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ groups: on ? value.groups.filter((g) => g !== key) : [...value.groups, key] })}
                    className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition", on ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10" : "border-line-strong hover:bg-subtle")}
                  >
                    <Icon className={cn("h-5 w-5", on ? "text-indigo-600" : "text-fg-subtle")} />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-fg">{label}</span>
                      <span className="text-xs text-fg-muted">{n.total} people</span>
                    </span>
                    <span className={cn("h-4 w-4 rounded-full border-2", on ? "border-indigo-500 bg-indigo-500 ring-2 ring-inset ring-white dark:ring-slate-900" : "border-line-strong")} />
                  </button>
                );
              })}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-sm font-medium text-fg-secondary">Classes</p>
                <button type="button" onClick={() => set({ classes: [] })} className={cn("text-xs font-semibold", value.classes.length ? "text-indigo-600 hover:text-indigo-700" : "text-fg-subtle")}>
                  All classes
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {classes.map((c) => {
                  const on = value.classes.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ classes: on ? value.classes.filter((x) => x !== c) : [...value.classes, c] })}
                      className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition", on ? "border-indigo-300 bg-indigo-50 text-indigo-700" : value.classes.length ? "border-line-strong text-fg-muted hover:bg-soft" : "border-line text-fg-secondary hover:bg-soft")}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-fg-subtle">{value.classes.length ? "Only students / parents of these classes. Teachers see every notice sent to them." : "Every class."}</p>
            </div>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">Publishing & delivery</h2>
            {live ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Published — the publish time can no longer change.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ["now", "Publish now", "Goes live as soon as you save", Send],
                    ["schedule", "Schedule", "Goes live at a set time", CalendarClock],
                  ] as const
                ).map(([key, label, hint, Icon]) => (
                  <button key={key} type="button" aria-pressed={when === key} onClick={() => setWhen(key)} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition", when === key ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10" : "border-line-strong hover:bg-subtle")}>
                    <Icon className={cn("mt-0.5 h-4 w-4", when === key ? "text-indigo-600" : "text-fg-subtle")} />
                    <span>
                      <span className="block text-sm font-semibold text-fg">{label}</span>
                      <span className="text-xs text-fg-muted">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {!live && when === "schedule" && (
                <>
                  <FormField label="Date" required>
                    <Input type="date" value={date} min={now.slice(0, 10)} onChange={(e) => (setDate(e.target.value), setError(""))} />
                  </FormField>
                  <FormField label="Time" required>
                    <Input type="time" value={time} onChange={(e) => (setTime(e.target.value), setError(""))} />
                  </FormField>
                </>
              )}
              <FormField label="Remove from board on" hint="Optional expiry">
                <Input type="date" value={value.expiresOn ?? ""} onChange={(e) => set({ expiresOn: e.target.value || undefined })} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["pinned", Pin, "Pin to top", "Stays first on the board"],
                  ["sms", MessageSquareText, "Send SMS", live ? "Only when first published" : `${reach.phones} phones · ${segments} SMS each`],
                  ["email", Mail, "Send email", live ? "Only when first published" : "To everyone with an email"],
                ] as const
              ).map(([key, Icon, label, hint]) => (
                <label key={key} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{label}</span>
                    <span className="block truncate text-[11px] text-fg-muted">{hint}</span>
                  </span>
                  <Switch checked={value[key]} onCheckedChange={(on) => set({ [key]: on })} disabled={live && key !== "pinned"} aria-label={label} />
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <div className="space-y-6 xl:sticky xl:top-24">
            <Card className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
                <Eye className="h-4 w-4 text-fg-muted" />
                Preview
              </h2>
              <p className="text-xs text-fg-muted">How it looks on the portal.</p>
              <Preview value={value} />
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">Reach</h2>
              <p className="text-xs text-fg-muted">{audienceLabel(value)}</p>
              <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-xl border border-line text-center">
                {(
                  [
                    ["Students", reach.students],
                    ["Parents", reach.parents],
                    ["Teachers", reach.teachers],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="px-2 py-3">
                    <dd className="text-xl font-bold tabular-nums text-fg">{v}</dd>
                    <dt className="text-[11px] text-fg-muted">{k}</dt>
                  </div>
                ))}
              </dl>
              {value.sms && (
                <p className="mt-3 text-xs text-fg-muted">
                  SMS: {reach.phones} phone(s) × {segments} = <b className="text-fg">{reach.phones * segments}</b> SMS
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Preview({ value: v }: { value: NoticeDraft }) {
  const style = CATEGORY_STYLE[v.category];
  const Icon = style.icon;
  const paragraphs = v.body.trim() ? v.body.trim().split(/\n\s*\n/) : ["Your message appears here."];
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line">
      <div className={cn("h-1", style.bar)} />
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", style.tile)}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-fg-muted">{SCHOOL_INFO.name}</p>
            <p className="text-[11px] text-fg-subtle">Just now</p>
          </div>
          {v.pinned && <Pin className="h-3.5 w-3.5 text-rose-500" />}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={style.tone}>{v.category}</Badge>
          {v.priority !== "normal" && <Badge tone={v.priority === "urgent" ? "danger" : "warning"}>{v.priority === "urgent" ? "Urgent" : "Important"}</Badge>}
        </div>
        <h3 className={cn("mt-2 font-semibold leading-snug", v.title ? "text-fg" : "text-fg-subtle")}>{v.title || "Notice title"}</h3>
        <div className="mt-2 space-y-2 text-sm text-fg-secondary">
          {paragraphs.map((p, i) => (
            <p key={i} className={cn("whitespace-pre-line", !v.body.trim() && "text-fg-subtle")}>
              {p}
            </p>
          ))}
        </div>
        {v.attachment && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-soft px-2.5 py-1.5 text-xs font-medium text-fg-secondary">
            <Paperclip className="h-3.5 w-3.5" />
            {v.attachment.name}
          </p>
        )}
      </div>
    </div>
  );
}
