"use client";

import { useEffect, useRef } from "react";

// Open overlays, innermost last. Shared so stacked overlays (a dialog on top of
// a sheet) lock scroll once and only the top one reacts to Escape.
const stack: symbol[] = [];

/** While `open`: lock page scroll and call `onClose` on Escape (top overlay only). */
export function useOverlay(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const id = Symbol("overlay");
    stack.push(id);
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && stack[stack.length - 1] === id) onCloseRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      stack.splice(stack.indexOf(id), 1);
      if (stack.length === 0) document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
}
