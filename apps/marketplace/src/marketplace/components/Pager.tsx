// apps/marketplace/src/marketplace/components/Pager.tsx
import * as React from "react";

interface PagerProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
  /** Inline mode renders without wrapper card, for use in header rows */
  inline?: boolean;
}

/**
 * Pagination controls with Previous/Next and "Showing X-Y of Z".
 */
export function Pager({
  page,
  totalPages,
  total,
  limit,
  onPrev,
  onNext,
  inline = false,
}: PagerProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Calculate showing range
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const showingText = total > 0 ? `Showing ${start}–${end} of ${total}` : "";

  const content = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        Prev
      </button>
      <span className="text-sm text-white/60 whitespace-nowrap">
        {showingText}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-center">{content}</div>
    </div>
  );
}
