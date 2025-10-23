import * as React from "react";

export type RowId = string | number;

export type TableSelectionCtx = {
  // selection is enabled when a getRowId is present
  selectable: boolean;

  // provided by <Table>
  getRowId?: (row: unknown) => RowId | undefined;

  // current page’s row ids (rebuilt every render)
  pageIds: RowId[];

  // rows report their id during render; Table snapshots them post-render
  registerRowId: (id: RowId) => void;

  // selection state
  selected: Set<RowId>;
  setSelectedArray: (ids: RowId[]) => void;
  toggleOne: (id: RowId) => void;
  setAllOnPage: (checked: boolean) => void;

  // optional bulk bar render
  renderBulkActions?: (args: { selectedIds: RowId[]; clear: () => void }) => React.ReactNode;
};

export const TableSelectCtx = React.createContext<TableSelectionCtx>({
  selectable: false,
  pageIds: [],
  registerRowId: () => {},
  selected: new Set(),
  setSelectedArray: () => {},
  toggleOne: () => {},
  setAllOnPage: () => {},
  renderBulkActions: undefined,
});
