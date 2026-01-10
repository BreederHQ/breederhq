// apps/breeding/src/pages/planner/WhatIfPlanningPage.tsx
// "What If Planning" page with Rollup + What If controls

import * as React from "react";
import { SectionCard, Tooltip } from "@bhq/ui";
import RollupWithPhaseToggles, { type ID } from "./RollupWithPhaseToggles";
import type { WhatIfRow, WhatIfFemale } from "./whatIfTypes";
import { reproEngine } from "@bhq/ui/utils";
import { windowsFromPlan } from "../../adapters/planWindows";

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
  /** API instance for creating plans */
  api?: any;
  /** Callback when a plan is created from What If */
  onPlanCreated?: (plan: any) => void;
};

// Generate unique ID for What If rows
let whatIfCounter = 0;
function generateWhatIfId(): string {
  return `what-if-${++whatIfCounter}`;
}

export default function WhatIfPlanningPage({ plans = [], females = [], api, onPlanCreated }: Props) {
  // What If rows state
  const [whatIfRows, setWhatIfRows] = React.useState<WhatIfRow[]>([]);

  // Real plans only (for selection UI)
  const realPlans = React.useMemo(
    () => plans.filter(p => !p.isSynthetic),
    [plans]
  );

  // Selection state - start EMPTY (sandbox approach: What If scenarios are the focus)
  // We manage selection directly instead of using useRollupSelection's auto-select-all
  const [selectedKeys, setSelectedKeys] = React.useState<Set<ID>>(() => new Set<ID>());

  // Determine if any What If scenario exists (enables real plan selection)
  const hasAnyWhatIf = whatIfRows.length > 0;

  // Convert What If rows to synthetic plans for the chart
  const syntheticPlans = React.useMemo<PlanLike[]>(() => {
    return whatIfRows
      .filter(row => row.showOnChart && row.cycleStartIso)
      .map(row => {
        // Use reproEngine to calculate proper timeline dates based on species
        const windows = windowsFromPlan({
          species: row.species,
          lockedCycleStart: row.cycleStartIso,
        });

        return {
          id: row.id,
          name: row.damName ? `What If: ${row.damName}` : `What If: ${row.id}`,
          species: row.species ?? "Dog",
          lockedCycleStart: row.cycleStartIso,
          expectedCycleStart: row.cycleStartIso,
          // Use calculated windows for proper breeding timeline
          expectedBreedDate: windows?.breeding_likely?.[0] || null,
          expectedBirthDate: windows?.birth_expected || null,
          // Weaning date is the end of post_birth_care (puppy care) or start of placement
          expectedWeaned: windows?.post_birth_care_likely?.[1] || windows?.placement_start_expected || null,
          expectedPlacementStartDate: windows?.placement_start_expected || null,
          expectedPlacementCompleted: windows?.placement_completed_expected || null,
          placementCompletedDateExpected: windows?.placement_completed_expected || null,
          isSynthetic: true,
          damId: row.damId,
          sireId: null,
        };
      });
  }, [whatIfRows]);

  // Combined items for chart: selected real plans + synthetic plans with showOnChart
  const itemsForChart = React.useMemo<PlanLike[]>(() => {
    const selectedRealPlans = realPlans.filter(p => selectedKeys.has(p.id));
    return [...selectedRealPlans, ...syntheticPlans];
  }, [realPlans, selectedKeys, syntheticPlans]);

  // RollupGantt only renders items included in selectedKeys.
  // What If rows should plot immediately when showOnChart is enabled,
  // without requiring a separate selection in the rollup list.
  const selectedKeysWithWhatIf = React.useMemo(() => {
    const s = new Set<ID>(selectedKeys);
    for (const row of whatIfRows) {
      if (row.showOnChart && row.damId != null && row.cycleStartIso) {
        s.add(row.id);
      }
    }
    return s;
  }, [selectedKeys, whatIfRows]);

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

  // Convert What If row to a real breeding plan
  const handleConvertToPlan = React.useCallback(async (row: WhatIfRow) => {
    if (!api) {
      console.warn("[WhatIfPlanner] No API instance provided");
      return;
    }
    if (!row.damId || !row.cycleStartIso || !row.species) {
      console.warn("[WhatIfPlanner] Missing dam, cycle start, or species", row);
      return;
    }

    try {
      // Normalize species to wire format
      const toWireSpecies = (s: string): string | undefined => {
        const v = String(s || "").trim().toUpperCase();
        if (!v) return undefined;
        if (v === "DOG" || v === "CAT" || v === "HORSE" || v === "GOAT" || v === "RABBIT") return v;
        return undefined;
      };

      const baseName = row.damName && row.damName.trim().length > 0 ? row.damName.trim() : "What If Plan";
      const name = `${baseName} - ${row.cycleStartIso.slice(0, 10)}`;
      const lockedCycleStart = row.cycleStartIso.slice(0, 10);

      // STEP 1: Create the plan
      const createPayload: any = {
        name,
        species: toWireSpecies(row.species),
        damId: row.damId,
      };
      if (row.sireId != null) {
        createPayload.sireId = row.sireId;
      }
      // Include breed if available from the What If row
      if (row.breedText && row.breedText.trim()) {
        createPayload.breedText = row.breedText.trim();
      }

      const createdRes = await api.createPlan(createPayload);
      const createdPlan = createdRes?.plan ?? createdRes;

      // STEP 2: Compute expected dates using windowsFromPlan
      const windows = windowsFromPlan({
        species: row.species,
        lockedCycleStart,
      });

      const lockPayload: any = {
        lockedCycleStart,
        lockedOvulationDate: windows?.ovulation,
        lockedDueDate: windows?.birth_expected,
        lockedPlacementStartDate: windows?.placement_start_expected,
        expectedCycleStart: lockedCycleStart,
        expectedHormoneTestingStart: windows?.hormone_testing_likely?.[0],
        expectedBreedDate: windows?.breeding_likely?.[0],
        expectedBirthDate: windows?.birth_expected,
        expectedWeaned: windows?.post_birth_care_likely?.[1] || windows?.placement_start_expected,
        expectedPlacementStartDate: windows?.placement_start_expected,
        expectedPlacementCompletedDate: windows?.placement_completed_expected,
      };

      const finalRes = await api.updatePlan(Number(createdPlan.id), lockPayload);
      const finalPlan = finalRes?.plan ?? finalRes;

      // STEP 3: Notify parent and clean up What If row
      if (onPlanCreated) {
        onPlanCreated(finalPlan);
      }

      // Remove the What If row or clear it if it's the last one
      setWhatIfRows((prev) => {
        if (prev.length <= 1) {
          return prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  damId: null,
                  damName: null,
                  species: null,
                  cycleStartIso: null,
                }
              : r
          );
        }
        return prev.filter((r) => r.id !== row.id);
      });
    } catch (err) {
      console.error("[WhatIfPlanner] Failed to convert to plan", err);
      alert(`Failed to create plan: ${(err as any)?.message || "Unknown error"}`);
    }
  }, [api, onPlanCreated]);

  const hasPlans = realPlans.length > 0;

  return (
    <SectionCard title="What If Planner">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Sidebar - What If Controls */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-4 space-y-4">
            {/* Add Scenario Button */}
            <button
              onClick={handleAddRow}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add What If Scenario
            </button>

            {/* What If Rows */}
            {whatIfRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-600 bg-neutral-800/30 p-4 text-center">
                <p className="text-sm text-secondary">
                  No scenarios yet. Add one to see projected timelines.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {whatIfRows.map(row => (
                  <WhatIfRowCard
                    key={row.id}
                    row={row}
                    females={females}
                    onUpdate={(updates) => handleUpdateRow(row.id, updates)}
                    onRemove={() => handleRemoveRow(row.id)}
                    onConvertToPlan={() => handleConvertToPlan(row)}
                  />
                ))}
              </div>
            )}

            {/* Hint text */}
            <div className="text-xs text-secondary/60 px-1">
              Select a female and cycle date to preview timing on the charts.
            </div>
          </div>
        </div>

        {/* Right Side - Charts */}
        <div className="flex-1 min-w-0">
          {!hasPlans && syntheticPlans.length === 0 ? (
            <EmptyState context="rollup" />
          ) : (
            <RollupWithPhaseToggles
              key={JSON.stringify(syntheticPlans.map(p => ({ id: p.id, cycle: p.lockedCycleStart })))}
              plans={realPlans}
              itemsForChart={itemsForChart}
              selected={selectedKeysWithWhatIf}
              onSelectedChange={setSelectedKeys}
              hideRealPlanSelection={!hasAnyWhatIf}
              className="w-full"
            />
          )}
        </div>
      </div>
    </SectionCard>
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
  onConvertToPlan: (row: WhatIfRow) => Promise<void>;
};

