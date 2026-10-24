import { create } from "zustand";

type ResultsState = {
  /** Exam / class shown on every Results tab (shared while switching tabs, not saved). */
  examId: string | null;
  className: string | null;
  setExam: (examId: string) => void;
  setClass: (className: string | null) => void;
};

export const useResultsStore = create<ResultsState>()((set) => ({
  examId: null,
  className: null,
  setExam: (examId) => set({ examId }),
  setClass: (className) => set({ className }),
}));
