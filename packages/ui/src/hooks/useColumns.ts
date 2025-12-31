// packages/ui/src/hooks/useColumns.ts
import * as React from "react";

export function useColumns<K extends string, T extends { key: K; default?: boolean }>(
  defs: T[],
  storageKey: string
) {
  const defaults = React.useMemo(
    () => defs.reduce<Record<K, boolean>>(
      (acc, d) => ({ ...acc, [d.key]: d.default ?? true }),   // <-- changed
      {} as any
    ),
    [defs]
  );

  const [map, setMap] = React.useState<Record<K, boolean>>(() => {
    try {
      return { ...defaults, ...(JSON.parse(localStorage.getItem(storageKey) || "{}")) };
    } catch {
      return defaults;
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(map)); } catch {}
  }, [map, storageKey]);

  const toggle = (k: K) => setMap(m => ({ ...m, [k]: !m[k] }));
  const setAll = (next: Record<K, boolean>) => setMap(next);

  const visible = React.useMemo(() => defs.filter(d => map[d.key]), [defs, map]);

  return { map, toggle, setAll, visible };
}
