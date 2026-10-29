import { create } from "zustand";

import type { ConfirmTone } from "@/components/shared/ConfirmDialog";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  /** Default "primary"; use "danger" for deletes / destructive changes. */
  tone?: ConfirmTone;
  /** Deletes: the admin must type this (the item's name / ID) to enable the button. */
  typeToConfirm?: string;
  /**
   * Quick repeated changes (registers): the admin may tick "Don't ask again on
   * this page" — later calls with the same key resolve at once until they leave the page.
   */
  rememberKey?: string;
};

type Request = ConfirmOptions & { resolve: (ok: boolean) => void };

type ConfirmState = { request: Request | null };

export const useConfirmStore = create<ConfirmState>()(() => ({ request: null }));

/** Keys the admin chose not to be asked about again — cleared when the page changes. */
export const rememberedConfirms = new Set<string>();

/**
 * Ask before any change. Resolves true when confirmed.
 *
 *   if (!(await confirmAction({ title: "Cancel meeting?", description: "…" }))) return;
 *
 * Rendered by <ConfirmHost /> in the dashboard shell.
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (options.rememberKey && rememberedConfirms.has(options.rememberKey)) return Promise.resolve(true);
  return new Promise((resolve) => {
    // A newer request replaces an unanswered one (which counts as cancelled).
    useConfirmStore.getState().request?.resolve(false);
    useConfirmStore.setState({ request: { tone: "primary", confirmLabel: "Confirm", ...options, resolve } });
  });
}
