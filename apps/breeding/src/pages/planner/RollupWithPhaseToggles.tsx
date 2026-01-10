// apps/breeding/src/pages/planner/RollupWithPhaseToggles.tsx
// Rollup view with phase-level tri-state toggles
// Uses RollupGantt for chart rendering, adds phase toggle UI

import * as React from "react";
import RollupGantt, { getPlanLineColor } from "../../components/RollupGantt";
import { useIndeterminate } from "@bhq/ui/hooks";
import { deriveBreedingStatus, STATUS_ORDER, STATUS_LABELS, type Status } from "./deriveBreedingStatus";
import { useRollupSelection, type ID } from "./rollupSelection";

export type { ID };

// Status colors for phase indicators (matches BreedingPlanCardView)
const STATUS_COLORS: Record<Status, string> = {
  PLANNING: "hsl(210, 70%, 50%)",           // Blue
  COMMITTED: "hsl(25, 95%, 53%)",           // Orange
  BRED: "hsl(330, 70%, 50%)",               // Pink
  BIRTHED: "hsl(45, 90%, 50%)",             // Gold
  WEANED: "hsl(80, 60%, 45%)",              // Yellow-green
  PLACEMENT_STARTED: "hsl(142, 70%, 45%)",  // Green
  PLACEMENT_COMPLETED: "hsl(160, 60%, 42%)",// Teal-green
  COMPLETE: "hsl(160, 50%, 40%)",           // Teal
  CANCELED: "hsl(0, 0%, 50%)",              // Gray
};

type PlanLike = {
  id: ID;
  name: string;
  lockedCycleStart?: string | null;
  isSynthetic?: boolean;
  // Status derivation fields
  species?: string | null;
  damId?: number | null;
  sireId?: number | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;
  status?: string | null;
  [key: string]: any;
};

type Props = {
  /** Plans for selection UI (Phase Visibility + Individual Plans list) */
  plans: PlanLike[];
  /**
   * Items to render on the chart. If not provided, defaults to `plans`.
   * Use this to include synthetic What If items on the chart while keeping
   * them out of the selection UI.
   */
  itemsForChart?: PlanLike[];
  /** If true, synthetic (What If) items are allowed in selection */
  allowSynthetic?: boolean;
  /** External control of selection state - if provided, component becomes controlled */
  selected?: Set<ID>;
  onSelectedChange?: (next: Set<ID>) => void;
  prefsOverride?: any;
  className?: string;
  /** If true, hides Phase Visibility and Individual Plans sections (sandbox mode) */
  hideRealPlanSelection?: boolean;
};

