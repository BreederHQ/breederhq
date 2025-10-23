import * as React from "react";
import { cn } from "../../utils/cn";
import { StickyRightCtx } from "./TableContext";
import { useTableDetails } from "../Drawer/DetailsHost";
import { TableSelectCtx } from "./TableSelectCtx";

type RowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  /** legacy compatibility only */
  selectable?: boolean;
  selected?: boolean;

  /** Optional trailing cell content (rare). Pass a <td>…</td> here. */
  trailingCell?: React.ReactNode | null;

  /** Full row object to enable details drawer click and selection id lookup. */
  detailsRow?: unknown;
};

export function TableRow({
  selectable: selectableProp,
  selected: selectedProp,
  className,
  children,
  trailingCell = null,
  detailsRow,
  onClick,
  ...rest
}: RowProps) {
  const { render: renderStickyRight } = React.useContext(StickyRightCtx);

  // Details drawer context. If present and a detailsRow is provided, this row is clickable.
  const details = useTableDetails<any>();
  const canOpenDetails = Boolean(details?.enabled && detailsRow && details?.open);

  // Selection context (auto)
  const {
    selectable: selectableCtx,
    getRowId,
    registerRowId,
    selected,
    toggleOne,
  } = React.useContext(TableSelectCtx);

  const selectable = selectableCtx || !!selectableProp;

  // row id from table getRowId
  const rowId = React.useMemo(() => {
    if (getRowId && detailsRow != null) {
      try { return getRowId(detailsRow as any); } catch { return undefined; }
    }
    return undefined;
  }, [getRowId, detailsRow]);

  // Report this row into the current render’s page-id set
  if (selectableCtx && rowId !== undefined) {
    registerRowId(rowId as any); // safe: writes to a ref, no state updates here
  }

  const isSelected = rowId !== undefined
    ? selected.has(rowId as any)
    : !!selectedProp;

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (canOpenDetails) details.open!(detailsRow);
    if (onClick) onClick(e);
  };

  return (
    <tr
      {...rest}
      onClick={handleClick}
      className={cn(
        "transition-colors",
        (selectable || canOpenDetails) && "cursor-pointer hover:bg-[hsl(var(--brand-orange))]/8",
        isSelected && "bg-[hsl(var(--brand-orange))]/10",
        className
      )}
    >
      {/* auto checkbox cell */}
      {selectable && (
        <td className="px-3 py-2 text-center border-b border-hairline" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            aria-label="Select row"
            className="h-4 w-4 rounded border-hairline bg-surface"
            checked={!!isSelected}
            onChange={() => {
              if (rowId !== undefined) toggleOne(rowId as any);
            }}
          />
        </td>
      )}

      {children}

      {renderStickyRight ? (
        <td
          className="p-0 sticky right-0 z-10 bg-surface bhq-util"
          style={{ width: "var(--util-col-width)" }}
        >
          <div className="h-full bhq-util-inner" />
        </td>
      ) : trailingCell ? (
        <>{trailingCell}</>
      ) : null}
    </tr>
  );
}
