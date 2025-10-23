// packages/ui/src/components/Table/TableContext.tsx
import * as React from "react";
import { useTableController } from "../../hooks/useTableController";
import type { ID as RowID } from "../../hooks/useTableController";

export type StickyRightConfig = {
  widthPx: number;                         // visual width of the sticky “rail”
  render: (() => React.ReactNode) | null;  // header renderer (null = rail hidden)
};

export const StickyRightCtx = React.createContext<StickyRightConfig>({
  widthPx: 36,
  render: null,
});

export type TableController<K extends string, TID extends RowID = RowID> =
  ReturnType<typeof useTableController<K, TID>>;

const Ctx = React.createContext<TableController<any, any> | null>(null);

export function TableProvider<K extends string, TID extends RowID>(props: {
  controller: TableController<K, TID>;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={props.controller}>{props.children}</Ctx.Provider>;
}

export function useTable<K extends string = string, TID extends RowID = RowID>() {
  const ctx = React.useContext(Ctx) as TableController<K, TID> | null;
  if (!ctx) throw new Error("useTable must be used within <TableProvider>");
  return ctx;
}
