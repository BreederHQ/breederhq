// packages/ui/src/components/Table/TablePagination.tsx
import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../Button";

export type TablePaginationProps = {
  /** 0-based current page */
  page: number;
  /** rows per page */
  pageSize: number;
  /** total row count */
  total: number;

  /** change callbacks */
  onPageChange: (next: number) => void;
  onPageSizeChange?: (size: number) => void;

  /** page size menu options (defaults provided) */
  pageSizeOptions?: number[];

  className?: string;
};

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize || 1)));
  const clampedPage = Math.min(Math.max(0, page || 0), pageCount - 1);

  const canPrev = clampedPage > 0;
  const canNext = clampedPage < pageCount - 1;

  const start = total === 0 ? 0 : clampedPage * pageSize + 1;
  const end = Math.min(total, (clampedPage + 1) * pageSize);

  const goPrev = () => canPrev && onPageChange(clampedPage - 1);
  const goNext = () => canNext && onPageChange(clampedPage + 1);
  const goFirst = () => canPrev && onPageChange(0);
  const goLast = () => canNext && onPageChange(pageCount - 1);

  return (
    <div
      className={cn(
        "flex items-center gap-2 justify-between px-2 py-2 text-sm border-t border-hairline",
        className
      )}
      role="navigation"
      aria-label="Table pagination"
    >
      {/* left: rows per page */}
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <>
            <span className="text-secondary">Rows per page</span>
            <select
              className="h-8 rounded-md bg-surface border border-hairline px-2"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(parseInt(e.currentTarget.value, 10))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* middle: range */}
      <div className="text-secondary tabular-nums">
        {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </div>

      {/* right: paginator */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="First page"
          disabled={!canPrev}
          onClick={goFirst}
          className="h-8 w-8"
          title="First page"
        >
          «
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Previous page"
          disabled={!canPrev}
          onClick={goPrev}
          className="h-8 w-8"
          title="Previous page"
        >
          ‹
        </Button>

        <span className="mx-2 tabular-nums">
          {pageCount === 0 ? 0 : clampedPage + 1} / {pageCount}
        </span>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Next page"
          disabled={!canNext}
          onClick={goNext}
          className="h-8 w-8"
          title="Next page"
        >
          ›
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Last page"
          disabled={!canNext}
          onClick={goLast}
          className="h-8 w-8"
          title="Last page"
        >
          »
        </Button>
      </div>
    </div>
  );
}

export default TablePagination;
