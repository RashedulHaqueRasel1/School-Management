"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

/** Page numbers with ellipses, e.g. 1 … 4 5 6 … 12 */
function pageList(current: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1]! > 1 ? ["…" as const, p] : [p]));
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
}: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const navButton =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-surface text-fg-secondary transition hover:bg-subtle disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-fg-muted">
        <span>
          Showing <span className="font-semibold text-fg">{from}</span>–<span className="font-semibold text-fg">{to}</span> of{" "}
          <span className="font-semibold text-fg">{total}</span>
        </span>
        {onPageSizeChange && (
          <Select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 w-[108px] text-xs"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" className={navButton} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageList(page, lastPage).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="w-6 text-center text-sm text-fg-subtle">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition",
                p === page
                  ? "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-glow"
                  : "text-fg-secondary hover:bg-soft",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={navButton} disabled={page >= lastPage} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
