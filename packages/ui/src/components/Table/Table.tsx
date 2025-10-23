import * as React from "react";
import clsx from "clsx";
import { TableProvider } from "./TableContext";
import { StickyRightCtx } from "./TableContext";
import { useTableController } from "../../hooks/useTableController";
import type { ID as RowID } from "../../hooks/useTableController";
import { TableSelectCtx, RowId } from "./TableSelectCtx";

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

  /** Optional: controlled selection API */
  selectedIds?: Array<RowId>;
  onSelectionChange?: (ids: Array<RowId>) => void;

  /** Optional: bulk actions bar renderer (shown when anything selected) */
  renderBulkActions?: (args: { selectedIds: Array<RowId>; clear: () => void }) => React.ReactNode;
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
  selectedIds,
  onSelectionChange,
  renderBulkActions,
}: TableProps<K, TID>) {
  // Memoize options to avoid re-creating the controller on every render.
  const controllerOpts = React.useMemo(() => {
    const base: any = { columns };
    if (getRowId) base.getRowId = getRowId;
    if (pageSize) base.pageSize = pageSize;
    return base;
  }, [columns, getRowId, pageSize]);

  const auto = useTableController<K, TID>(controllerOpts);
  const ctrl = controller ?? auto;

  // -------- Selection state (controlled or internal) ----------
  const [internalSel, setInternalSel] = React.useState<Set<RowId>>(new Set());
  const selected = React.useMemo(
    () => (selectedIds ? new Set<RowId>(selectedIds) : internalSel),
    [selectedIds, internalSel]
  );

  const setSelectedArray = React.useCallback(
    (ids: RowId[]) => {
      if (onSelectionChange) onSelectionChange(ids);
      else setInternalSel(new Set(ids));
    },
    [onSelectionChange]
  );

  const toggleOne = React.useCallback(
    (id: RowId) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedArray(Array.from(next));
    },
    [selected, setSelectedArray]
  );

  // -------- Current page id collection ----------
  // Rows call registerRowId(id) during render; we snapshot once per commit.
  const seenThisRenderRef = React.useRef<Set<RowId>>(new Set());
  seenThisRenderRef.current = new Set(); // reset at start of render

  const registerRowId = React.useCallback((id: RowId) => {
    seenThisRenderRef.current.add(id);
  }, []);

  const [pageIds, setPageIds] = React.useState<RowId[]>([]);
  React.useLayoutEffect(() => {
    const next = Array.from(seenThisRenderRef.current);
    // Only update if changed (avoid render->effect->render loops)
    const sameLength = next.length === pageIds.length;
    const sameOrder = sameLength && next.every((v, i) => v === pageIds[i]);
    if (!sameOrder) setPageIds(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const setAllOnPage = React.useCallback(
    (checked: boolean) => {
      if (!pageIds.length) return;
      const next = new Set(selected);
      if (checked) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      setSelectedArray(Array.from(next));
    },
    [pageIds, selected, setSelectedArray]
  );

  const selectable = typeof getRowId === "function";
  const hasSelection = selected.size > 0 && !!renderBulkActions;

  const stickyCtxValue = React.useMemo(
    () => ({ widthPx: stickyRightWidthPx, render: renderStickyRight }),
    [stickyRightWidthPx, renderStickyRight]
  );

  return (
    <TableProvider controller={ctrl}>
      <StickyRightCtx.Provider value={stickyCtxValue}>
        <TableSelectCtx.Provider
          value={{
            selectable,
            getRowId: getRowId as any,
            pageIds,
            registerRowId,
            selected,
            setSelectedArray,
            toggleOne,
            setAllOnPage,
            renderBulkActions,
          }}
        >
          <div
            className={clsx("bhq-table relative", className)}
            style={{
              ["--util-nudge" as any]: "-8px",
              ["--util-col-width" as any]: "40px",
            }}
          >
            {/* Bulk actions bar (only if renderer provided and >0 selected) */}
            {hasSelection && (
              <div className="sticky top-0 z-50 border-b border-hairline bg-surface-strong/80 backdrop-blur px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <strong>{selected.size}</strong> selected
                  </div>
                  <div className="ml-auto">
                    {renderBulkActions!({
                      selectedIds: Array.from(selected),
                      clear: () => setSelectedArray([]),
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <div className="min-w-max">{children}</div>
            </div>
          </div>
        </TableSelectCtx.Provider>
      </StickyRightCtx.Provider>
    </TableProvider>
  );
}
