import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CURRENT_USER } from "@/features/admissions/constants";
import { uid } from "@/features/admissions/utils";

import type { ClassAudit, ClassAuditCategory, RoutineCell, SectionSettings } from "../types/types";

type ClassAdminState = {
  /** Settings changes by section key. */
  sections: Record<string, Partial<SectionSettings>>;
  /** Sections created by admins. */
  added: { className: string; section: string; createdAt: string }[];
  /** Archived section keys. */
  archived: Record<string, { reason: string; at: string }>;
  /** sectionKey → "day-period" → cell (null = free). Missing = default from teacher routines. */
  routine: Record<string, Record<string, RoutineCell>>;
  audit: ClassAudit[];

  log: (key: string, category: ClassAuditCategory, action: string, detail?: string) => void;
  saveSettings: (key: string, patch: Partial<SectionSettings>, action: string, detail?: string) => void;
  addSection: (className: string, section: string, settings: SectionSettings) => void;
  archive: (key: string, reason: string) => void;
  restore: (key: string) => void;
  setRoutineCell: (key: string, slot: string, cell: RoutineCell | undefined, detail: string) => void;
};

const entry = (sectionKey: string, category: ClassAuditCategory, action: string, detail?: string): ClassAudit => ({
  id: uid(),
  sectionKey,
  category,
  action,
  detail,
  at: new Date().toISOString(),
  by: CURRENT_USER,
});

/**
 * Admin changes to classes & sections (localStorage). Student moves and roll
 * numbers live on the students; subject teachers on the teachers' assignments.
 * BACKEND: see features/classes/BACKEND.md
 */
export const useClassAdminStore = create<ClassAdminState>()(
  persist(
    (set) => ({
      sections: {},
      added: [],
      archived: {},
      routine: {},
      audit: [],

      log: (key, category, action, detail) => set((s) => ({ audit: [entry(key, category, action, detail), ...s.audit] })),

      // BACKEND: PATCH /sections/:id
      saveSettings: (key, patch, action, detail) =>
        set((s) => ({ sections: { ...s.sections, [key]: { ...s.sections[key], ...patch } }, audit: [entry(key, "settings", action, detail), ...s.audit] })),

      // BACKEND: POST /sections
      addSection: (className, section, settings) =>
        set((s) => {
          const key = `${className}::${section}`;
          return {
            added: [...s.added, { className, section, createdAt: new Date().toISOString() }],
            sections: { ...s.sections, [key]: settings },
            audit: [entry(key, "settings", "Section created", `${settings.room} · capacity ${settings.capacity} · ${settings.shift} shift`), ...s.audit],
          };
        }),

      // BACKEND: POST /sections/:id/archive (only when empty)
      archive: (key, reason) =>
        set((s) => ({ archived: { ...s.archived, [key]: { reason, at: new Date().toISOString() } }, audit: [entry(key, "settings", "Section archived", reason), ...s.audit] })),

      restore: (key) =>
        set((s) => {
          const archived = { ...s.archived };
          delete archived[key];
          return { archived, audit: [entry(key, "settings", "Section restored"), ...s.audit] };
        }),

      // BACKEND: PUT /sections/:id/routine/:day/:period  (DELETE = back to default)
      setRoutineCell: (key, slot, cell, detail) =>
        set((s) => {
          const current = { ...s.routine[key] };
          if (cell === undefined) delete current[slot];
          else current[slot] = cell;
          return { routine: { ...s.routine, [key]: current }, audit: [entry(key, "routine", cell === undefined ? "Routine period reset" : "Routine period changed", detail), ...s.audit] };
        }),
    }),
    { name: "class-admin-demo", skipHydration: true },
  ),
);

export function useClassAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useClassAdminStore.persist.onFinishHydration(onChange),
    () => useClassAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useClassAdminStore.persist.hasHydrated()) void useClassAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