export default function RollupWithPhaseToggles({
  plans,
  itemsForChart,
  allowSynthetic = false,
  selected: externalSelected,
  onSelectedChange,
  prefsOverride,
  className = "",
  hideRealPlanSelection = false,
}: Props) {
  // Determine if component is controlled externally
  const isControlled = externalSelected !== undefined && onSelectedChange !== undefined;

  // Filter out synthetic items from selection list unless allowed
  const realPlans = React.useMemo(
    () => (allowSynthetic ? plans : plans.filter(p => !p.isSynthetic)),
    [plans, allowSynthetic]
  );

  // Only include plans with a LOCKED cycle date (not just selected/expected)
  // Plans must have lockedCycleStart or cycleStartDateActual to appear on the timeline
  const selectablePlans = React.useMemo(
    () => realPlans.filter(p => {
      if (p.isSynthetic && !allowSynthetic) return false;
      // Only accept locked or actual cycle dates - NOT expectedCycleStart (selected but not locked)
      const hasLockedCycleDate = !!(p.lockedCycleStart || (p as any).cycleStartDateActual);
      return hasLockedCycleDate;
    }),
    [realPlans, allowSynthetic]
  );

  // Items for chart: use itemsForChart if provided, otherwise use realPlans
  const chartItems = React.useMemo(
    () => itemsForChart ?? realPlans,
    [itemsForChart, realPlans]
  );

  // Internal selection state (used when uncontrolled)
  const internalSelection = useRollupSelection(selectablePlans);

  // Unified selection interface
  const selectedKeys = isControlled ? externalSelected : internalSelection.selectedKeys;
  const setSelectedKeys = isControlled
    ? onSelectedChange
    : internalSelection.setSelectedKeys;
  const setSelectionTouched = isControlled
    ? () => {} // No-op for controlled mode
    : internalSelection.setSelectionTouched;
  const toggleOne = React.useCallback((id: ID) => {
    const next = new Set(selectedKeys);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedKeys(next);
  }, [setSelectedKeys, selectedKeys]);
  const setAll = React.useCallback((checked: boolean, items: PlanLike[]) => {
    if (checked) {
      setSelectedKeys(new Set(items.map(p => p.id)));
    } else {
      setSelectedKeys(new Set());
    }
  }, [setSelectedKeys]);

  // Group plans by status
  const plansByStatus = React.useMemo(() => {
    const groups: Record<Status, PlanLike[]> = {
      PLANNING: [], COMMITTED: [], BRED: [], BIRTHED: [], WEANED: [], PLACEMENT_STARTED: [], PLACEMENT_COMPLETED: [], COMPLETE: [], CANCELED: [],
    };
    for (const plan of selectablePlans) {
      const status = deriveBreedingStatus(plan);
      groups[status].push(plan);
    }
    return groups;
  }, [selectablePlans]);

  // Compute phase toggle states
  const phaseStates = React.useMemo(() => {
    const states: Record<Status, { checked: boolean; indeterminate: boolean; count: number; total: number }> = {} as any;
    for (const status of STATUS_ORDER) {
      const plansInPhase = plansByStatus[status];
      const selectedCount = plansInPhase.filter(p => selectedKeys.has(p.id)).length;
      const total = plansInPhase.length;
      states[status] = {
        checked: total > 0 && selectedCount === total,
        indeterminate: selectedCount > 0 && selectedCount < total,
        count: selectedCount,
        total,
      };
    }
    return states;
  }, [plansByStatus, selectedKeys]);

  // Handle phase toggle click
  const handlePhaseToggle = React.useCallback((status: Status) => {
    const plansInPhase = plansByStatus[status];
    if (plansInPhase.length === 0) return;

    setSelectionTouched(true);
    const next = new Set(selectedKeys);
    const allSelected = plansInPhase.every(p => next.has(p.id));

    if (allSelected) {
      // Turn all off
      plansInPhase.forEach(p => next.delete(p.id));
    } else {
      // Turn all on (covers indeterminate and unchecked)
      plansInPhase.forEach(p => next.add(p.id));
    }
    setSelectedKeys(next);
  }, [plansByStatus, setSelectedKeys, setSelectionTouched, selectedKeys]);

  // Handle individual plan toggle
  const handlePlanToggle = React.useCallback((id: ID) => {
    setSelectionTouched(true);
    toggleOne(id);
  }, [toggleOne, setSelectionTouched]);

  // Handle select all toggle
  const handleSelectAll = React.useCallback((checked: boolean) => {
    setSelectionTouched(true);
    setAll(checked, selectablePlans);
  }, [setAll, selectablePlans, setSelectionTouched]);

  // Compute overall select-all state
  const allState = React.useMemo(() => {
    const total = selectablePlans.length;
    const count = selectablePlans.filter(p => selectedKeys.has(p.id)).length;
    return {
      checked: total > 0 && count === total,
      indeterminate: count > 0 && count < total,
    };
  }, [selectablePlans, selectedKeys]);

  return (
    <div className={className}>
      {/* Rollup Chart - now first */}
      {/* No legacy single-column plan list; only Phase Visibility + Individual Plans below. */}
      <RollupGantt
        items={chartItems}
        prefsOverride={prefsOverride}
        selected={selectedKeys}
        onSelectedChange={(next) => {
          setSelectionTouched(true);
          // Filter out synthetic IDs - selection only operates on real plans
          const filtered = new Set<ID>();
          next.forEach(id => {
            const plan = selectablePlans.find(p => p.id === id);
            if (plan) {
              filtered.add(id);
            }
          });
          setSelectedKeys(filtered);
        }}
        className="w-full"
        hideSelection
      />

      {/* Phase Visibility and Individual Plans - hidden in sandbox mode until What If exists */}
      {!hideRealPlanSelection && (
        <div className="mt-2 flex flex-col lg:flex-row gap-3">
          {/* Phase Visibility - compact left column */}
          <div className="lg:w-64 lg:flex-shrink-0 rounded-lg bg-black/10 p-3 border border-white/5">
            <div className="text-xs font-medium text-secondary mb-2">Phase Visibility</div>
            <div className="space-y-1.5">
              {STATUS_ORDER.map(status => {
                const state = phaseStates[status];
                if (state.total === 0) return null;
                return (
                  <PhaseToggleCheckbox
                    key={status}
                    label={STATUS_LABELS[status]}
                    checked={state.checked}
                    indeterminate={state.indeterminate}
                    count={state.count}
                    total={state.total}
                    onChange={() => handlePhaseToggle(status)}
                  />
                );
              })}
            </div>
          </div>

          {/* Individual Plans - flexible right column */}
          <div className="flex-1 flex flex-col rounded-lg bg-black/10 p-3 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xs font-medium text-secondary">Individual Plans</div>
              <SelectAllCheckbox
                checked={allState.checked}
                indeterminate={allState.indeterminate}
                onChange={handleSelectAll}
              />
            </div>
            <div className="flex flex-col flex-wrap gap-x-6 gap-y-0.5 max-h-24 overflow-y-auto">
              {(() => {
                // Compute active plans list to match RollupGantt's color assignment
                // RollupGantt uses chartItems filtered by selectedKeys
                const activePlansForColors = chartItems.filter(p => selectedKeys.has(p.id));

                return selectablePlans.map(plan => {
                  const status = deriveBreedingStatus(plan);
                  const statusColor = STATUS_COLORS[status];
                  const isSelected = selectedKeys.has(plan.id);
                  // Get the index among active plans to match the centerline color in the chart
                  const selectedIndex = activePlansForColors.findIndex(p => p.id === plan.id);
                  const lineColor = isSelected && selectedIndex >= 0 ? getPlanLineColor(selectedIndex) : undefined;
                  return (
                    <label key={String(plan.id)} className="inline-flex items-center gap-1.5 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePlanToggle(plan.id)}
                        className="w-3.5 h-3.5 rounded"
                        style={lineColor ? { accentColor: lineColor } : undefined}
                      />
                      <span className="truncate text-xs font-medium">{plan.name || String(plan.id)}</span>
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: statusColor }}
                        title={STATUS_LABELS[status]}
                      />
                    </label>
                  );
                });
              })()}
              {selectablePlans.length === 0 && (
                <div className="text-xs text-secondary">No selectable plans available.</div>
              )}
            </div>
            <p className="mt-auto pt-2 text-xs text-secondary/70">
              <span className="text-red-500">*</span> Only plans with a locked cycle date appear here.
            </p>
          </div>
        </div>
      )}

      {/* Sandbox mode hint - shown when real plan selection is hidden */}
      {hideRealPlanSelection && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200/80">
          <span className="font-medium text-blue-300">Tip:</span> Add a What If scenario to see it on the timeline. Once you have a scenario, you can also add existing plans for comparison.
        </div>
      )}
    </div>
  );
}

