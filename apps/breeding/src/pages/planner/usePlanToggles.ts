// apps/breeding/src/pages/planner/usePlanToggles.ts
// Per-plan toggles hook for planner components

import * as React from "react";

export type PlanTogglesState = {
  showPhases: boolean;
  showExact: boolean;
  showExactBands: boolean;
};

/**
 * Hook for per-plan toggle state with localStorage persistence.
 * Uses the same key format as current PerPlanGantt for compatibility.
 */
export function usePlanToggles(
  planId: string | number,
  defaultExactBandsVisible: boolean
): [PlanTogglesState, React.Dispatch<React.SetStateAction<PlanTogglesState>>] {
  const key = `bhq_planner_perplan_${planId}`;

  const [state, set] = React.useState<PlanTogglesState>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { showPhases: true, showExact: true, showExactBands: !!defaultExactBandsVisible };
  });

  // Track if this is the first load (before any user interaction)
  const [hasLoadedFromStorage] = React.useState(() => {
    try {
      return !!localStorage.getItem(key);
    } catch {
      return false;
    }
  });

  // Update showExactBands when preferences change, but only if user hasn't manually set it
  React.useEffect(() => {
    if (!hasLoadedFromStorage) {
      set(prev => ({ ...prev, showExactBands: !!defaultExactBandsVisible }));
    }
  }, [defaultExactBandsVisible, hasLoadedFromStorage]);

  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [key, state]);

  return [state, set];
}
