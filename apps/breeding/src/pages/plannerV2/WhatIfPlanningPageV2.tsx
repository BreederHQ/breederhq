// apps/breeding/src/pages/plannerV2/WhatIfPlanningPageV2.tsx
// V2 Planner page - "What If Planning" with Rollup + What If controls
// This is a parallel implementation for review - does not modify existing planner

import * as React from "react";
import { SectionCard } from "@bhq/ui";
import RollupGantt from "../../components/RollupGantt";

type ID = string | number;

// Minimal plan shape for the page props
type PlanLike = {
  id: ID;
  name: string;
  lockedCycleStart?: string | null;
  [key: string]: any;
};

type Props = {
  /** Plans data - if not provided, shows empty state */
  plans?: PlanLike[];
};

export default function WhatIfPlanningPageV2({ plans }: Props) {
  // Local selection state for Rollup - default to all selected
  const [selectedKeys, setSelectedKeys] = React.useState<Set<ID>>(() => {
    if (!plans?.length) return new Set();
    return new Set(plans.map((p) => p.id));
  });

  // Sync selection when plans change
  React.useEffect(() => {
    if (!plans?.length) {
      setSelectedKeys(new Set());
      return;
    }
    setSelectedKeys((prev) => {
      if (prev.size === 0) {
        return new Set(plans.map((p) => p.id));
      }
      const valid = new Set(plans.map((p) => p.id));
      const next = new Set<ID>();
      prev.forEach((k) => {
        if (valid.has(k)) next.add(k);
      });
      return next;
    });
  }, [plans]);

  const hasPlans = plans && plans.length > 0;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-primary">What If Planning</h1>
        <p className="text-sm text-secondary mt-1">
          Explore hypothetical breeding scenarios and project timelines
        </p>
      </div>

      {/* Rollup Chart Section */}
      <SectionCard title="Timeline Rollup" className="mb-4">
        {!hasPlans ? (
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

            {/* Rollup Chart */}
            <RollupGantt
              items={plans}
              selected={selectedKeys}
              onSelectedChange={setSelectedKeys}
              className="w-full"
            />
          </div>
        )}
      </SectionCard>

      {/* What If Planner Section */}
      <SectionCard title="What If Planner (v2)">
        <WhatIfPlannerPlaceholder />
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * What If Planner Placeholder
 * ───────────────────────────────────────────────────────────────────────────── */
function WhatIfPlannerPlaceholder() {
  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="text-sm text-secondary">
        Add hypothetical cycles for active females and preview them on the Rollup timeline above.
      </div>

      {/* Placeholder for What If rows */}
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 p-4">
        <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
          Coming in v2
        </div>
        <div className="text-sm text-primary space-y-2">
          <p>The What If Planner will include:</p>
          <ul className="list-disc list-inside text-secondary space-y-1 ml-2">
            <li>Female selection dropdown (from active females in your roster)</li>
            <li>Cycle start date picker with projected dates from repro history</li>
            <li>"Show on chart" toggle for each What If row</li>
            <li>Computed timeline projection using reproEngine</li>
            <li>"Convert to Plan" action to make a What If into a real plan</li>
          </ul>
        </div>

        {/* Mock row to show UI intent */}
        <div className="mt-4 p-3 bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex-1">
              <div className="text-xs text-secondary mb-1">Female</div>
              <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded px-2 flex items-center text-secondary">
                Select a female...
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-secondary mb-1">Cycle Start</div>
              <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded px-2 flex items-center text-secondary">
                Select date...
              </div>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" disabled checked className="rounded" />
                <span className="text-secondary">Show</span>
              </label>
              <button
                disabled
                className="h-8 px-3 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-secondary rounded"
              >
                Convert to Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add row button placeholder */}
      <div className="flex justify-end">
        <button
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-secondary rounded-md cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Female
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
        {context === "rollup"
          ? "No plans provided to v2 page yet. Wire this in Phase 2 cutover."
          : "Add What If scenarios to see projected timelines."}
      </p>
    </div>
  );
}
