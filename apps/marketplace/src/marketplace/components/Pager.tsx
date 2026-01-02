// apps/marketplace/src/marketplace/components/Pager.tsx
import * as React from "react";

interface PagerProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Pagination controls with Previous/Next and page indicator.
 */
export function Pager({ page, totalPages, onPrev, onNext }: PagerProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-white/70">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
