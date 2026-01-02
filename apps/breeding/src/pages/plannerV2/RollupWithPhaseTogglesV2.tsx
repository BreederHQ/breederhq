// apps/breeding/src/pages/plannerV2/RollupWithPhaseTogglesV2.tsx
// Rollup view with phase-level tri-state toggles for v2
// Uses RollupGantt for chart rendering, adds phase toggle UI

import * as React from "react";
import RollupGantt from "../../components/RollupGantt";
import { useIndeterminate } from "@bhq/ui/hooks";
import { deriveBreedingStatus, STATUS_ORDER, STATUS_LABELS, type Status } from "./deriveBreedingStatus.v2";
import { useRollupSelection, type ID } from "./rollupSelection.v2";

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
  plans: PlanLike[];
  /** If true, synthetic (What If) items are allowed in selection */
  allowSynthetic?: boolean;
  prefsOverride?: any;
  className?: string;
};

export default function RollupWithPhaseTogglesV2({
  plans,
  allowSynthetic = false,
  prefsOverride,
  className = "",
}: Props) {
  // Filter out synthetic items unless allowed
  const realPlans = React.useMemo(
    () => (allowSynthetic ? plans : plans.filter(p => !p.isSynthetic)),
    [plans, allowSynthetic]
  );

  // Only include plans with a cycle date (same as RollupGantt selectablePlans logic)
  const selectablePlans = React.useMemo(
    () => realPlans.filter(p => {
      if (p.isSynthetic && !allowSynthetic) return false;
      const hasCycleDate = !!(p.lockedCycleStart || (p as any).expectedCycleStart || (p as any).cycleStartDateActual);
      return hasCycleDate;
    }),
    [realPlans, allowSynthetic]
  );

  // Selection state
  const {
    selectedKeys,
    setSelectedKeys,
    setSelectionTouched,
    toggleOne,
    setAll,
  } = useRollupSelection(selectablePlans);

  // Group plans by status
  const plansByStatus = React.useMemo(() => {
    const groups: Record<Status, PlanLike[]> = {
      PLANNING: [], COMMITTED: [], BRED: [], BIRTHED: [], WEANED: [], HOMING_STARTED: [], COMPLETE: [], CANCELED: [],
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
    setSelectedKeys(prev => {
      const next = new Set(prev);
      const allSelected = plansInPhase.every(p => next.has(p.id));

      if (allSelected) {
        // Turn all off
        plansInPhase.forEach(p => next.delete(p.id));
      } else {
        // Turn all on (covers indeterminate and unchecked)
        plansInPhase.forEach(p => next.add(p.id));
      }
      return next;
    });
  }, [plansByStatus, setSelectedKeys, setSelectionTouched]);

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
      {/* Phase Toggles Section */}
      <div className="mb-4 rounded-xl bg-black/10 p-3">
        <div className="text-xs font-medium text-secondary mb-2">Phase Visibility</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

      {/* Rollup Chart */}
      <RollupGantt
        items={realPlans}
        prefsOverride={prefsOverride}
        selected={selectedKeys}
        onSelectedChange={(next) => {
          setSelectionTouched(true);
          // Filter out synthetic if not allowed
          if (!allowSynthetic) {
            const filtered = new Set<ID>();
            next.forEach(id => {
              const plan = realPlans.find(p => p.id === id);
              if (plan && !plan.isSynthetic) {
                filtered.add(id);
              }
            });
            setSelectedKeys(filtered);
          } else {
            setSelectedKeys(next);
          }
        }}
        className="w-full"
      />

      {/* Extended Plan Selection UI */}
      <div className="mt-4 rounded-xl bg-black/10 p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-xs font-medium text-secondary">Individual Plans</div>
          <SelectAllCheckbox
            checked={allState.checked}
            indeterminate={allState.indeterminate}
            onChange={handleSelectAll}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs max-h-48 overflow-y-auto">
          {selectablePlans.map(plan => (
            <label key={String(plan.id)} className="inline-flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={selectedKeys.has(plan.id)}
                onChange={() => handlePlanToggle(plan.id)}
              />
              <span className="truncate">{plan.name || String(plan.id)}</span>
              <span className="text-secondary text-[10px]">
                ({STATUS_LABELS[deriveBreedingStatus(plan)]})
              </span>
            </label>
          ))}
          {selectablePlans.length === 0 && (
            <div className="text-xs text-secondary col-span-2">No selectable plans available.</div>
          )}
        </div>
      </div>
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
    <label className="flex items-center gap-2 cursor-pointer rounded-md bg-white/5 hover:bg-white/10 px-2 py-1.5 transition-colors">
      <input
        type="checkbox"
        ref={indeterminateProps.ref}
        checked={checked}
        aria-checked={indeterminateProps["aria-checked"]}
        onChange={onChange}
        className="rounded"
      />
      <span className="text-xs font-medium flex-1">{label}</span>
      <span className="text-[10px] text-secondary">{count}/{total}</span>
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
    <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        ref={indeterminateProps.ref}
        checked={checked}
        aria-checked={indeterminateProps["aria-checked"]}
        onChange={(e) => onChange(e.target.checked)}
      />
      Toggle All
    </label>
  );
}
