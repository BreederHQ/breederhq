import * as React from "react";
import { cn } from "../../utils/cn"; // adjust path if needed

export type SortDir = "asc" | "desc";
export type SortRule = { key: string; dir: SortDir };

export type ColumnDef = {
  key: string;
  label: React.ReactNode;
  center?: boolean;
  sortable?: boolean;   // default true
  widthPx?: number;     // optional fixed width
};

type Props = {
  /** Rendered columns (already filtered to “visible”). */
  columns: ColumnDef[];

  /** Current multi-sort rules. */
  sorts: SortRule[];

  /** Called when user clicks a column header. Provide next rule for that key (supports shift to multi-sort). */
  onToggleSort: (key: string, ev?: { shiftKey?: boolean }) => void;

  /** Select-all checkbox state + ref for indeterminate. */
  selectAll?: {
    checked: boolean;
    indeterminate?: boolean;
    inputRef?: React.Ref<HTMLInputElement>;
    onChange: () => void;
    widthPx?: number; // default 40
  };

  /** Optional “columns” control (e.g., your ColumnsPopover). */
  renderColumnsButton?: () => React.ReactNode;
  columnsButtonWidthPx?: number; // default 56

  /** Visuals */
  sticky?: boolean; // default true
  className?: string;
};

export function TableHeader({
  columns,
  sorts,
  onToggleSort,
  selectAll,
  renderColumnsButton,
  columnsButtonWidthPx = 56,
  sticky = true,
  className,
}: Props) {
  const thBase =
    "px-3 py-3 text-sm whitespace-nowrap border-b border-hairline bg-surface-strong";
  const wrap = cn(
    sticky ? "sticky top-0 z-10" : "",
    "bg-surface-strong",
    className
  );

  const sortFor = (key: string) => sorts.find(s => s.key === key);

  return (
    <thead className={wrap}>
      <tr className="text-sm">
        {selectAll && (
          <th
            className={thBase}
            style={{ width: selectAll.widthPx ?? 40, textAlign: "center" }}
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

        {columns.map(c => {
          const active = sortFor(c.key);
          const ariaSort = active
            ? active.dir === "asc"
              ? ("ascending" as const)
              : ("descending" as const)
            : ("none" as const);
          const sortable = c.sortable !== false;

          return (
            <th
              key={c.key}
              className={thBase}
              style={{
                width: c.widthPx,
                textAlign: c.center ? "center" : "left",
              }}
            >
              {sortable ? (
                <button
                  type="button"
                  aria-sort={ariaSort as any}
                  onClick={(e) =>
                    onToggleSort(c.key, { shiftKey: (e as any).shiftKey })
                  }
                  title={
                    active
                      ? `${c.label} (${active.dir})`
                      : `Sort by ${String(c.label)}`
                  }
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-1 select-none",
                    "rounded-md px-2 py-1 focus:outline-none",
                    "hover:bg-white/5 focus:bg-white/5",
                    active ? "text-primary" : "text-secondary",
                    c.center ? "text-center" : "text-left"
                  )}
                >
                  <span className={c.center ? "" : "mr-auto"}>{c.label}</span>
                  {/* indicator: tiny dot; swap for ▲/▼ if you like */}
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      active ? "bg-[hsl(var(--brand-orange))]" : "bg-transparent"
                    )}
                  />
                </button>
              ) : (
                <div className={cn(c.center ? "text-center" : "text-left")}>
                  {c.label}
                </div>
              )}
            </th>
          );
        })}

        {renderColumnsButton && (
          <th
            className={thBase}
            style={{ width: columnsButtonWidthPx, textAlign: "center" }}
          >
            {renderColumnsButton()}
          </th>
        )}
      </tr>
    </thead>
  );
}
