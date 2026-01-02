// apps/breeding/src/pages/plannerV2/YourBreedingPlansPageV2.tsx
// V2 Planner page - "Your Breeding Plans" with Rollup/Per Plan toggle
// This is a parallel implementation for review - does not modify existing planner

import * as React from "react";
import { SectionCard } from "@bhq/ui";
import RollupGantt from "../../components/RollupGantt";
import PerPlanGantt from "../../components/PerPlanGantt";
import PlannerModeToggleV2, { type PlannerModeV2 } from "./PlannerModeToggleV2";

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
  /** Optional initial mode */
  initialMode?: PlannerModeV2;
};

export default function YourBreedingPlansPageV2({ plans, initialMode = "rollup" }: Props) {
  const [mode, setMode] = React.useState<PlannerModeV2>(initialMode);

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
    // Auto-select all on first load
    setSelectedKeys((prev) => {
      if (prev.size === 0) {
        return new Set(plans.map((p) => p.id));
      }
      // Prune removed plans
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
        <h1 className="text-xl font-semibold text-primary">Your Breeding Plans</h1>
        <p className="text-sm text-secondary mt-1">
          Plan and track your breeding program timeline
        </p>
      </div>

      {/* Main Content Card */}
      <SectionCard
        title="Planner"
        right={<PlannerModeToggleV2 mode={mode} onChange={setMode} />}
      >
        {!hasPlans ? (
          <EmptyState />
        ) : mode === "rollup" ? (
          <RollupView
            plans={plans}
            selectedKeys={selectedKeys}
            onSelectedChange={setSelectedKeys}
          />
        ) : (
          <PerPlanView plans={plans} />
        )}
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Rollup View
 * ───────────────────────────────────────────────────────────────────────────── */
function RollupView({
  plans,
  selectedKeys,
  onSelectedChange,
}: {
  plans: PlanLike[];
  selectedKeys: Set<ID>;
  onSelectedChange: (s: Set<ID>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Phase toggles placeholder */}
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 p-3">
        <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">
          Coming in v2
        </div>
        <div className="text-sm text-primary">
          Phase toggles will appear here in v2 - tri-state checkboxes to show/hide plans by phase
          (Planning, Committed, Bred, Birthed, etc.)
        </div>
      </div>

      {/* Rollup Chart */}
      <RollupGantt
        items={plans}
        selected={selectedKeys}
        onSelectedChange={onSelectedChange}
        className="w-full"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Per Plan View
 * ───────────────────────────────────────────────────────────────────────────── */
function PerPlanView({ plans }: { plans: PlanLike[] }) {
  return (
    <div className="space-y-4">
      {/* Phase grouping placeholder */}
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 p-3">
        <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">
          Coming in v2
        </div>
        <div className="text-sm text-primary">
          Phase SectionCards will be applied here in v2 - plans grouped into collapsible sections
          by their current phase (Planning, Committed, Bred, etc.)
        </div>
      </div>

      {/* Per Plan Chart (ungrouped for now) */}
      <PerPlanGantt plans={plans} className="w-full" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ───────────────────────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
        <svg
          className="w-6 h-6 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-primary mb-1">No plans provided</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        No plans provided to v2 page yet. Wire this in Phase 2 cutover.
      </p>
    </div>
  );
}
