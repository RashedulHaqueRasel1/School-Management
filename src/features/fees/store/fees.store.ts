import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FeesState = {
  /** Fee reminder SMS sent: studentId → ISO times (newest first). */
  reminders: Record<string, string[]>;
  remind: (studentIds: string[]) => void;
  /** Open "Collect payment": "pick" = choose a student first (not saved). */
  collecting: { studentId: string; months?: string[] } | "pick" | null;
  openCollect: (target: FeesState["collecting"]) => void;
  /** Class filter on the Dues tab (set from the overview, not saved). */
  duesClass: string;
  setDuesClass: (className: string) => void;
};

/**
 * Fees module UI state + sent reminders (localStorage). Payments, discounts and
 * ledgers live on the students (student-admin-demo).
 */
export const useFeesStore = create<FeesState>()(
  persist(
    (set) => ({
      reminders: {},
      collecting: null,
      openCollect: (collecting) => set({ collecting }),
      duesClass: "all",
      setDuesClass: (duesClass) => set({ duesClass }),
      // BACKEND: POST /fees/reminders { studentIds, message }
      remind: (ids) =>
        set((s) => {
          const at = new Date().toISOString();
          return { reminders: { ...s.reminders, ...Object.fromEntries(ids.map((id) => [id, [at, ...(s.reminders[id] ?? [])]])) } };
        }),
    }),
    { name: "fees-admin-demo", skipHydration: true, partialize: (s) => ({ reminders: s.reminders }) },
  ),
);

export function useFeesHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useFeesStore.persist.onFinishHydration(onChange),
    () => useFeesStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useFeesStore.persist.hasHydrated()) void useFeesStore.persist.rehydrate();
  }, []);
  return hydrated;
}
