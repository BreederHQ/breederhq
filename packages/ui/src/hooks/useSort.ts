import * as React from "react";

export type SortDir = "asc" | "desc";
export type SortRule<K extends string = string> = { key: K; dir: SortDir };

export function useSort<K extends string = string>(initial: SortRule<K>[] = []) {
  const [rules, setRules] = React.useState<SortRule<K>[]>(initial);
  const dirFor = (key: K): SortDir | null => rules.find(r => r.key === key)?.dir ?? null;
  const cycle = (key: K, multi = false) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.key === key);
      if (!multi) {
        if (idx === -1) return [{ key, dir: "asc" }];
        if (prev[idx].dir === "asc") return [{ key, dir: "desc" }];
        return [];
      }
      if (idx === -1) return [...prev, { key, dir: "asc" }];
      const cur = prev[idx];
      if (cur.dir === "asc") { const copy = prev.slice(); copy[idx] = { key, dir: "desc" }; return copy; }
      const copy = prev.slice(); copy.splice(idx, 1); return copy;
    });
  };
  const toParam = React.useMemo(() => rules.map(r => `${r.key}:${r.dir}`).join(","), [rules]);
  return { rules, setRules, dirFor, cycle, toParam };
}
