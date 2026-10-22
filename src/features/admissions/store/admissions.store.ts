import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CURRENT_USER, STATUS_CONFIG } from "../constants";
import { demoAdmissions } from "../demoData/mock-data";
import type {
  ActivityEvent,
  Admission,
  AdmissionInput,
  AdmissionStatus,
  GuardianNotification,
  NotificationChannel,
  Payment,
  PaymentInput,
} from "../types/types";
import { buildPaymentMessage, canDelete, contactOf, dueAmount, isStatusLocked, todayIso, uid } from "../utils";

type StatusChange = {
  /** Internal reason / remark (also used inside the guardian message). */
  note: string;
  /** Channels to notify the guardian on. Empty = no message. */
  channels: NotificationChannel[];
  /** Final message per applicant. */
  messageFor: (admission: Admission) => string;
};

type AdmissionsState = {
  admissions: Admission[];
  add: (input: AdmissionInput) => Admission;
  update: (id: string, input: AdmissionInput) => Admission | undefined;
  changeStatus: (ids: string[], status: AdmissionStatus, change: StatusChange) => void;
  recordPayment: (id: string, input: PaymentInput, channels: NotificationChannel[]) => Payment | undefined;
  /** Deletes applications. Ones with payments are skipped — payment history is permanent. */
  remove: (ids: string[]) => void;
  /** Restore the original demo dataset. */
  reset: () => void;
};

function nextId(list: Admission[]) {
  const max = list.reduce((m, a) => Math.max(m, Number(a.id.split("-").pop()) || 0), 0);
  return `ADM-2026-${String(max + 1).padStart(4, "0")}`;
}

function nextReceiptNo(list: Admission[]) {
  const max = list
    .flatMap((a) => a.payments)
    .reduce((m, p) => Math.max(m, Number(p.receiptNo.split("-").pop()) || 0), 5000);
  return `RCT-2026-${max + 1}`;
}

/**
 * Builds the notification list for the backend to deliver.
 * Everything starts as `queued`; the backend's SMS/email workers flip it to `sent` / `failed`.
 */
function notificationsFor(a: Admission, channels: NotificationChannel[]): GuardianNotification[] {
  const contact = contactOf(a);
  return channels
    .map((channel) => ({ channel, to: channel === "sms" ? contact.phone : contact.email, state: "queued" as const }))
    .filter((n) => n.to);
}

function event(partial: Omit<ActivityEvent, "id" | "at" | "by">): ActivityEvent {
  return { ...partial, id: uid(), at: new Date().toISOString(), by: CURRENT_USER };
}

/**
 * Payments are append-only: there is deliberately no action to edit or delete them.
 *
 * Demo admissions store — instant client-side CRUD, saved to localStorage so
 * changes survive a reload. Each action mirrors one backend endpoint
 * (see features/admissions/BACKEND.md); swap them for TanStack Query mutations later.
 */
export const useAdmissionsStore = create<AdmissionsState>()(
  persist(
    (set, get) => ({
      admissions: demoAdmissions,

      // BACKEND: POST /admissions
      add: (input) => {
        const draft: Admission = { ...input, id: nextId(get().admissions), appliedOn: todayIso(), status: "pending", payments: [], history: [] };
        const contact = contactOf(draft);
        const admission: Admission = {
          ...draft,
          history: [
            event({
              type: "submitted",
              title: input.source === "online" ? "Application submitted online" : "Application entered at the office",
              message: `Dear ${contact.name}, we have received the admission application of ${draft.studentName} (${draft.id}). Track it any time with this ID. — EduManage School`,
              notifications: notificationsFor(draft, ["sms"]),
            }),
          ],
        };
        set((s) => ({ admissions: [admission, ...s.admissions] }));
        return admission;
      },

      // BACKEND: PUT /admissions/:id
      update: (id, input) => {
        let updated: Admission | undefined;
        set((s) => ({
          admissions: s.admissions.map((a) => {
            if (a.id !== id) return a;
            updated = { ...a, ...input, history: [event({ type: "updated", title: "Application details updated", notifications: [] }), ...a.history] };
            return updated;
          }),
        }));
        return updated;
      },

      // BACKEND: PATCH /admissions/:id/status  → queues SMS/email to the guardian
      //          must refuse (409) once the application has a payment (decision is final)
      changeStatus: (ids, status, { note, channels, messageFor }) =>
        set((s) => ({
          admissions: s.admissions.map((a) => {
            if (!ids.includes(a.id) || isStatusLocked(a)) return a;
            const message = channels.length ? messageFor(a) : undefined;
            return {
              ...a,
              status,
              history: [
                event({
                  type: "status",
                  status,
                  title: `Status changed to ${STATUS_CONFIG[status].label}`,
                  note: note.trim() || undefined,
                  message,
                  notifications: message ? notificationsFor(a, channels) : [],
                }),
                ...a.history,
              ],
            };
          }),
        })),

      // BACKEND: POST /admissions/:id/payments  → issues receipt, optional SMS / email (PDF attached)
      recordPayment: (id, input, channels) => {
        const admission = get().admissions.find((a) => a.id === id);
        if (!admission) return undefined;
        const payment: Payment = { ...input, id: uid(), receiptNo: nextReceiptNo(get().admissions) };
        const dueAfter = dueAmount({ ...admission, payments: [...admission.payments, payment] });
        const message = channels.length ? buildPaymentMessage(admission, payment, dueAfter) : undefined;
        set((s) => ({
          admissions: s.admissions.map((a) =>
            a.id === id
              ? {
                  ...a,
                  payments: [...a.payments, payment],
                  history: [
                    event({
                      type: "payment",
                      title: `Payment received · ${payment.receiptNo}`,
                      message,
                      notifications: message ? notificationsFor(a, channels) : [],
                    }),
                    ...a.history,
                  ],
                }
              : a,
          ),
        }));
        return payment;
      },

      // BACKEND: DELETE /admissions/:id  → must refuse (409) when the application has payments
      remove: (ids) =>
        set((s) => ({ admissions: s.admissions.filter((a) => !ids.includes(a.id) || !canDelete(a)) })),

      reset: () => set({ admissions: demoAdmissions }),
    }),
    {
      name: "admissions-demo-v2",
      version: 2,
      // Hydrate after mount (see useAdmissionsHydrated) so server and first client render match.
      skipHydration: true,
    },
  ),
);

/** Loads saved demo data from localStorage; returns true once it is ready. */
export function useAdmissionsHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useAdmissionsStore.persist.onFinishHydration(onChange),
    () => useAdmissionsStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (!useAdmissionsStore.persist.hasHydrated()) void useAdmissionsStore.persist.rehydrate();
  }, []);

  return hydrated;
}
