// packages/ui/src/hooks/useTableController.ts
import { useCallback, useMemo, useState } from "react";

/** Shared table types */
export type ID = string | number;
export type TableSortDir = "asc" | "desc";
export type TableSortRule<K extends string> = { key: K; dir: TableSortDir };
export type TableColumnDef<K extends string> = { key: K; label?: string; default?: boolean };


// Column visibility controller
function useColumnsController<K extends string>(defs: TableColumnDef<K>[]) {
  const initial = useMemo<Record<K, boolean>>(
    () =>
      defs.reduce((acc, c) => {
        acc[c.key] = c.default ?? true;
        return acc;
      }, {} as Record<K, boolean>),
    [defs]
  );

  const [map, setMap] = useState<Record<K, boolean>>(initial);

  const toggle = useCallback((k: K) => {
    setMap((m) => ({ ...m, [k]: !m[k] }));
  }, []);

  const setAll = useCallback((next: Record<K, boolean>) => {
    setMap(next);
  }, []);

  const visible = useMemo(() => defs.filter((c) => map[c.key]), [defs, map]);

  // Legacy-compatible shape expected by callers
  return {
    map,
    setAll,
    visible,
    columns: defs, // expose full list as `columns`
    toggleColumn: toggle, // alias to match callers
  };
}

// Sort controller
function useSortsController<K extends string>(initial: TableSortRule<K>[] = []) {
  const [rules, setRules] = useState<TableSortRule<K>[]>(initial);

  const dirFor = useCallback(
    (key: K): TableSortDir | null => rules.find((r) => r.key === key)?.dir ?? null,
    [rules]
  );

  const cycle = useCallback(
    (key: K, multi = false) => {
      setRules((prev) => {
        const idx = prev.findIndex((r) => r.key === key);
        // none -> asc
        if (idx === -1) return multi ? [...prev, { key, dir: "asc" }] : [{ key, dir: "asc" }];
        const cur = prev[idx];
        if (cur.dir === "asc") {
          // asc -> desc
          const next = [...prev];
          next[idx] = { key, dir: "desc" };
          return next;
        }
        // desc -> remove
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
    },
    []
  );

  const toParam = useMemo(
    () => rules.map((r) => `${r.key}:${r.dir}`).join(","),
    [rules]
  );

  // Legacy-compatible shape expected by callers
  return {
    rules,
    setRules,
    dirFor,
    cycle,
    toParam,
    sorts: rules, // alias for callers
    toggleSort: cycle, // alias for callers
  };
}

// Row selection controller
function useSelectionController<TID extends ID>() {
  const [setState, setSet] = useState<Set<TID>>(() => new Set());

  const isSelected = useCallback((id: TID) => setState.has(id), [setState]);

  const toggle = useCallback((id: TID) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSet(new Set()), []);

  const toggleAllOnPage = useCallback((ids: TID[]) => {
    setSet((prev) => {
      const next = new Set(prev);
      let allSelected = ids.every((i) => next.has(i));
      if (allSelected) ids.forEach((i) => next.delete(i));
      else ids.forEach((i) => next.add(i));
      return next;
    });
  }, []);

  const headerStateFor = useCallback(
    (ids: TID[]) => {
      const total = ids.length;
      const count = ids.filter((i) => setState.has(i)).length;
      return {
        checked: total > 0 && count === total,
        indeterminate: count > 0 && count < total,
      };
    },
    [setState]
  );

  const selectedIds = useMemo(() => Array.from(setState), [setState]);

  // Legacy-compatible shape expected by callers
  return {
    set: setState,
    isSelected,
    toggle,
    clear,
    toggleAllOnPage,
    headerStateFor,
    count: selectedIds.length,
    selectedIds,
    selected: setState, // alias for callers
    toggleRow: toggle, // alias for callers
  };
}

/** Public combined controller */
export function useTableController<K extends string, TID extends ID>(opts: {
  columns: TableColumnDef<K>[];
  initialSorts?: TableSortRule<K>[];  getRowId?: (row: any) => TID;
}) {
  const { columns: colDefs, initialSorts = [], getRowId } = opts;

  const columns = useColumnsController<K>(colDefs);
  const sorts = useSortsController<K>(initialSorts);
  const selection = useSelectionController<TID>();

  return {
    // columns
    columns: columns.columns,
    toggleColumn: columns.toggleColumn,
    visibleColumns: columns.visible,
    columnMap: columns.map,
    setAllColumns: columns.setAll,

    // sorts
    sorts: sorts.sorts,
    toggleSort: sorts.toggleSort,
    dirFor: sorts.dirFor,
    sortParam: sorts.toParam,

    // selection
    selected: selection.selected,
    selectedIds: selection.selectedIds,
    isSelected: selection.isSelected,
    toggleRow: selection.toggleRow,
    clearSelection: selection.clear,
    toggleAllOnPage: selection.toggleAllOnPage,
    headerStateFor: selection.headerStateFor,

    // misc
    getRowId,
  };
}
