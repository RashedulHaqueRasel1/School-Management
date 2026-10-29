"use client";

import { useState } from "react";
import { Check, CircleDashed, Loader, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uid } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useSubject } from "../../hooks/use-subject";
import { useSubjectAdminStore } from "../../store/subject-admin.store";
import type { SyllabusTopic, TopicStatus } from "../../types/types";

const STATUS: Record<TopicStatus, { label: string; icon: typeof Check; tone: "success" | "info" | "neutral"; next: TopicStatus }> = {
  completed: { label: "Completed", icon: Check, tone: "success", next: "upcoming" },
  "in-progress": { label: "In progress", icon: Loader, tone: "info", next: "completed" },
  upcoming: { label: "Upcoming", icon: CircleDashed, tone: "neutral", next: "in-progress" },
};

const monthLabel = (m?: string) => (m ? new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) : "");

/** Chapter plan per class with progress. BACKEND: GET/PUT /subjects/:id/syllabus/:class */
export function SubjectSyllabusView({ slug }: { slug: string }) {
  const { subject, syllabus } = useSubject(slug);
  const setSyllabus = useSubjectAdminStore((s) => s.setSyllabus);
  const resetSyllabus = useSubjectAdminStore((s) => s.resetSyllabus);
  const [className, setClassName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  if (!subject || !syllabus) return null;

  const current = className && subject.classes.includes(className) ? className : subject.classes[0];
  if (!current) return <Card className="py-12 text-center text-sm text-fg-muted">This subject isn&apos;t taught in any class yet — set the classes in Settings.</Card>;
  const { topics, edited } = syllabus(current);
  const done = topics.filter((t) => t.status === "completed").length;
  const save = (next: SyllabusTopic[], action: string, detail: string) => setSyllabus(subject.name, current, next, action, `${current} · ${detail}`);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="p-3">
        <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Classes</p>
        <ul className="space-y-1">
          {subject.classes.map((c) => {
            const t = syllabus(c).topics;
            const pct = t.length ? Math.round((t.filter((x) => x.status === "completed").length / t.length) * 100) : 0;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setClassName(c)}
                  className={cn("w-full rounded-xl px-3 py-2.5 text-left transition", c === current ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-soft")}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn("font-medium", c === current ? "text-violet-700" : "text-fg")}>{c}</span>
                    <span className="text-xs tabular-nums text-fg-muted">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-soft">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">
              {subject.name} · {current}
            </h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              {done} of {topics.length} topics completed · click a status to move it forward
            </p>
          </div>
          {edited && (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (!(await confirmAction({ title: "Reset the syllabus?", description: `${subject.name} · ${current} goes back to the default plan. Your topic edits are lost.`, confirmLabel: "Reset", tone: "danger" }))) return;
                resetSyllabus(subject.name, current);
                toast("Syllabus reset to the default plan");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
          <div className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${topics.length ? (done / topics.length) * 100 : 0}%` }} />
        </div>

        <ol className="mt-5 space-y-2">
          {topics.map((t) => {
            const s = STATUS[t.status];
            const Icon = s.icon;
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", t.status === "completed" ? "bg-emerald-50 text-emerald-600" : t.status === "in-progress" ? "bg-indigo-50 text-indigo-600" : "bg-soft text-fg-subtle")}>
                  <Icon className="h-4 w-4" />
                </span>
                <input
                  key={`${t.id}-${t.title}`}
                  defaultValue={t.title}
                  aria-label="Topic title"
                  onBlur={async (e) => {
                    const input = e.currentTarget;
                    const title = input.value.trim();
                    if (!title || title === t.title) {
                      input.value = t.title;
                      return;
                    }
                    const ok = await confirmAction({ title: "Rename topic?", description: `“${t.title}” → “${title}”`, confirmLabel: "Rename", rememberKey: `syllabus:${subject.name}` });
                    if (!ok) {
                      input.value = t.title;
                      return;
                    }
                    save(
                      topics.map((x) => (x.id === t.id ? { ...x, title } : x)),
                      "Topic renamed",
                      `${t.title} → ${title}`,
                    );
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className={cn("min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-sm focus:bg-subtle focus:outline-none", t.status === "completed" ? "text-fg-muted line-through decoration-fg-subtle/50" : "text-fg")}
                />
                {t.month && <span className="hidden text-xs text-fg-subtle sm:inline">{monthLabel(t.month)}</span>}
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: `Mark as ${STATUS[s.next].label.toLowerCase()}?`,
                      description: `${t.title} · ${subject.name}, ${current}`,
                      confirmLabel: `Mark ${STATUS[s.next].label.toLowerCase()}`,
                      rememberKey: `syllabus:${subject.name}`,
                    });
                    if (ok) save(topics.map((x) => (x.id === t.id ? { ...x, status: s.next } : x)), `Topic ${STATUS[s.next].label.toLowerCase()}`, t.title);
                  }}
                  title="Change status"
                >
                  <Badge tone={s.tone} dot>
                    {s.label}
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: "Delete this topic?",
                      description: `${t.title} is removed from the ${subject.name} syllabus for ${current}.`,
                      confirmLabel: "Delete topic",
                      tone: "danger",
                      typeToConfirm: t.title.replace(/^\d+\.\s*/, ""),
                    });
                    if (ok) save(topics.filter((x) => x.id !== t.id), "Topic removed", t.title);
                  }}
                  aria-label={`Remove ${t.title}`}
                  className="rounded-lg p-1.5 text-fg-subtle hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ol>

        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const title = draft.trim();
            if (title.length < 2) return;
            if (!(await confirmAction({ title: "Add this topic?", description: `“${title}” · ${subject.name}, ${current}`, confirmLabel: "Add topic", rememberKey: `syllabus:${subject.name}` }))) return;
            save([...topics, { id: uid(), title: `${topics.length + 1}. ${title}`, status: "upcoming" }], "Topic added", title);
            setDraft("");
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a topic, e.g. Model test & revision" />
          <Button type="submit" variant="outline">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </Card>
    </div>
  );
}
