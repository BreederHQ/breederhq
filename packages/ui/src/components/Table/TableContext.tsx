// shared/table/TableContext.tsx
import * as React from "react";
import { useTableController } from "@bhq/ui/hooks/useTableController";

export type TableController<K extends string, ID = string | number> =
  ReturnType<typeof useTableController<K, ID>>;

const Ctx = React.createContext<TableController<any, any> | null>(null);

export function TableProvider<K extends string, ID>(props: {
  controller: TableController<K, ID>;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={props.controller}>{props.children}</Ctx.Provider>;
}

export function useTable<K extends string = string, ID = string | number>() {
  const ctx = React.useContext(Ctx) as TableController<K, ID> | null;
  if (!ctx) throw new Error("useTable must be used within <TableProvider>");
  return ctx;
}
