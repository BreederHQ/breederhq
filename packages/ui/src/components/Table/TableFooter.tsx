// packages/ui/src/components/Table/TableFooter.tsx
import * as React from "react";
import "../../styles/table-footer.css";

export type TableFooterProps = {
  entityLabel?: string;

  // pagination
  page: number;            // 1-based
  pageCount: number;       // >= 1
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;

  // counts
  start: number;
  end: number;
  filteredTotal: number;
  total: number;

  // extension points
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;

  // archived toggle
  includeArchived?: boolean;
  onIncludeArchivedChange?: (checked: boolean) => void;
  includeArchivedLabel?: string; // defaults to "Show archived"
};

export function TableFooter({
  entityLabel = "items",

  page,
  pageCount,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,

  start,
  end,
  filteredTotal,
  total,

  leftSlot,
  rightSlot,

  includeArchived,
  onIncludeArchivedChange,
  includeArchivedLabel = "Show archived",
}: TableFooterProps) {
  // guards so we never render "undefined"
  const asInt = (v: unknown, fb: number) =>
    Number.isFinite(v as number) ? (v as number) : fb;

  const safePageSize  = Math.max(1, asInt(pageSize, 25));
  const safePageCount = Math.max(1, asInt(pageCount, 1));
  const safePage      = Math.max(1, Math.min(asInt(page, 1), safePageCount));

  const safeTotal     = Math.max(0, asInt(total, 0));
  const safeFiltered  = Math.max(0, asInt(filteredTotal, 0));

  const computedStart = safeFiltered === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const computedEnd   = safeFiltered === 0 ? 0 : Math.min(safeFiltered, computedStart - 1 + safePageSize);

  const safeStart     = Math.max(0, asInt(start, computedStart));
  const safeEnd       = Math.max(0, asInt(end, computedEnd));

  const canPrev = safePage > 1;
  const canNext = safePage < safePageCount;

  return (
    <div className="bhq-table-footer">
      {/* LEFT column: range on first row, archived toggle below */}
      <div className="bhq-table-footer__left">
        <div className="bhq-table-footer__left-top">
          <span className="bhq-table-footer__range">
            {`Showing ${safeStart} to ${safeEnd} of ${safeFiltered}`}
            {safeFiltered !== safeTotal ? ` (filtered from ${safeTotal} ${entityLabel})` : ""}
          </span>
          {leftSlot}
        </div>

        {onIncludeArchivedChange != null && includeArchived != null && (
          <label className="bhq-table-footer__include-archived">
            <input
              type="checkbox"
              checked={!!includeArchived}
              onChange={(e) => onIncludeArchivedChange(e.currentTarget.checked)}
            />
            <span>{includeArchivedLabel}</span>
          </label>
        )}
      </div>

      {/* RIGHT: rows-per-page + pager */}
      <div className="bhq-table-footer__right">
        <label className="bhq-table-footer__pagesize">
          <span>Rows</span>
          <select
            value={safePageSize}
            onChange={(e) => onPageSizeChange(Number(e.currentTarget.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <nav className="bhq-table-footer__pager" aria-label="Pagination">
          <button type="button" disabled={!canPrev} onClick={() => canPrev && onPageChange(safePage - 1)}>
            Prev
          </button>
          <span className="bhq-table-footer__pageinfo">{`Page ${safePage} of ${safePageCount}`}</span>
          <button type="button" disabled={!canNext} onClick={() => canNext && onPageChange(safePage + 1)}>
            Next
          </button>
        </nav>

        {rightSlot}
      </div>
    </div>
  );
}

export default TableFooter;
