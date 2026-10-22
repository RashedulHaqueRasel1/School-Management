"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";

export type ActionMenuItem =
  | { type?: "item"; label: string; icon: LucideIcon; onSelect: () => void; danger?: boolean; disabled?: boolean }
  | { type: "separator" };

type ActionMenuProps = {
  items: ActionMenuItem[];
  label: string;
};

const MENU_WIDTH = 208;
const MENU_MAX_HEIGHT = 320;

/**
 * "⋯" row-actions menu. Rendered in a portal with fixed positioning so it is
 * never clipped by scrollable table containers.
 */
export function ActionMenu({ items, label }: ActionMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const close = () => setPosition(null);
  const menuRef = useClickOutside<HTMLDivElement>(close, position !== null);
  const isOpen = position !== null;

  // A fixed-position menu would drift away from its row, so close it on scroll/resize.
  useEffect(() => {
    if (!isOpen) return;
    const onScrollOrResize = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setPosition(null);
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, menuRef]);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (position) return close();
    const rect = event.currentTarget.getBoundingClientRect();
    const openUp = rect.bottom + MENU_MAX_HEIGHT > window.innerHeight;
    setPosition({
      top: openUp ? Math.max(8, rect.top - 6) : rect.bottom + 6,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
    if (openUp) {
      // Measure after paint and shift up by the real menu height.
      requestAnimationFrame(() => {
        const height = menuRef.current?.offsetHeight ?? 0;
        setPosition({ top: Math.max(8, rect.top - 6 - height), left: Math.max(8, rect.right - MENU_WIDTH) });
      });
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={position !== null}
        // Keep the outside-click listener from closing the menu before `toggle` runs.
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggle}
        className={cn(
          "rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-fg",
          position && "bg-soft text-fg",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onClick={(e) => e.stopPropagation()}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-[90] animate-dropdown overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-popover"
          >
            {items.map((item, i) => {
              if (item.type === "separator") return <div key={`sep-${i}`} className="my-1 h-px bg-line" />;
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    close();
                    item.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition disabled:pointer-events-none disabled:opacity-40",
                    item.danger
                      ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400"
                      : "text-fg-secondary hover:bg-soft hover:text-fg",
                  )}
                >
                  <Icon className={cn("h-4 w-4", item.danger ? "" : "text-fg-subtle")} />
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
