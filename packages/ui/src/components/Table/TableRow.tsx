import React from "react";
import { cn } from "../../utils/cn";

type RowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  selectable?: boolean;
  selected?: boolean;
};

export function TableRow({ selectable, selected, className, ...rest }: RowProps) {
  return (
    <tr
      {...rest}
      className={cn(
        "transition-colors",
        selectable && "cursor-pointer hover:bg-[hsl(var(--brand-orange))]/8",
        selected && "bg-[hsl(var(--brand-orange))]/10",
        className
      )}
    />
  );
}
