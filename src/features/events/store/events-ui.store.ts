import { create } from "zustand";

import type { EventCategory } from "../types/types";

export type EventDialogState = { mode: "new"; date?: string; category?: EventCategory } | { mode: "view" | "edit"; id: string } | null;

type EventsUiState = {
  dialog: EventDialogState;
  open: (dialog: EventDialogState) => void;
  /** Month shown on the calendar ("2026-10"), shared across tabs (not saved). */
  month: string | null;
  setMonth: (month: string | null) => void;
};

export const useEventsUi = create<EventsUiState>()((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  month: null,
  setMonth: (month) => set({ month }),
}));
