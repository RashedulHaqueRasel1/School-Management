import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIState = {
  /** Desktop: sidebar collapsed to icon-only rail. */
  sidebarCollapsed: boolean;
  /** Mobile: off-canvas sidebar drawer open. */
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  /** Remembered list layouts, by page (e.g. classes → "table"). */
  views: Record<string, string>;
  setView: (page: string, view: string) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      views: {},
      setView: (page, view) => set((state) => ({ views: { ...state.views, [page]: view } })),
    }),
    {
      name: "ui-store",
      // Remember the desktop collapse preference and list layouts.
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, views: state.views }),
    },
  ),
);
