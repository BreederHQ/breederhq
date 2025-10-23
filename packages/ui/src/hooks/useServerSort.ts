import * as React from "react";
import type { SortRule } from "../utils/sort";
import { buildSortParam } from "../utils/sort";

export function useServerSort(allowedKeys: string[]) {
  const [sorts, setSorts] = React.useState<SortRule[]>([]);

  const onToggleSort = React.useCallback((key: string, append?: boolean) => {
    setSorts(prev => {
      const base = append ? [...prev] : [];
      const idx = base.findIndex(s => s.key === key);
      if (idx === -1) {
        base.push({ key, dir: "asc" });
      } else if (base[idx].dir === "asc") {
        base[idx] = { key, dir: "desc" };
      } else {
        base.splice(idx, 1);
      }
      return base;
    });
  }, []);

  const sortParam = React.useMemo(
    () => buildSortParam(sorts, allowedKeys),
    [sorts, allowedKeys]
  );

  return { sorts, onToggleSort, sortParam, setSorts };
}
