// apps/breeding/src/pages/plannerV2/YourBreedingPlansPageV2.tsx
// V2 Planner page - "Your Breeding Plans" with Rollup/Per Plan toggle
// This is a parallel implementation for review - does not modify existing planner

import * as React from "react";
import { SectionCard } from "@bhq/ui";
import PlannerModeToggleV2, { type PlannerModeV2 } from "./PlannerModeToggleV2";
import RollupWithPhaseTogglesV2 from "./RollupWithPhaseTogglesV2";
import PhaseGroupedPerPlanV2 from "./PhaseGroupedPerPlanV2";

type ID = string | number;

// Minimal plan shape for the page props
type PlanLike = {
  id: ID;
  name: string;
  lockedCycleStart?: string | null;
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
  /** Plans data - if not provided, shows empty state */
  plans?: PlanLike[];
  /** Optional initial mode */
  initialMode?: PlannerModeV2;
};

export default function YourBreedingPlansPageV2({ plans = [], initialMode = "rollup" }: Props) {
  const [mode, setMode] = React.useState<PlannerModeV2>(initialMode);

  const hasPlans = plans.length > 0;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Page Header with mode toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">Your Breeding Plans</h1>
          <p className="text-sm text-secondary mt-1">
            Plan and track your breeding program timeline
          </p>
        </div>
        <PlannerModeToggleV2 mode={mode} onChange={setMode} />
      </div>

      {/* Content - conditional wrapper based on mode */}
      {!hasPlans ? (
        <SectionCard title={<span><span>Planner</span></span>}>
          <EmptyState />
        </SectionCard>
      ) : mode === "rollup" ? (
        // Rollup mode: keep the outer SectionCard wrapper
        <SectionCard title={<span><span>Planner</span></span>}>
          <RollupWithPhaseTogglesV2
            plans={plans}
            allowSynthetic={false}
            className="w-full"
          />
        </SectionCard>
      ) : (
        // Per Plan mode: no outer wrapper - phase cards are the primary surfaces
        <PhaseGroupedPerPlanV2
          plans={plans}
          className="w-full"
        />
      )}
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
      <h3 className="text-sm font-medium text-primary mb-1">No breeding plans</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        Create breeding plans to see them displayed here with timeline visualization.
      </p>
    </div>
  );
}
