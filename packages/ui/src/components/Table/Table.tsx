import * as React from "react";
import clsx from "clsx";
import { TableProvider } from "./TableContext";
import { StickyRightCtx } from "./TableContext";
import { useTableController } from "../../hooks/useTableController";
import type { ID as RowID } from "../../hooks/useTableController";

export type TableColumn<K extends string = string> = {
  key: K;
  label: React.ReactNode;
};

export type TableProps<K extends string = string, TID extends RowID = RowID> = {
  controller?: ReturnType<typeof useTableController<K, TID>>;
  columns?: Array<TableColumn<K>>;
  getRowId?: (row: any) => TID;
  pageSize?: number;
  className?: string;
  children: React.ReactNode;

  /** Shared sticky-right rail (header-only). When null, the rail is hidden. */
  renderStickyRight?: (() => React.ReactNode) | null;
  /** Visual width of the sticky-right rail (px). Default 36. */
  stickyRightWidthPx?: number;
};

export function Table<K extends string = string, TID extends RowID = RowID>({
  controller,
  columns = [],
  getRowId,
  pageSize,
  className,
  children,
  renderStickyRight = null,
  stickyRightWidthPx = 36,
}: TableProps<K, TID>) {
  const auto = useTableController<K, TID>({
    columns: columns as any,
    ...(getRowId ? { getRowId } : {}),
    ...(pageSize ? { pageSize } : {}),
  } as any);
  const ctrl = controller ?? auto;

  return (
    <TableProvider controller={ctrl}>
      <StickyRightCtx.Provider value={{ widthPx: stickyRightWidthPx, render: renderStickyRight }}>
        <div
          className={clsx("bhq-table relative", className)}
          style={{ ["--util-nudge" as any]: "-8px", ["--util-col-width" as any]: "40px" }}
        >
          <div className="overflow-x-auto">
            <div className="min-w-max">{children}</div>
          </div>
        </div>
      </StickyRightCtx.Provider>
    </TableProvider>
  );
}
