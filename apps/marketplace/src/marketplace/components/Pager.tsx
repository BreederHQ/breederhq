// apps/marketplace/src/marketplace/components/Pager.tsx
// Portal-aligned button styling

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
 * Pagination controls with Portal-aligned styling.
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
  const showingText = total > 0 ? `${start}–${end} of ${total}` : "";

  const content = (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="px-3 py-1.5 rounded-portal-xs bg-border-default border border-border-subtle text-[13px] font-medium text-white hover:bg-portal-card-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        Prev
      </button>
      <span className="text-[13px] text-text-tertiary whitespace-nowrap">
        {showingText}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className="px-3 py-1.5 rounded-portal-xs bg-border-default border border-border-subtle text-[13px] font-medium text-white hover:bg-portal-card-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    <div className="rounded-portal border border-border-subtle bg-portal-card p-4">
      <div className="flex items-center justify-center">{content}</div>
    </div>
  );
}
