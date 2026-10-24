import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SchoolEvent } from "../types/types";

type EventAdminState = {
  /** Events created by admins. */
  added: SchoolEvent[];
  /** Edits to demo events, by id. */
  edits: Record<string, Partial<SchoolEvent>>;
  deleted: string[];

  add: (event: SchoolEvent) => void;
  update: (id: string, patch: Partial<SchoolEvent>) => void;
  remove: (id: string) => void;
};

/** Admin changes to the school calendar (localStorage). BACKEND: see features/events/BACKEND.md */
export const useEventAdminStore = create<EventAdminState>()(
  persist(
    (set) => ({
      added: [],
      edits: {},
      deleted: [],
      // BACKEND: POST /events
      add: (event) => set((s) => ({ added: [...s.added, event] })),
      // BACKEND: PATCH /events/:id
      update: (id, patch) =>
        set((s) =>
          s.added.some((e) => e.id === id) ? { added: s.added.map((e) => (e.id === id ? { ...e, ...patch } : e)) } : { edits: { ...s.edits, [id]: { ...s.edits[id], ...patch } } },
        ),
      // BACKEND: DELETE /events/:id
      remove: (id) => set((s) => ({ added: s.added.filter((e) => e.id !== id), deleted: [...s.deleted, id] })),
    }),
    { name: "event-admin-demo", skipHydration: true },
  ),
);

export function useEventAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useEventAdminStore.persist.onFinishHydration(onChange),
    () => useEventAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useEventAdminStore.persist.hasHydrated()) void useEventAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
