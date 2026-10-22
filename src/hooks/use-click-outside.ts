"use client";

import { useEffect, useRef } from "react";

/** Calls `onOutside` on a pointer-down outside the returned ref, or on Escape. */
export function useClickOutside<T extends HTMLElement>(onOutside: () => void, enabled = true) {
  const ref = useRef<T>(null);
  const handlerRef = useRef(onOutside);

  useEffect(() => {
    handlerRef.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    if (!enabled) return;

    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) handlerRef.current();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handlerRef.current();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  return ref;
}
