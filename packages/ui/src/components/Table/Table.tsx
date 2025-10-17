import * as React from "react";
import { TableProvider } from "./TableContext";

export type TableProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export function Table(props: TableProps) {
  const { children, className = "", ...rest } = props;
  return (
    <TableProvider>
      <div className={["bhq-table", className].join(" ")} {...rest}>
        {children}
      </div>
    </TableProvider>
  );
}
