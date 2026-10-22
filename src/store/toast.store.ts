import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export type Toast = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastState = {
  toasts: Toast[];
  dismiss: (id: number) => void;
};

const DURATION = 3500;
let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Show a toast from anywhere (components, stores, event handlers). */
export function toast(title: string, options: { description?: string; tone?: ToastTone } = {}) {
  const id = nextId++;
  useToastStore.setState((s) => ({
    toasts: [...s.toasts.slice(-3), { id, title, description: options.description, tone: options.tone ?? "success" }],
  }));
  setTimeout(() => useToastStore.getState().dismiss(id), DURATION);
}
