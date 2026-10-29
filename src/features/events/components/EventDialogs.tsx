"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, Clock, Copy, Landmark, MapPin, Megaphone, Pencil, Trash2, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_OPTIONS, CURRENT_USER } from "@/features/admissions/constants";
import { slugify, uid } from "@/features/admissions/utils";
import { classOrder } from "@/features/classes/demoData/mock-data";
import { useNoticeAdminStore } from "@/features/notices/store/notice-admin.store";
import type { NoticeCategory, NoticeGroup } from "@/features/notices/types/types";
import { GROUP_LABEL, nowIso } from "@/features/notices/utils";
import { localToday } from "@/features/students/demoData/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useCalendar } from "../hooks/use-calendar";
import { useEventAdminStore } from "../store/event-admin.store";
import { useEventsUi } from "../store/events-ui.store";
import type { CalendarItem, EventCategory, EventDraft } from "../types/types";
import { CATEGORY_STYLE, EDITABLE_CATEGORIES, dayCount, whenLabel } from "../utils";

const NOTICE_CATEGORY: Record<EventCategory, NoticeCategory> = {
  Holiday: "Holiday",
  Academic: "Academic",
  Exam: "Exam",
  Sports: "Event",
  Cultural: "Event",
  Trip: "Event",
  Meeting: "General",
  Other: "General",
};

/** Mounted once by the Events shell — shows whichever event dialog is open. */
export function EventDialogs() {
  const dialog = useEventsUi((s) => s.dialog);
  const open = useEventsUi((s) => s.open);
  const { items } = useCalendar();
  if (!dialog) return null;
  const close = () => open(null);
  if (dialog.mode === "new") return <EventFormDialog initial={{ date: dialog.date, category: dialog.category }} items={items} onClose={close} />;
  const item = items.find((i) => i.id === dialog.id);
  if (!item) return null;
  if (dialog.mode === "edit" && item.source === "school") return <EventFormDialog key={item.id} event={item} items={items} onClose={close} />;
  return <EventViewDialog item={item} onClose={close} onEdit={() => open({ mode: "edit", id: item.id })} />;
}

