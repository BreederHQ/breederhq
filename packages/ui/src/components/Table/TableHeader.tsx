import * as React from "react";
import { cn } from "../../utils/cn";
import { StickyRightCtx } from "./TableContext";

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
  selectAll?: TableHeaderSelectAll;
  className?: string;
};

export function TableHeader({
  columns,
  sorts,
  onToggleSort,
  selectAll,
  className,
}: Props) {
  const thBase =
    "px-3 py-3 text-sm whitespace-nowrap border-b border-hairline bg-surface-strong";
  const wrap = cn("sticky top-0 z-10 bg-surface-strong", className);
  const sortFor = (key: string) => sorts.find((s) => s.key === key);

  const { render: renderStickyRight } = React.useContext(StickyRightCtx);

  return (
    <thead className={wrap}>
      <tr className="text-sm">
        {selectAll && (
          <th
            className={thBase}
            style={{ width: selectAll.widthPx ?? 40, textAlign: "center" }}
            scope="col"
            role="columnheader"
          >
            <input
              ref={selectAll.inputRef as any}
              type="checkbox"
              aria-label="Select all"
              checked={selectAll.checked}
              onChange={selectAll.onChange}
              className="h-4 w-4 rounded border-hairline bg-surface"
            />
          </th>
        )}

        {columns.map((c) => {
          const active = sortFor(c.key);
          const ariaSort: "ascending" | "descending" | "none" =
            active ? (active.dir === "asc" ? "ascending" : "descending") : "none";
          const sortable = c.sortable !== false;

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
                  onClick={(e) =>
                    onToggleSort(c.key, { shiftKey: (e as React.MouseEvent).shiftKey })
                  }
                  title={active ? `${c.label} (${active.dir})` : `Sort by ${String(c.label)}`}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-1 select-none",
                    "rounded-md px-2 py-1 focus:outline-none",
                    "hover:bg-white/5 focus:bg-white/5",
                    active ? "text-primary" : "text-secondary",
                    c.center ? "text-center" : "text-left"
                  )}
                >
                  <span className={c.center ? "" : "mr-auto"}>{c.label}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      active ? "bg-[hsl(var(--brand-orange))]" : "bg-transparent"
                    )}
                  />
                </button>
              ) : (
                <div className={cn(c.center ? "text-center" : "text-left")}>{c.label}</div>
              )}
            </th>
          );
        })}

        {/* sticky-right header cell (unchanged except for wrapper class) */}
        {renderStickyRight ? (
          <th
            scope="col"
            role="columnheader"
            className="p-0 sticky right-0 z-20 bg-surface-strong bhq-util"
            style={{ width: "var(--util-col-width)" }}
          >
            <div className="relative z-10 pr-1 bhq-columns-trigger"
              style={{ transform: "translateX(calc(-1 * var(--util-nudge)))" }}>
              {renderStickyRight()}
            </div>
          </th>
        ) : null}
      </tr>
    </thead>
  );
}

export default TableHeader;
