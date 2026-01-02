// apps/breeding/src/pages/plannerV2/WhatIfPlanningPageV2.tsx
// V2 Planner page - "What If Planning" with Rollup + What If controls
// This is a parallel implementation for review - does not modify existing planner

import * as React from "react";
import { SectionCard } from "@bhq/ui";
import RollupWithPhaseTogglesV2, { type ID } from "./RollupWithPhaseTogglesV2";
import { useRollupSelection } from "./rollupSelection.v2";
import type { WhatIfRow, WhatIfFemale, NormalizedPlan } from "./whatIfTypes.v2";

// Minimal plan shape for the page props
type PlanLike = {
  id: ID;
  name: string;
  lockedCycleStart?: string | null;
  isSynthetic?: boolean;
  [key: string]: any;
};

type Props = {
  /** Plans data - if not provided, shows empty state */
  plans?: PlanLike[];
  /** Available females for What If rows */
  females?: WhatIfFemale[];
};

// Generate unique ID for What If rows
let whatIfCounter = 0;
function generateWhatIfId(): string {
  return `what-if-${++whatIfCounter}`;
}

export default function WhatIfPlanningPageV2({ plans = [], females = [] }: Props) {
  // What If rows state
  const [whatIfRows, setWhatIfRows] = React.useState<WhatIfRow[]>([]);

  // Real plans only (for selection UI)
  const realPlans = React.useMemo(
    () => plans.filter(p => !p.isSynthetic),
    [plans]
  );

  // Selection state for real plans only
  const {
    selectedKeys,
    setSelectedKeys,
  } = useRollupSelection(realPlans);

  // Convert What If rows to synthetic plans for the chart
  const syntheticPlans = React.useMemo<PlanLike[]>(() => {
    return whatIfRows
      .filter(row => row.showOnChart && row.cycleStartIso)
      .map(row => ({
        id: row.id,
        name: row.damName ? `What If: ${row.damName}` : `What If: ${row.id}`,
        species: row.species ?? "Dog",
        lockedCycleStart: row.cycleStartIso,
        expectedCycleStart: row.cycleStartIso,
        // Compute expected dates based on species defaults (simplified)
        expectedBreedDate: row.cycleStartIso ? addDays(row.cycleStartIso, 10) : null,
        expectedBirthDate: row.cycleStartIso ? addDays(row.cycleStartIso, 73) : null,
        expectedPlacementStartDate: row.cycleStartIso ? addDays(row.cycleStartIso, 129) : null,
        expectedPlacementCompleted: row.cycleStartIso ? addDays(row.cycleStartIso, 143) : null,
        isSynthetic: true,
        damId: row.damId,
        sireId: null,
      }));
  }, [whatIfRows]);

  // Combined items for chart: selected real plans + synthetic plans with showOnChart
  const itemsForChart = React.useMemo<PlanLike[]>(() => {
    const selectedRealPlans = realPlans.filter(p => selectedKeys.has(p.id));
    return [...selectedRealPlans, ...syntheticPlans];
  }, [realPlans, selectedKeys, syntheticPlans]);

  // Add a new What If row
  const handleAddRow = React.useCallback(() => {
    setWhatIfRows(prev => [
      ...prev,
      {
        id: generateWhatIfId(),
        damId: null,
        damName: null,
        species: null,
        cycleStartIso: null,
        showOnChart: true,
      },
    ]);
  }, []);

  // Update a What If row
  const handleUpdateRow = React.useCallback((id: string, updates: Partial<WhatIfRow>) => {
    setWhatIfRows(prev =>
      prev.map(row => (row.id === id ? { ...row, ...updates } : row))
    );
  }, []);

  // Remove a What If row
  const handleRemoveRow = React.useCallback((id: string) => {
    setWhatIfRows(prev => prev.filter(row => row.id !== id));
  }, []);

  const hasPlans = realPlans.length > 0;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-primary">What If Planning</h1>
        <p className="text-sm text-secondary mt-1">
          Explore hypothetical breeding scenarios and project timelines
        </p>
      </div>

      {/* Rollup Section - uses same layout as Your Breeding Plans */}
      <SectionCard title={<span><span>Timeline Rollup</span></span>} className="mb-4">
        {!hasPlans && syntheticPlans.length === 0 ? (
          <EmptyState context="rollup" />
        ) : (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                This rollup includes your active breeding plans. Use the What If Planner below
                to add hypothetical scenarios that will appear on this timeline.
              </div>
            </div>

            {/* Rollup with Phase Toggles - same layout as Your Breeding Plans */}
            <RollupWithPhaseTogglesV2
              plans={realPlans}
              itemsForChart={itemsForChart}
              selected={selectedKeys}
              onSelectedChange={setSelectedKeys}
              className="w-full"
            />
          </div>
        )}
      </SectionCard>

      {/* What If Planner Section */}
      <SectionCard title={<span><span>What If Planner</span></span>}>
        <WhatIfPlanner
          rows={whatIfRows}
          females={females}
          onAddRow={handleAddRow}
          onUpdateRow={handleUpdateRow}
          onRemoveRow={handleRemoveRow}
        />
      </SectionCard>
    </div>
  );
}