function EventFormDialog({ event, initial, items, onClose }: { event?: CalendarItem; initial?: { date?: string; category?: EventCategory }; items: CalendarItem[]; onClose: () => void }) {
  const add = useEventAdminStore((s) => s.add);
  const update = useEventAdminStore((s) => s.update);
  const addNotice = useNoticeAdminStore((s) => s.add);
  const today = localToday();
  const startDefault = initial?.date ?? today;
  const [v, setV] = useState<EventDraft>(() =>
    event
      ? { title: event.title, category: event.category, startDate: event.startDate, endDate: event.endDate, startTime: event.startTime, endTime: event.endTime, location: event.location, groups: event.groups, classes: event.classes, description: event.description }
      : {
          title: "",
          category: initial?.category ?? "Academic",
          startDate: startDefault,
          endDate: startDefault,
          startTime: initial?.category === "Holiday" ? undefined : "09:00",
          endTime: initial?.category === "Holiday" ? undefined : "12:00",
          location: "",
          groups: ["students", "parents", "teachers"],
          classes: [],
          description: "",
        },
  );
  const [notify, setNotify] = useState(!event);
  const [error, setError] = useState("");
  const set = (patch: Partial<EventDraft>) => {
    setV((x) => ({ ...x, ...patch }));
    setError("");
  };
  const allDay = !v.startTime;
  const holiday = v.category === "Holiday";
  const range = v.endDate >= v.startDate ? dayCount(v) : 0;
  const clashes = holiday
    ? items.filter((i) => i.id !== event?.id && (i.category === "Exam" || i.category === "Holiday") && i.startDate <= v.endDate && i.endDate >= v.startDate)
    : [];

  function save() {
    if (v.title.trim().length < 3) return setError("Enter the event name.");
    if (!v.startDate || !v.endDate || v.endDate < v.startDate) return setError("The end date must be on or after the start date.");
    if (range > 120) return setError("An event can span at most 120 days.");
    if (!allDay && v.endTime && v.endTime <= v.startTime!) return setError("The end time must be after the start time.");
    if (!v.groups.length) return setError("Choose who it is for.");
    const data = { ...v, title: v.title.trim(), description: v.description.trim(), location: v.location.trim() };
    if (event) update(event.id, data);
    else add({ ...data, id: `EVT-${uid().slice(0, 6).toUpperCase()}`, createdAt: new Date().toISOString(), custom: true });
    if (notify) {
      const at = new Date().toISOString();
      const body = [`${whenLabel(data)}${data.location ? ` · ${data.location}` : ""}`, data.description].filter(Boolean).join("\n\n");
      addNotice({
        id: `NTC-${uid().slice(0, 6).toUpperCase()}`,
        slug: `${slugify(data.title)}-${uid().slice(0, 4).toLowerCase()}`,
        title: holiday ? `Holiday: ${data.title}` : data.title,
        body,
        category: NOTICE_CATEGORY[data.category],
        priority: holiday ? "important" : "normal",
        groups: data.groups as NoticeGroup[],
        classes: data.classes,
        publishAt: nowIso(),
        expiresOn: data.endDate,
        pinned: false,
        archived: false,
        sms: holiday,
        email: true,
        createdBy: CURRENT_USER,
        createdAt: at,
        updatedAt: at,
        custom: true,
      });
    }
    toast(event ? "Event updated" : holiday ? "Holiday added" : "Event added", { description: `${data.title}${notify ? " · notice posted" : ""}` });
    onClose();
  }

  const classes = [...CLASS_OPTIONS].sort((a, b) => classOrder(a) - classOrder(b));
  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={event ? "Edit event" : holiday ? "Add holiday" : "Add event"}
      description={holiday ? "The school is closed on these days — attendance shows them as holidays." : "It appears on the school calendar and the portals."}
      icon={
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", CATEGORY_STYLE[v.category].tile)}>
          <CalendarDays className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{event ? "Save changes" : holiday ? "Add holiday" : "Add event"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormField label="Name" required>
          <Input value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder={holiday ? "e.g. Winter vacation" : "e.g. Annual sports day"} />
        </FormField>
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {EDITABLE_CATEGORIES.map((c) => {
              const Icon = CATEGORY_STYLE[c].icon;
              const on = v.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ category: c, ...(c === "Holiday" ? { startTime: undefined, endTime: undefined } : {}) })}
                  className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition", on ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-secondary hover:bg-soft")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <FieldGrid>
          <FormField label="Starts" required>
            <Input type="date" value={v.startDate} onChange={(e) => set({ startDate: e.target.value, ...(e.target.value > v.endDate ? { endDate: e.target.value } : {}) })} />
          </FormField>
          <FormField label="Ends" required hint={range > 1 ? `${range} days` : "Same day"}>
            <Input type="date" value={v.endDate} min={v.startDate} onChange={(e) => set({ endDate: e.target.value })} />
          </FormField>
        </FieldGrid>
        {!holiday && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span className="flex-1 text-sm font-medium text-fg">All day</span>
              <Switch checked={allDay} onCheckedChange={(on) => set(on ? { startTime: undefined, endTime: undefined } : { startTime: "09:00", endTime: "12:00" })} aria-label="All day" />
            </label>
            {!allDay && (
              <FieldGrid>
                <FormField label="From" required>
                  <Input type="time" value={v.startTime ?? ""} onChange={(e) => set({ startTime: e.target.value })} />
                </FormField>
                <FormField label="To">
                  <Input type="time" value={v.endTime ?? ""} onChange={(e) => set({ endTime: e.target.value || undefined })} />
                </FormField>
              </FieldGrid>
            )}
            <FormField label="Location">
              <Input value={v.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Main hall" />
            </FormField>
          </div>
        )}
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">For</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(GROUP_LABEL) as NoticeGroup[]).map((g) => {
              const on = v.groups.includes(g);
              return (
                <button key={g} type="button" aria-pressed={on} onClick={() => set({ groups: on ? v.groups.filter((x) => x !== g) : [...v.groups, g] })} className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition", on ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-line-strong text-fg-muted hover:bg-soft")}>
                  {GROUP_LABEL[g]}
                </button>
              );
            })}
          </div>
          {!holiday && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => set({ classes: [] })} className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition", !v.classes.length ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-line text-fg-muted hover:bg-soft")}>
                All classes
              </button>
              {classes.map((c) => {
                const on = v.classes.includes(c);
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => set({ classes: on ? v.classes.filter((x) => x !== c) : [...v.classes, c] })} className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition", on ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-line text-fg-muted hover:bg-soft")}>
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <FormField label="Details">
          <Textarea rows={3} value={v.description} onChange={(e) => set({ description: e.target.value })} placeholder="What, who, what to bring…" />
        </FormField>
        {!event && (
          <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <Megaphone className="h-4 w-4 text-rose-500" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-fg">Also post a notice</span>
              <span className="block text-[11px] text-fg-muted">{holiday ? "Published now, with SMS to guardians" : "Published now on the portals"}</span>
            </span>
            <Switch checked={notify} onCheckedChange={setNotify} aria-label="Also post a notice" />
          </label>
        )}
        {holiday && v.startDate < today && <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Past days become holidays in everyone&apos;s attendance.</p>}
        {clashes.length > 0 && (
          <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Overlaps {clashes.map((c) => c.title).join(", ")}.{clashes.some((c) => c.category === "Exam") && " Exam papers on these days move to the next school day."}
          </p>
        )}
        {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}

