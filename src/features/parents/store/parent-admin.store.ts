import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CURRENT_USER } from "@/features/admissions/constants";
import { uid } from "@/features/admissions/utils";

import type { ParentAudit, ParentAuditCategory, ParentMeeting, ParentMessage, ParentProfile, PortalAccount } from "../types/types";

type ParentAdminState = {
  /** Extra guardian info not stored on the students (address, preferences). Keyed by mobile. */
  profiles: Record<string, Partial<ParentProfile>>;
  accounts: Record<string, Partial<PortalAccount>>;
  messages: ParentMessage[];
  meetings: ParentMeeting[];
  /** Status / outcome changes to (demo or created) meetings. */
  meetingState: Record<string, Partial<ParentMeeting>>;
  audit: ParentAudit[];

  log: (key: string, category: ParentAuditCategory, action: string, detail?: string) => void;
  setProfile: (key: string, patch: Partial<ParentProfile>, action: string) => void;
  sendMessages: (messages: ParentMessage[]) => void;
  addMeeting: (meeting: ParentMeeting) => void;
  updateMeeting: (meeting: ParentMeeting, patch: Partial<ParentMeeting>, action: string) => void;
  updateAccount: (key: string, patch: Partial<PortalAccount>, action: string, detail?: string) => void;
  /** The guardian's mobile changed: move everything to the new number. */
  rekey: (from: string, to: string) => void;
};

const entry = (parentKey: string, category: ParentAuditCategory, action: string, detail?: string): ParentAudit => ({
  id: uid(),
  parentKey,
  category,
  action,
  detail,
  at: new Date().toISOString(),
  by: CURRENT_USER,
});

/**
 * Admin changes to guardians (localStorage). Guardian name / phone / children
 * live on the students (student-admin store); this holds the rest.
 * BACKEND: see features/parents/BACKEND.md
 */
export const useParentAdminStore = create<ParentAdminState>()(
  persist(
    (set) => ({
      profiles: {},
      accounts: {},
      messages: [],
      meetings: [],
      meetingState: {},
      audit: [],

      log: (key, category, action, detail) => set((s) => ({ audit: [entry(key, category, action, detail), ...s.audit] })),

      setProfile: (key, patch, action) =>
        set((s) => ({ profiles: { ...s.profiles, [key]: { ...s.profiles[key], ...patch } }, audit: [entry(key, "profile", action), ...s.audit] })),

      // BACKEND: POST /parents/messages  { parentIds[], channel, subject, body }
      sendMessages: (messages) =>
        set((s) => ({
          messages: [...messages, ...s.messages],
          audit: [...messages.map((m) => entry(m.parentKey, "message", `${m.channel === "both" ? "SMS + email" : m.channel === "sms" ? "SMS" : "Email"} sent`, m.subject)), ...s.audit],
        })),

      // BACKEND: POST /parents/:id/meetings
      addMeeting: (meeting) =>
        set((s) => ({
          meetings: [meeting, ...s.meetings],
          audit: [entry(meeting.parentKey, "meeting", "Meeting scheduled", `${meeting.date} ${meeting.time} · ${meeting.studentName} · ${meeting.withWhom}`), ...s.audit],
        })),

      // BACKEND: PATCH /parent-meetings/:id
      updateMeeting: (meeting, patch, action) =>
        set((s) => ({
          meetingState: { ...s.meetingState, [meeting.id]: { ...s.meetingState[meeting.id], ...patch } },
          audit: [entry(meeting.parentKey, "meeting", action, `${meeting.date} · ${meeting.studentName}${patch.outcome ? ` · ${patch.outcome}` : ""}`), ...s.audit],
        })),

      updateAccount: (key, patch, action, detail) =>
        set((s) => ({ accounts: { ...s.accounts, [key]: { ...s.accounts[key], ...patch } }, audit: [entry(key, "account", action, detail), ...s.audit] })),

      rekey: (from, to) =>
        set((s) => {
          if (from === to) return s;
          const move = <T,>(record: Record<string, T>) => {
            const next = { ...record };
            if (from in next) {
              next[to] = next[from]!;
              delete next[from];
            }
            return next;
          };
          return {
            profiles: move(s.profiles),
            accounts: move(s.accounts),
            messages: s.messages.map((m) => (m.parentKey === from ? { ...m, parentKey: to } : m)),
            meetings: s.meetings.map((m) => (m.parentKey === from ? { ...m, parentKey: to } : m)),
            audit: [entry(to, "profile", "Mobile number changed", `${from} → ${to}`), ...s.audit.map((a) => (a.parentKey === from ? { ...a, parentKey: to } : a))],
          };
        }),
    }),
    { name: "parent-admin-demo", skipHydration: true },
  ),
);

export function useParentAdminHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useParentAdminStore.persist.onFinishHydration(onChange),
    () => useParentAdminStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useParentAdminStore.persist.hasHydrated()) void useParentAdminStore.persist.rehydrate();
  }, []);
  return hydrated;
}