function WhatIfPlanner({ rows, females, onAddRow, onUpdateRow, onRemoveRow, onConvertToPlan }: WhatIfPlannerProps) {
  return (
    <div className="space-y-4">
      {/* Header with description and add button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-secondary">
          Add hypothetical cycles for active females and preview them on the Rollup timeline above.
        </div>
        <button
          onClick={onAddRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Female
        </button>
      </div>

      {/* What If rows */}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-600 bg-neutral-800/50 p-4 text-center">
          <p className="text-sm text-primary">
            No What If scenarios yet. Click "Add Female" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(row => (
            <WhatIfRowEditor
              key={row.id}
              row={row}
              females={females}
              onUpdate={(updates) => onUpdateRow(row.id, updates)}
              onRemove={() => onRemoveRow(row.id)}
              onConvertToPlan={() => onConvertToPlan(row)}
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
  onConvertToPlan: () => void;
};

function WhatIfRowEditor({ row, females, onUpdate, onRemove, onConvertToPlan }: WhatIfRowEditorProps) {
  // State for reproductive data
  const [cycleStartDates, setCycleStartDates] = React.useState<string[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Fetch reproductive data when female is selected
  React.useEffect(() => {
    let cancelled = false;

    // Clear stale data on every dam change
    setCycleStartDates([]);
    setLoadError(null);

    if (!row.damId) return;

    const include = "cycleStartDates";
    const url = `/api/v1/animals/${row.damId}?include=${encodeURIComponent(include)}`;

    (async () => {
      try {
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "content-type": "application/json",
          },
        });
        const bodyText = await res.text();

        if (!res.ok) {
          throw new Error(`Failed to load cycle data: ${res.status}`);
        }

        const data: any = bodyText ? JSON.parse(bodyText) : null;
        if (cancelled) return;

        const cycleStarts: string[] = Array.isArray(data?.cycleStartDates)
          ? (data.cycleStartDates as any[])
              .map((d) => String(d).slice(0, 10))
              .filter(Boolean)
              .sort()
          : [];

        setCycleStartDates(cycleStarts);

        // Update female cycle length override if available
        const freshOverride = data?.femaleCycleLenOverrideDays ?? null;
        if (freshOverride !== row.femaleCycleLenOverrideDays) {
          onUpdate({ femaleCycleLenOverrideDays: freshOverride });
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error("[WhatIfPlanner] Failed to load cycle history", e);
        setLoadError(e?.message || "Unable to load cycle history");
        setCycleStartDates([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [row.damId]);

  const handleFemaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const femaleId = e.target.value;
    if (!femaleId) {
      onUpdate({ damId: null, damName: null, species: null, cycleStartIso: null, breedText: null });
      return;
    }
    const female = females.find(f => String(f.id) === femaleId);
    if (female) {
      onUpdate({
        damId: female.id,
        damName: female.name,
        species: female.species,
        cycleStartIso: null,
        femaleCycleLenOverrideDays: female.femaleCycleLenOverrideDays,
        breedText: female.breedText ?? null,
      });
    }
  };

  const handleCycleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    onUpdate({ cycleStartIso: value });
  };

  // Calculate projected cycles
  const projectedCycles = React.useMemo(() => {
    if (!row.species) return [] as string[];
    const today = new Date().toISOString().slice(0, 10);
    const summary: any = {
      species: row.species,
      cycleStartsAsc: cycleStartDates,
      dob: null,
      today,
      femaleCycleLenOverrideDays: row.femaleCycleLenOverrideDays,
    };
    try {
      const { projected } = reproEngine.projectUpcomingCycleStarts(summary, {
        horizonMonths: 36,
        maxCount: 36
      } as any) as any;
      return Array.isArray(projected)
        ? projected.map((p: any) => p.date).filter(Boolean)
        : [];
    } catch (e) {
      console.error("[WhatIfPlanner] Failed to calculate projected cycles", e);
      return [];
    }
  }, [row.species, cycleStartDates, row.femaleCycleLenOverrideDays]);

  return (
    <div
      className="p-3 bg-neutral-800/50 dark:bg-neutral-800/50 rounded-lg"
      style={{ border: "1px solid rgba(115, 115, 115, 0.3)", borderLeft: "4px solid #f97316" }}
    >
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

        {/* Cycle start date - dropdown with projected cycles */}
        <div className="flex-1">
          <div className="text-xs text-secondary mb-1">Cycle Start</div>
          <select
            value={row.cycleStartIso ?? ""}
            onChange={handleCycleChange}
            disabled={!row.damId || projectedCycles.length === 0}
            className="w-full h-8 bg-neutral-900 dark:bg-neutral-900 text-neutral-100 rounded px-2 text-sm border border-neutral-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none"
          >
            <option value="">
              {!row.damId
                ? "Select a female first"
                : projectedCycles.length === 0
                ? "No projected cycles found"
                : "Select cycle start date..."}
            </option>
            {projectedCycles.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          {loadError && (
            <div className="text-xs text-red-500 mt-1">{loadError}</div>
          )}
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

          {/* Convert to Plan button - neutral style, not attention-grabbing */}
          <Tooltip content="Create a real breeding plan from this scenario">
            <button
              onClick={onConvertToPlan}
              disabled={!row.damId || !row.cycleStartIso || !row.species}
              className="h-8 px-3 text-xs font-medium bg-neutral-600 hover:bg-neutral-500 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-neutral-200 rounded transition-colors border border-neutral-500"
            >
              Make Real Plan
            </button>
          </Tooltip>

          {/* Remove button */}
          <Tooltip content="Remove this What If">
            <button
              onClick={onRemove}
              className="h-8 px-2 text-xs font-medium text-red-500 hover:bg-red-900/20 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * What If Row Card (Compact sidebar version)
 * ───────────────────────────────────────────────────────────────────────────── */
type WhatIfRowCardProps = {
  row: WhatIfRow;
  females: WhatIfFemale[];
  onUpdate: (updates: Partial<WhatIfRow>) => void;
  onRemove: () => void;
  onConvertToPlan: () => void;
};

function WhatIfRowCard({ row, females, onUpdate, onRemove, onConvertToPlan }: WhatIfRowCardProps) {
  // State for reproductive data
  const [cycleStartDates, setCycleStartDates] = React.useState<string[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Fetch reproductive data when female is selected
  React.useEffect(() => {
    let cancelled = false;
    setCycleStartDates([]);
    setLoadError(null);

    if (!row.damId) return;

    const include = "cycleStartDates";
    const url = `/api/v1/animals/${row.damId}?include=${encodeURIComponent(include)}`;

    (async () => {
      try {
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: { "content-type": "application/json" },
        });
        const bodyText = await res.text();

        if (!res.ok) throw new Error(`Failed to load cycle data: ${res.status}`);

        const data: any = bodyText ? JSON.parse(bodyText) : null;
        if (cancelled) return;

        const cycleStarts: string[] = Array.isArray(data?.cycleStartDates)
          ? (data.cycleStartDates as any[]).map((d) => String(d).slice(0, 10)).filter(Boolean).sort()
          : [];

        setCycleStartDates(cycleStarts);

        const freshOverride = data?.femaleCycleLenOverrideDays ?? null;
        if (freshOverride !== row.femaleCycleLenOverrideDays) {
          onUpdate({ femaleCycleLenOverrideDays: freshOverride });
        }
      } catch (e: any) {
        if (cancelled) return;
        setLoadError(e?.message || "Unable to load cycle history");
        setCycleStartDates([]);
      }
    })();

    return () => { cancelled = true; };
  }, [row.damId]);

  const handleFemaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const femaleId = e.target.value;
    if (!femaleId) {
      onUpdate({ damId: null, damName: null, species: null, cycleStartIso: null, breedText: null });
      return;
    }
    const female = females.find(f => String(f.id) === femaleId);
    if (female) {
      onUpdate({
        damId: female.id,
        damName: female.name,
        species: female.species,
        cycleStartIso: null,
        femaleCycleLenOverrideDays: female.femaleCycleLenOverrideDays,
        breedText: female.breedText ?? null,
      });
    }
  };

  const handleCycleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ cycleStartIso: e.target.value || null });
  };

  // Calculate projected cycles
  const projectedCycles = React.useMemo(() => {
    if (!row.species) return [] as string[];
    const today = new Date().toISOString().slice(0, 10);
    const summary: any = {
      species: row.species,
      cycleStartsAsc: cycleStartDates,
      dob: null,
      today,
      femaleCycleLenOverrideDays: row.femaleCycleLenOverrideDays,
    };
    try {
      const { projected } = reproEngine.projectUpcomingCycleStarts(summary, {
        horizonMonths: 36,
        maxCount: 36
      } as any) as any;
      return Array.isArray(projected) ? projected.map((p: any) => p.date).filter(Boolean) : [];
    } catch {
      return [];
    }
  }, [row.species, cycleStartDates, row.femaleCycleLenOverrideDays]);

  const isComplete = row.damId && row.cycleStartIso && row.species;

  return (
    <div
      className="p-3 bg-neutral-800/50 rounded-lg"
      style={{ border: "1px solid rgba(115, 115, 115, 0.3)", borderLeft: "4px solid #f97316" }}
    >
      {/* Header row with name and actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {row.showOnChart && isComplete && (
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Showing on chart" />
          )}
          <span className="text-sm font-medium truncate">
            {row.damName || "Select female..."}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <label className="flex items-center gap-1 cursor-pointer" title="Show on chart">
            <input
              type="checkbox"
              checked={row.showOnChart}
              onChange={(e) => onUpdate({ showOnChart: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-neutral-600 bg-neutral-900 text-orange-500 focus:ring-orange-500/50"
            />
          </label>
          <button
            onClick={onRemove}
            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Female select */}
      <select
        value={row.damId ? String(row.damId) : ""}
        onChange={handleFemaleChange}
        className="w-full h-8 mb-2 bg-neutral-900 text-neutral-100 rounded px-2 text-sm border border-neutral-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none"
      >
        <option value="">Select a female...</option>
        {females.map(female => (
          <option key={String(female.id)} value={String(female.id)}>
            {female.name} ({female.species})
          </option>
        ))}
      </select>

      {/* Cycle select */}
      <select
        value={row.cycleStartIso ?? ""}
        onChange={handleCycleChange}
        disabled={!row.damId || projectedCycles.length === 0}
        className="w-full h-8 mb-2 bg-neutral-900 text-neutral-100 rounded px-2 text-sm border border-neutral-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
      >
        <option value="">
          {!row.damId ? "Select female first" : projectedCycles.length === 0 ? "No projected cycles" : "Select cycle..."}
        </option>
        {projectedCycles.map((date) => (
          <option key={date} value={date}>{date}</option>
        ))}
      </select>

      {loadError && <div className="text-xs text-red-500 mb-2">{loadError}</div>}

      {/* Convert to Plan button - neutral style with confirmation */}
      {isComplete && (
        <ConvertToPlanButton onConvert={onConvertToPlan} damName={row.damName} cycleDate={row.cycleStartIso} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Convert to Plan Button (with confirmation)
 * ───────────────────────────────────────────────────────────────────────────── */
function ConvertToPlanButton({
  onConvert,
  damName,
  cycleDate,
}: {
  onConvert: () => void;
  damName: string | null;
  cycleDate: string | null;
}) {
  const [showConfirm, setShowConfirm] = React.useState(false);

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full h-8 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded transition-colors border border-neutral-500/50"
      >
        Make This a Real Plan
      </button>
    );
  }

  return (
    <div className="space-y-2 p-2 rounded-lg bg-amber-900/20 border border-amber-600/30">
      <p className="text-xs text-amber-200/90">
        This will create a <span className="font-semibold">real breeding plan</span> for{" "}
        <span className="font-semibold">{damName || "this female"}</span> starting{" "}
        <span className="font-semibold">{cycleDate || "on the selected date"}</span>.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          className="flex-1 h-7 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            onConvert();
          }}
          className="flex-1 h-7 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          Create Plan
        </button>
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
        Add What If scenarios to see projected timelines.
      </p>
    </div>
  );
}
