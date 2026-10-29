"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type ConfirmTone = "danger" | "primary";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** "danger" (delete, archive, release…) or "primary" (any other change). Default: danger. */
  tone?: ConfirmTone;
  /**
   * Deletes must be typed out: the button stays disabled until the admin types
   * this value (the item's name or ID) exactly.
   */
  typeToConfirm?: string;
  /** Offer "Don't ask again on this page" (registers with many quick changes). */
  onRemember?: () => void;
};

/**
 * Confirmation step used across the whole admin dashboard — no change happens
 * on a single click. Deletes additionally require typing the item's name.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Delete", tone = "danger", typeToConfirm, onRemember }: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [remember, setRemember] = useState(false);
  const matches = !typeToConfirm || typed.trim().toLowerCase() === typeToConfirm.trim().toLowerCase();
  const close = () => {
    setTyped("");
    setRemember(false);
    onClose();
  };
  const danger = tone === "danger";

  return (
    <Dialog
      open={open}
      onClose={close}
      size="sm"
      title={title}
      description={description}
      icon={
        danger ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        )
      }
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={!matches}
            onClick={() => {
              if (!matches) return;
              if (remember) onRemember?.();
              onConfirm();
              close();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {(typeToConfirm || onRemember) && (
        <div className="space-y-3">
          {typeToConfirm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!matches) return;
                onConfirm();
                close();
              }}
            >
              <label className="block text-sm text-fg-secondary">
                This can&apos;t be undone. Type <span className="select-all rounded bg-soft px-1.5 py-0.5 font-mono text-[13px] font-semibold text-fg">{typeToConfirm}</span> to confirm.
              </label>
              <Input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={typeToConfirm} className="mt-2" aria-label={`Type ${typeToConfirm} to confirm`} invalid={typed.length > 0 && !matches} />
            </form>
          )}
          {onRemember && (
            <label className="flex items-center gap-2.5 text-sm text-fg-secondary">
              <Checkbox checked={remember} onCheckedChange={setRemember} aria-label="Don't ask again on this page" />
              Don&apos;t ask again on this page
            </label>
          )}
        </div>
      )}
    </Dialog>
  );
}
