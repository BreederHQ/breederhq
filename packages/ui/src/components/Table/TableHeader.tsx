import * as React from "react";
import { cn } from "../../utils/cn";
import { StickyRightCtx } from "./TableContext";
import { TableSelectCtx } from "./TableSelectCtx";

type SortDir = "asc" | "desc";
type SortRule = { key: string; dir: SortDir };

export type TableHeaderColumn = {
  key: string;
  label: React.ReactNode;
  widthPx?: number;
  center?: boolean;
  sortable?: boolean;
};

export type TableHeaderSelectAll = {
  widthPx?: number;
  inputRef?: React.Ref<HTMLInputElement>;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

type Props = {
  columns: TableHeaderColumn[];
  sorts: SortRule[];
  onToggleSort: (key: string, opts?: { shiftKey?: boolean }) => void;

  /** Legacy prop. Ignored when selection context is available. */
  selectAll?: TableHeaderSelectAll;

  /** NEW: vertical align of the select-all checkbox cell. Default "middle". */
  selectAllVAlign?: "middle" | "bottom";

  className?: string;
};

export function TableHeader({
  columns,
  sorts,
  onToggleSort,
  selectAll: legacySelectAll,
  selectAllVAlign = "middle",
  className,
}: Props) {
  const thBase =
    "px-3 py-3 text-sm whitespace-nowrap border-b border-hairline bg-surface-strong";
  const wrap = cn("sticky top-0 z-10 bg-surface-strong", className);
  const sortFor = (key: string) => sorts.find((s) => s.key === key);

  const { render: renderStickyRight } = React.useContext(StickyRightCtx);

  // Auto selection cell (from context)
  const { selectable, pageIds, selected, setAllOnPage } = React.useContext(TableSelectCtx);

  const allOnPage = selectable && pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = selectable && pageIds.some((id) => selected.has(id));
  const indeterminate = selectable && !allOnPage && someOnPage;

  const autoRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (autoRef.current) autoRef.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  const sortIndex = (key: string) => {
    const idx = sorts.findIndex((s) => s.key === key);
    return idx >= 0 ? idx + 1 : null;
  };

  const onKeyActivate = (e: React.KeyboardEvent<HTMLButtonElement>, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleSort(key, { shiftKey: e.shiftKey });
    }
  };

  // helper classes to bottom-align the checkbox neatly
  const vAlignClass =
    selectAllVAlign === "bottom" ? "align-bottom pt-2 pb-1" : "";

  const selectAllNode = selectable ? (
    <th
      className={cn(thBase, vAlignClass)}
      style={{ width: 40, textAlign: "center" }}
      scope="col"
      role="columnheader"
    >
      <input
        ref={autoRef}
        type="checkbox"
        aria-label="Select all on page"
        checked={!!allOnPage}
        onChange={(e) => setAllOnPage(e.currentTarget.checked)}
        className="h-4 w-4 rounded border-hairline bg-surface"
      />
    </th>
  ) : legacySelectAll ? (
    <th
      className={cn(thBase, vAlignClass)}
      style={{ width: legacySelectAll.widthPx ?? 40, textAlign: "center" }}
      scope="col"
      role="columnheader"
    >
      <input
        ref={legacySelectAll.inputRef as any}
        type="checkbox"
        aria-label="Select all"
        checked={legacySelectAll.checked}
        onChange={legacySelectAll.onChange}
        className="h-4 w-4 rounded border-hairline bg-surface"
      />
    </th>
  ) : null;

  return (
    <thead className={wrap}>
      <tr className="text-sm">
        {selectAllNode}

        {columns.map((c) => {
          const active = sortFor(c.key);
          const ariaSort: "ascending" | "descending" | "none" =
            active ? (active.dir === "asc" ? "ascending" : "descending") : "none";
          const sortable = c.sortable !== false;
          const order = sortIndex(c.key);

          return (
            <th
              key={c.key}
              className={thBase}
              style={{ width: c.widthPx, textAlign: c.center ? "center" : "left" }}
              scope="col"
              role="columnheader"
              aria-sort={ariaSort}
            >
              {sortable ? (
                <button
                  type="button"
                  onClick={(e) => onToggleSort(c.key, { shiftKey: (e as React.MouseEvent).shiftKey })}
                  onKeyDown={(e) => onKeyActivate(e, c.key)}
                  title={
                    active
                      ? `${String(c.label)} (${active.dir}) — ${order ? `priority ${order}` : "primary"}`
                      : `Sort by ${String(c.label)}`
                  }
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 select-none",
                    "rounded-md px-2 py-1 focus:outline-none",
                    "hover:bg-white/5 focus:bg-white/5",
                    active ? "text-primary" : "text-secondary",
                    c.center ? "text-center" : "text-left"
                  )}
                  aria-label={
                    active
                      ? `${String(c.label)} sorted ${active.dir}${order ? `, priority ${order}` : ""}`
                      : `Sort by ${String(c.label)}`
                  }
                >
                  <span className={c.center ? "" : "mr-auto"}>{c.label}</span>
                  {active ? (
                    <span aria-hidden className="text-xs">{active.dir === "asc" ? "▲" : "▼"}</span>
                  ) : (
                    <span aria-hidden className="text-xs opacity-0">▲</span>
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-sm text-[10px] leading-none",
                      order ? "bg-[hsl(var(--brand-orange))] text-black" : "bg-transparent"
                    )}
                  >
                    {order ?? ""}
                  </span>
                </button>
              ) : (
                <div className={cn(c.center ? "text-center" : "text-left")}>{c.label}</div>
              )}
            </th>
          );
        })}

        {renderStickyRight ? (
          <th
            scope="col"
            role="columnheader"
            className="p-0 sticky right-0 z-20 bg-surface-strong bhq-util"
            style={{ width: "var(--util-col-width)" }}
          >
            <div
              className="relative z-10 pr-1 bhq-columns-trigger"
              style={{ transform: "translateX(calc(-1 * var(--util-nudge)))" }}
            >
              {renderStickyRight()}
            </div>
          </th>
        ) : null}
      </tr>
    </thead>
  );
}

export default TableHeader;