function EventViewDialog({ item: e, onClose, onEdit }: { item: CalendarItem; onClose: () => void; onEdit: () => void }) {
  const remove = useEventAdminStore((s) => s.remove);
  const add = useEventAdminStore((s) => s.add);
  const [confirm, setConfirm] = useState(false);
  const style = CATEGORY_STYLE[e.category];
  const Icon = style.icon;
  const audience = e.groups.length === 3 ? "Everyone" : e.groups.map((g) => GROUP_LABEL[g]).join(" & ");

  return (
    <>
      <Dialog
        open={!confirm}
        onClose={onClose}
        size="md"
        title={e.title}
        description={whenLabel(e)}
        icon={
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", style.tile)}>
            <Icon className="h-5 w-5" />
          </span>
        }
        footer={
          e.source === "school" ? (
            <>
              <Button variant="ghost" className="sm:mr-auto" onClick={() => setConfirm(true)}>
                <Trash2 className="h-4 w-4 text-rose-500" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  add({ ...e, id: `EVT-${uid().slice(0, 6).toUpperCase()}`, title: `${e.title} (copy)`, createdAt: new Date().toISOString(), custom: true });
                  toast("Event duplicated");
                  onClose();
                }}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </>
          ) : e.href ? (
            <Link href={e.href} onClick={onClose} className={buttonStyles()}>
              Open exam <ArrowRight className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={style.tone}>{e.category}</Badge>
          {e.closed && <Badge tone="success">School closed</Badge>}
          {e.source === "government" && (
            <Badge tone="neutral">
              <Landmark className="h-3 w-3" /> Government holiday
            </Badge>
          )}
          {e.source === "exam" && <Badge tone="warning">From Examinations</Badge>}
          {dayCount(e) > 1 && <Badge tone="info">{dayCount(e)} days</Badge>}
        </div>
        <dl className="mt-4 space-y-2.5 text-sm">
          {e.location && (
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
              <dd className="text-fg-secondary">{e.location}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
            <dd className="text-fg-secondary">
              {audience}
              {e.classes.length > 0 && ` · ${e.classes.join(", ")}`}
            </dd>
          </div>
        </dl>
        {e.description && <p className="mt-4 whitespace-pre-line rounded-xl bg-subtle px-4 py-3 text-sm text-fg-secondary">{e.description}</p>}
        {e.source === "government" && <p className="mt-3 text-xs text-fg-muted">Government holidays come from the official calendar and can&apos;t be edited here.</p>}
      </Dialog>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Delete ${e.title}?`}
        typeToConfirm={e.id}
        description={e.closed ? "These days become school days again — attendance and exam routines update." : "It is removed from the calendar and the portals."}
        onConfirm={() => {
          remove(e.id);
          toast("Event deleted");
          onClose();
        }}
      />
    </>
  );
}