/* ---------- Phase Toggle Checkbox ---------- */
function PhaseToggleCheckbox({
  label,
  checked,
  indeterminate,
  count,
  total,
  onChange,
}: {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  count: number;
  total: number;
  onChange: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const indeterminateProps = useIndeterminate({ checked, indeterminate, ref: inputRef });

  return (
    <label className="flex items-center gap-2 cursor-pointer rounded bg-white/5 hover:bg-white/10 px-2 py-1.5 transition-colors">
      <input
        type="checkbox"
        ref={indeterminateProps.ref}
        checked={checked}
        aria-checked={indeterminateProps["aria-checked"]}
        onChange={onChange}
        className="rounded w-3.5 h-3.5"
      />
      <span className="text-xs font-medium flex-1">{label}</span>
      <span className="text-xs text-secondary">{count}/{total}</span>
    </label>
  );
}

/* ---------- Select All Checkbox ---------- */
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const indeterminateProps = useIndeterminate({ checked, indeterminate, ref: inputRef });

  return (
    <label className="text-xs inline-flex items-center gap-1.5 cursor-pointer text-secondary">
      <input
        type="checkbox"
        ref={indeterminateProps.ref}
        checked={checked}
        aria-checked={indeterminateProps["aria-checked"]}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3 h-3"
      />
      Toggle All
    </label>
  );
}
