// apps/breeding/src/pages/planner/rollupSelection.ts
// Selection state hook for Rollup

import * as React from "react";

export type ID = string | number;

export type RollupSelectionState = {
  selectedKeys: Set<ID>;
  selectionTouched: boolean;
  setSelectedKeys: React.Dispatch<React.SetStateAction<Set<ID>>>;
  setSelectionTouched: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOne: (id: ID) => void;
  setAll: (on: boolean, plans: { id: ID }[]) => void;
};

/**
 * Hook implementing select-all-on-first-load then prune-only behavior.
 * - On first load (untouched, empty set): select all
 * - After user interaction: only prune removed IDs, never auto-add
 */
export function useRollupSelection(plans: { id: ID }[]): RollupSelectionState {
  const [selectedKeys, setSelectedKeys] = React.useState<Set<ID>>(() => new Set<ID>());
  const [selectionTouched, setSelectionTouched] = React.useState(false);

  // Keep selection stable across data refreshes.
  // Auto-select-all only once (first load) and never after user interaction.
  React.useEffect(() => {
    if (plans.length === 0) return;

    setSelectedKeys((prev) => {
      const valid = new Set<ID>(plans.map((p) => p.id));

      // First load only: select all
      const base = !selectionTouched && prev.size === 0 ? valid : prev;

      // Always prune removed plans, never add new ones once touched
      const next = new Set<ID>();
      base.forEach((k) => {
        if (valid.has(k)) next.add(k);
      });

      return next;
    });
  }, [plans, selectionTouched]);

  const toggleOne = React.useCallback((id: ID) => {
    setSelectionTouched(true);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setAll = React.useCallback((on: boolean, allPlans: { id: ID }[]) => {
    setSelectionTouched(true);
    if (on) {
      setSelectedKeys(new Set(allPlans.map((p) => p.id)));
    } else {
      setSelectedKeys(new Set());
    }
  }, []);

  return {
    selectedKeys,
    selectionTouched,
    setSelectedKeys,
    setSelectionTouched,
    toggleOne,
    setAll,
  };
}
