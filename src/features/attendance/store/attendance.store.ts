import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AttendanceState = {
  /** Date shown on the Daily / Students / Staff registers (shared across tabs, not saved). */
  date: string | null;
  setDate: (date: string | null) => void;
  /** Absence SMS already sent: "studentId::date" → ISO time. */
  alerts: Record<string, string>;
  markAlerted: (keys: string[]) => void;
};

/**
 * School-wide attendance UI state + sent absence alerts (localStorage).
 * The attendance records themselves live on students / teachers.
 */
export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set) => ({
      date: null,
      setDate: (date) => set({ date }),
      alerts: {},
      markAlerted: (keys) => set((s) => ({ alerts: { ...s.alerts, ...Object.fromEntries(keys.map((k) => [k, new Date().toISOString()])) } })),
    }),
    { name: "attendance-admin-demo", skipHydration: true, partialize: (s) => ({ alerts: s.alerts }) },
  ),
);

export function useAttendanceHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useAttendanceStore.persist.onFinishHydration(onChange),
    () => useAttendanceStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useAttendanceStore.persist.hasHydrated()) void useAttendanceStore.persist.rehydrate();
  }, []);
  return hydrated;
}
