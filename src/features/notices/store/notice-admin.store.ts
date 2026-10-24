import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Notice } from "../types/types";

type NoticeAdminState = {
  /** Notices created by admins. */
  added: Notice[];
  /** Edits to demo notices, by id. */
  edits: Record<string, Partial<Notice>>;
  deleted: string[];

  add: (notice: Notice) => void;
  update: (id: string, patch: Partial<Notice>) => void;
  remove: (id: string) => void;
};

/** Admin changes to the notice board (localStorage). BACKEND: see features/notices/BACKEND.md */
export const useNoticeAdminStore = create<NoticeAdminState>()(
  persist(
    (set) => ({
      added: [],
      edits: {},
      deleted: [],

      // BACKEND: POST /notices
      add: (notice) => set((s) => ({ added: [notice, ...s.added] })),

      // BACKEND: PATCH /notices/:id
      update: (id, patch) =>
        set((s) => {
          const stamped = { ...patch, updatedAt: new Date().toISOString() };
          if (s.added.some((n) => n.id === id)) return { added: s.added.map((n) => (n.id === id ? { ...n, ...stamped } : n)) };
          return { edits: { ...s.edits, [id]: { ...s.edits[id], ...stamped } } };
        }),

      // BACKEND: DELETE /notices/:id
      remove: (id) => set((s) => ({ added: s.added.filter((n) => n.id !== id), deleted: [...s.deleted, id] })),
    }),
    { name: "notice-admin-demo", skipHydration: true },
  ),
);

export function useNoticeAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useNoticeAdminStore.persist.onFinishHydration(onChange),
    () => useNoticeAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useNoticeAdminStore.persist.hasHydrated()) void useNoticeAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
