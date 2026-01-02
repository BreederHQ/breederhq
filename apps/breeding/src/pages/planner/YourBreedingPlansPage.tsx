// apps/breeding/src/pages/planner/YourBreedingPlansPage.tsx
// "Your Breeding Plans" page with Rollup/Per Plan toggle

import * as React from "react";
import { SectionCard } from "@bhq/ui";
import PlannerModeToggle, { type PlannerMode } from "./PlannerModeToggle";
import RollupWithPhaseToggles from "./RollupWithPhaseToggles";
import PhaseGroupedPerPlan from "./PhaseGroupedPerPlan";

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
  initialMode?: PlannerMode;
};

export default function YourBreedingPlansPage({ plans = [], initialMode = "rollup" }: Props) {
  const [mode, setMode] = React.useState<PlannerMode>(initialMode);

  const hasPlans = plans.length > 0;

  return (
    <>
      {/* Mode toggle row */}
      <div className="mb-4 flex items-center justify-end">
        <PlannerModeToggle mode={mode} onChange={setMode} />
      </div>

      {/* Content - conditional wrapper based on mode */}
      {!hasPlans ? (
        <SectionCard title={<span><span>Planner</span></span>}>
          <EmptyState />
        </SectionCard>
      ) : mode === "rollup" ? (
        // Rollup mode: keep the outer SectionCard wrapper
        <SectionCard title={<span><span>Planner</span></span>}>
          <RollupWithPhaseToggles
            plans={plans}
            allowSynthetic={false}
            className="w-full"
          />
        </SectionCard>
      ) : (
        // Per Plan mode: no outer wrapper - phase cards are the primary surfaces
        <PhaseGroupedPerPlan
          plans={plans}
          className="w-full"
        />
      )}
    </>
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
