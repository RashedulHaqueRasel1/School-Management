"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { School } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Teacher } from "@/features/teachers/types/types";
import { toast } from "@/store/toast.store";

import { defaultSettings, sectionKey, sectionLabel, sectionSlug } from "../demoData/mock-data";
import { useClassAdminStore } from "../store/class-admin.store";
import type { ClassSection } from "../types/types";

const NEW_CLASS = "__new";

/**
 * Create a section (Class 6 C, Class 9 Science…) or a whole new class.
 * BACKEND: POST /sections { className, section, room, capacity, shift, version, classTeacherId }
 */
export function AddSectionDialog({ sections, teachers, initialClass, onClose }: { sections: ClassSection[]; teachers: Teacher[]; initialClass?: string; onClose: () => void }) {
  const router = useRouter();
  const addSection = useClassAdminStore((s) => s.addSection);
  const classes = [...new Set(sections.map((s) => s.className))];
  const nextLetter = (className: string) => {
    const used = new Set(sections.filter((s) => s.className === className).map((s) => s.section));
    return "ABCDEFGHIJ".split("").find((l) => !used.has(l)) ?? "";
  };
  const start = initialClass ?? classes[0] ?? "Class 1";
  const [className, setClassName] = useState(start);
  const [newClass, setNewClass] = useState("");
  const [section, setSection] = useState(nextLetter(start));
  const base = defaultSettings(start, nextLetter(start) || "A", {});
  const [room, setRoom] = useState(base.room);
  const [capacity, setCapacity] = useState(base.capacity);
  const [shift, setShift] = useState("Morning");
  const [version, setVersion] = useState("Bangla");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const finalClass = className === NEW_CLASS ? newClass.trim() : className;

  function submit() {
    if (finalClass.length < 2) return setError("Enter the class name.");
    if (!section.trim()) return setError("Enter the section name.");
    if (sections.some((s) => s.key === sectionKey(finalClass, section.trim()))) return setError(`${sectionLabel(finalClass, section.trim())} already exists.`);
    if (capacity < 1) return setError("Capacity must be at least 1.");
    addSection(finalClass, section.trim(), { room: room.trim() || "TBA", capacity, shift, version, classTeacherId: teacherId || undefined });
    toast("Section created", { description: `${sectionLabel(finalClass, section.trim())} · ${room}` });
    onClose();
    router.push(`/classes/${sectionSlug(finalClass, section.trim())}`);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Add section"
      description="New students can then be admitted or moved into it."
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <School className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create section</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid>
          <FormField label="Class" required>
            <Select
              value={className}
              onChange={(e) => {
                setClassName(e.target.value);
                setError("");
                if (e.target.value !== NEW_CLASS) setSection(nextLetter(e.target.value));
                else setSection("A");
              }}
              className="h-11"
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={NEW_CLASS}>+ New class…</option>
            </Select>
          </FormField>
          <FormField label="Section name" required hint="A letter or a name, e.g. C or Science">
            <Input
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                setError("");
              }}
            />
          </FormField>
          {className === NEW_CLASS && (
            <FormField label="New class name" required className="sm:col-span-2">
              <Input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="e.g. Class 11 or Pre-KG" />
            </FormField>
          )}
          <FormField label="Room">
            <Input value={room} onChange={(e) => setRoom(e.target.value)} />
          </FormField>
          <FormField label="Capacity (seats)">
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.valueAsNumber || 0)} />
          </FormField>
          <FormField label="Shift">
            <Select value={shift} onChange={(e) => setShift(e.target.value)} className="h-11">
              <option value="Morning">Morning</option>
              <option value="Day">Day</option>
            </Select>
          </FormField>
          <FormField label="Version">
            <Select value={version} onChange={(e) => setVersion(e.target.value)} className="h-11">
              <option value="Bangla">Bangla</option>
              <option value="English">English</option>
            </Select>
          </FormField>
          <FormField label="Class teacher" className="sm:col-span-2">
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-11">
              <option value="">Default (by school rule)</option>
              {teachers
                .filter((t) => t.status !== "left")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.subjects.join(", ")}
                  </option>
                ))}
            </Select>
          </FormField>
        </FieldGrid>
        {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Dialog>
  );
}
