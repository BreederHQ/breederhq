import React from "react";
import { cn } from "../../utils/cn";
import { StickyRightCtx } from "./TableContext";

type RowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  selectable?: boolean;
  selected?: boolean;
  /** Optional trailing cell content (rare). Pass a <td>…</td> here. */
  trailingCell?: React.ReactNode | null;
};

export function TableRow({
  selectable,
  selected,
  className,
  children,
  trailingCell = null,
  ...rest
}: RowProps) {
  const { render: renderStickyRight } = React.useContext(StickyRightCtx);

  return (
    <tr
      {...rest}
      className={cn(
        "transition-colors",
        selectable && "cursor-pointer hover:bg-[hsl(var(--brand-orange))]/8",
        selected && "bg-[hsl(var(--brand-orange))]/10",
        className
      )}
    >
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
