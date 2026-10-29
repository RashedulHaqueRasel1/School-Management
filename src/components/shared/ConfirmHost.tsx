"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { rememberedConfirms, useConfirmStore } from "@/store/confirm.store";

import { ConfirmDialog } from "./ConfirmDialog";

/** Renders confirmAction() requests. Mounted once in the dashboard shell. */
export function ConfirmHost() {
  const request = useConfirmStore((s) => s.request);
  const pathname = usePathname();

  // "Don't ask again on this page" lasts until the admin navigates away.
  useEffect(() => {
    rememberedConfirms.clear();
  }, [pathname]);

  const finish = (ok: boolean) => {
    request?.resolve(ok);
    useConfirmStore.setState({ request: null });
  };

  return (
    <ConfirmDialog
      key={request ? `${request.title}-${request.typeToConfirm ?? ""}` : "none"}
      open={Boolean(request)}
      title={request?.title ?? ""}
      description={request?.description ?? ""}
      confirmLabel={request?.confirmLabel}
      tone={request?.tone}
      typeToConfirm={request?.typeToConfirm}
      onRemember={request?.rememberKey ? () => rememberedConfirms.add(request.rememberKey!) : undefined}
      onConfirm={() => finish(true)}
      onClose={() => {
        // onClose also runs after onConfirm; only an unanswered request is a cancel.
        if (useConfirmStore.getState().request === request) finish(false);
      }}
    />
  );
}
