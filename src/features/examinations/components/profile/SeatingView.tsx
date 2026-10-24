"use client";

import { useState } from "react";
import { AlertTriangle, DoorOpen, Pencil, Plus, Printer, RotateCcw, Search, Trash2, UserRound } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { slugify } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { useExam } from "../../hooks/use-exam";
import { useExamAdminStore } from "../../store/exam-admin.store";
import type { ExamRoom } from "../../types/types";
import { sortClasses } from "../../utils";

const CLASS_COLORS = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
  "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
  "bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-200",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200",
  "bg-slate-200 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200",
];

/**
 * Rooms, invigilators and the generated seat plan (classes alternate so
 * neighbours sit different papers). BACKEND: PUT /exams/:id/rooms · GET /exams/:id/seat-plan
 */
export function ExamSeatingView({ slug }: { slug: string }) {
  const { exam, plan, teachers } = useExam(slug);
  const setRooms = useExamAdminStore((s) => s.setRooms);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ExamRoom | "new" | null>(null);
  const [removing, setRemoving] = useState<ExamRoom | null>(null);
  const [resetting, setResetting] = useState(false);
  if (!exam || !plan) return null;

  const classes = sortClasses(exam.classes);
  const colorOf = (c: string) => CLASS_COLORS[classes.indexOf(c) % CLASS_COLORS.length];
  const q = search.trim().toLowerCase();
  const match = (name: string, roll: number, className: string) => q.length > 1 && (name.toLowerCase().includes(q) || `${className} ${roll}`.toLowerCase().includes(q));
  const found = q.length > 1 ? plan.seats.find((s) => match(s.student.name, s.student.roll, s.student.className)) : undefined;
  const capacity = exam.rooms.reduce((s, r) => s + r.capacity, 0);
  const used = exam.rooms.filter((r) => plan.seats.some((s) => s.room.id === r.id));
  const spare = exam.rooms.filter((r) => !used.includes(r));
  const teacherName = (id?: string) => teachers.find((t) => t.id === id)?.name;

  function saveRoom(room: ExamRoom) {
    const exists = exam!.rooms.some((r) => r.id === room.id);
    setRooms(exam!.id, exists ? exam!.rooms.map((r) => (r.id === room.id ? room : r)) : [...exam!.rooms, room], exists ? "Room updated" : "Room added", `${room.name} · ${room.capacity} seats`);
    toast(exists ? "Room updated" : "Room added", { description: `${room.name} · ${room.capacity} seats` });
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center print:hidden">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            Seat plan
            {plan.unseated.length > 0 && (
              <Badge tone="danger">
                <AlertTriangle className="h-3 w-3" /> {plan.unseated.length} without a seat
              </Badge>
            )}
          </h2>
          <p className="text-xs text-fg-muted">
            {plan.seats.length} students in {capacity} seats. Classes alternate, so neighbours never sit the same paper.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a student's seat..."
              aria-label="Find a student's seat"
              className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-fg shadow-card placeholder:text-fg-subtle focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <Button variant="outline" onClick={() => setResetting(true)}>
            <RotateCcw className="h-4 w-4" />
            Default rooms
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            Add room
          </Button>
        </div>
      </Card>

      {q.length > 1 && (
        <Card className={cn("px-5 py-3 text-sm print:hidden", found ? "text-fg" : "text-fg-muted")}>
          {found ? (
            <>
              <span className="font-semibold">{found.student.name}</span> ({found.student.className} {found.student.section}, roll {found.student.roll}) sits in <span className="font-semibold text-indigo-600">{found.room.name}</span>, seat{" "}
              <span className="font-semibold text-indigo-600">{found.seat}</span>.
            </>
          ) : (
            "No student matches that search."
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-2 print:hidden">
        {classes.map((c) => (
          <span key={c} className={cn("rounded-md px-2 py-1 text-[11px] font-semibold", colorOf(c))}>
            {c} · {plan.seats.filter((s) => s.student.className === c).length}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 print:block print:space-y-6">
        {used.map((room) => {
          const seats = plan.seats.filter((s) => s.room.id === room.id);
          const mix = [...new Set(seats.map((s) => s.student.className))];
          return (
            <Card key={room.id} className="p-5 print:break-inside-avoid print:shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <DoorOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-fg">{room.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-fg-muted">
                      <UserRound className="h-3 w-3" />
                      {teacherName(room.invigilatorId) ?? "No invigilator"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 print:hidden">
                  <span className="mr-1 text-xs tabular-nums text-fg-muted">
                    {seats.length}/{room.capacity}
                  </span>
                  <button type="button" onClick={() => setEditing(room)} aria-label={`Edit ${room.name}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-fg">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setRemoving(room)} aria-label={`Remove ${room.name}`} className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-fg-subtle">{mix.join(" · ")}</p>
              <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                {Array.from({ length: room.capacity }, (_, i) => {
                  const s = seats.find((x) => x.seat === i + 1);
                  const hit = s && match(s.student.name, s.student.roll, s.student.className);
                  return (
                    <div
                      key={i}
                      title={s ? `Seat ${i + 1} · ${s.student.name} · ${s.student.className} ${s.student.section}, roll ${s.student.roll}` : `Seat ${i + 1} · empty`}
                      className={cn(
                        "flex h-11 flex-col items-center justify-center rounded-lg text-center print:border print:border-slate-300",
                        s ? colorOf(s.student.className) : "border border-dashed border-line text-fg-subtle",
                        hit && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-surface",
                      )}
                    >
                      <span className="text-[9px] font-medium opacity-70">{i + 1}</span>
                      {s && <span className="text-[10px] font-bold leading-tight">{`${s.student.className.replace("Class ", "C")}-${s.student.roll}`}</span>}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {spare.length > 0 && (
        <Card className="p-5 print:hidden">
          <h3 className="text-sm font-semibold text-fg">Spare rooms ({spare.length})</h3>
          <p className="text-xs text-fg-muted">Not needed — every student is seated in the rooms above. They fill in order if more seats are needed.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {spare.map((room) => (
              <span key={room.id} className="inline-flex items-center gap-1 rounded-xl border border-line py-1 pl-3 pr-1 text-xs text-fg-secondary">
                <span className="font-semibold text-fg">{room.name}</span> · {room.capacity} seats · {teacherName(room.invigilatorId) ?? "No invigilator"}
                <button type="button" onClick={() => setEditing(room)} aria-label={`Edit ${room.name}`} className="ml-1 rounded-lg p-1 text-fg-subtle transition hover:bg-soft hover:text-fg">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setRemoving(room)} aria-label={`Remove ${room.name}`} className="rounded-lg p-1 text-fg-subtle transition hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        </Card>
      )}

      {plan.unseated.length > 0 && (
        <Card className="border-rose-200 p-5 dark:border-rose-500/30">
          <h3 className="font-semibold text-rose-600">Without a seat ({plan.unseated.length})</h3>
          <p className="mt-1 text-sm text-fg-muted">Add a room or increase a room&apos;s capacity.</p>
          <p className="mt-3 text-sm text-fg-secondary">{plan.unseated.map((s) => `${s.name} (${s.className})`).join(", ")}</p>
        </Card>
      )}

      {editing && (
        <RoomDialog
          room={editing === "new" ? undefined : editing}
          taken={exam.rooms.map((r) => r.id)}
          teachers={teachers.filter((t) => t.status !== "left").map((t) => ({ id: t.id, name: t.name }))}
          onSave={saveRoom}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name}?`}
        description="Students seated there move to the next rooms."
        confirmLabel="Remove"
        onConfirm={() => {
          setRooms(exam.id, exam.rooms.filter((r) => r.id !== removing!.id), "Room removed", removing!.name);
          toast("Room removed");
          setRemoving(null);
        }}
      />
      <ConfirmDialog
        open={resetting}
        onClose={() => setResetting(false)}
        title="Use the default rooms?"
        description="Rooms, capacities and invigilators go back to the school default."
        confirmLabel="Reset"
        onConfirm={() => {
          setRooms(exam.id, null, "Rooms reset to default");
          toast("Rooms reset");
          setResetting(false);
        }}
      />
    </div>
  );
}

function RoomDialog({ room, taken, teachers, onSave, onClose }: { room?: ExamRoom; taken: string[]; teachers: { id: string; name: string }[]; onSave: (r: ExamRoom) => void; onClose: () => void }) {
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(room?.capacity ?? 30);
  const [invigilatorId, setInvigilatorId] = useState(room?.invigilatorId ?? "");
  const [error, setError] = useState("");

  function submit() {
    const id = room?.id ?? slugify(name.trim());
    if (name.trim().length < 2) return setError("Enter the room name.");
    if (!room && taken.includes(id)) return setError("That room is already in the plan.");
    if (capacity < 1 || capacity > 300) return setError("Capacity must be between 1 and 300.");
    onSave({ id, name: name.trim(), capacity, invigilatorId: invigilatorId || undefined });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={room ? `Edit ${room.name}` : "Add room"}
      description="Seats are filled in room order."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <DoorOpen className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{room ? "Save" : "Add room"}</Button>
        </>
      }
    >
      <FieldGrid>
        <FormField label="Room" required>
          <Input value={name} onChange={(e) => (setName(e.target.value), setError(""))} placeholder="e.g. Room 501" disabled={Boolean(room)} />
        </FormField>
        <FormField label="Seats" required>
          <Input type="number" min={1} value={capacity} onChange={(e) => (setCapacity(e.target.valueAsNumber || 0), setError(""))} />
        </FormField>
        <FormField label="Invigilator" className="sm:col-span-2">
          <Select value={invigilatorId} onChange={(e) => setInvigilatorId(e.target.value)} className="h-11">
            <option value="">Not assigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormField>
      </FieldGrid>
      {error && <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </Dialog>
  );
}