// Simple date helper
function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/* ─────────────────────────────────────────────────────────────────────────────
 * What If Planner
 * ───────────────────────────────────────────────────────────────────────────── */
type WhatIfPlannerProps = {
  rows: WhatIfRow[];
  females: WhatIfFemale[];
  onAddRow: () => void;
  onUpdateRow: (id: string, updates: Partial<WhatIfRow>) => void;
  onRemoveRow: (id: string) => void;
};

function WhatIfPlanner({ rows, females, onAddRow, onUpdateRow, onRemoveRow }: WhatIfPlannerProps) {
  return (
    <div className="space-y-4">
      {/* Header with description and add button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-secondary">
          Add hypothetical cycles for active females and preview them on the Rollup timeline above.
        </div>
        <button
          onClick={onAddRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-primary rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Female
        </button>
      </div>

      {/* What If rows */}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-center">
          <p className="text-sm text-secondary">
            No What If scenarios yet. Click "Add Female" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <WhatIfRowEditor
              key={row.id}
              row={row}
              females={females}
              onUpdate={(updates) => onUpdateRow(row.id, updates)}
              onRemove={() => onRemoveRow(row.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * What If Row Editor
 * ───────────────────────────────────────────────────────────────────────────── */
type WhatIfRowEditorProps = {
  row: WhatIfRow;
  females: WhatIfFemale[];
  onUpdate: (updates: Partial<WhatIfRow>) => void;
  onRemove: () => void;
};

function WhatIfRowEditor({ row, females, onUpdate, onRemove }: WhatIfRowEditorProps) {
  const handleFemaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const femaleId = e.target.value;
    if (!femaleId) {
      onUpdate({ damId: null, damName: null, species: null });
      return;
    }
    const female = females.find(f => String(f.id) === femaleId);
    if (female) {
      onUpdate({
        damId: female.id,
        damName: female.name,
        species: female.species,
        femaleCycleLenOverrideDays: female.femaleCycleLenOverrideDays,
      });
    }
  };

  return (
    <div className="p-3 bg-neutral-800/50 dark:bg-neutral-800/50 rounded-lg border-l-4 border-l-orange-500 border border-neutral-700/30">
      <div className="flex items-center gap-4 text-sm">
        {/* Female select */}
        <div className="flex-1">
          <div className="text-xs text-secondary mb-1">Female</div>
          <select
            value={row.damId ? String(row.damId) : ""}
            onChange={handleFemaleChange}
            className="w-full h-8 bg-neutral-900 dark:bg-neutral-900 text-neutral-100 rounded px-2 text-sm border border-neutral-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none"
          >
            <option value="">Select a female...</option>
            {females.map(female => (
              <option key={String(female.id)} value={String(female.id)}>
                {female.name} ({female.species})
              </option>
            ))}
          </select>
        </div>

        {/* Cycle start date */}
        <div className="flex-1">
          <div className="text-xs text-secondary mb-1">Cycle Start</div>
          <input
            type="date"
            value={row.cycleStartIso ?? ""}
            onChange={(e) => onUpdate({ cycleStartIso: e.target.value || null })}
            className="w-full h-8 bg-neutral-900 dark:bg-neutral-900 text-neutral-100 rounded px-2 text-sm border border-neutral-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none [color-scheme:dark]"
          />
        </div>

        {/* Show on chart toggle */}
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={row.showOnChart}
              onChange={(e) => onUpdate({ showOnChart: e.target.checked })}
              className="rounded border-neutral-600 bg-neutral-900 text-orange-500 focus:ring-orange-500/50"
            />
            <span className="text-secondary">Show</span>
          </label>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="h-8 px-2 text-xs font-medium text-red-500 hover:bg-red-900/20 rounded transition-colors"
            title="Remove this What If"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ───────────────────────────────────────────────────────────────────────────── */
function EmptyState({ context }: { context: "rollup" }) {
  return (
    <div className="py-8 text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
        <svg
          className="w-5 h-5 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-primary mb-1">No plans to display</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        {context === "rollup"
          ? "No plans provided to v2 page yet. Wire this in Phase 2 cutover."
          : "Add What If scenarios to see projected timelines."}
      </p>
    </div>
  );
}
