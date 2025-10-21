
import * as React from "react";

export function useFiltersState<T extends Record<string, string>>(initial: T, storageKey?: string) {
  const [filters, setFilters] = React.useState<T>(() => {
    if (!storageKey) return initial;
    try { return { ...initial, ...(JSON.parse(localStorage.getItem(storageKey) || "{}")) }; } catch { return initial; }
  });
  React.useEffect(() => { if (storageKey) try { localStorage.setItem(storageKey, JSON.stringify(filters)); } catch {} }, [filters, storageKey]);
  const clearAll = () => setFilters(Object.fromEntries(Object.keys(filters).map(k => [k, ""])) as T);
  const hasAny = Object.values(filters).some(Boolean);
  return { filters, setFilters, clearAll, hasAny };
}
