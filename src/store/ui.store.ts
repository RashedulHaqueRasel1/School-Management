import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIState = {
  /** Desktop: sidebar collapsed to icon-only rail. */
  sidebarCollapsed: boolean;
  /** Mobile: off-canvas sidebar drawer open. */
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: "ui-store",
      // Only remember the desktop collapse preference.
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
