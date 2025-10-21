// packages/ui/src/components/Table/TableCell.tsx
import React from "react";
import { cn } from "../../utils/cn";

type Align = "left" | "center" | "right";

type CellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: Align;
};

export function TableCell({ align = "left", className, ...rest }: CellProps) {
  return (
    <td
      {...rest}
      className={cn(
        "px-3 py-2 text-sm",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    />
  );
}
