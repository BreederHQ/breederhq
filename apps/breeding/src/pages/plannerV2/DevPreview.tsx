// apps/breeding/src/pages/plannerV2/DevPreview.tsx
// Development preview component for viewing Planner V2 pages
// Mount this component to preview the v2 pages without modifying App-Breeding.tsx
//
// Usage (add to a new dev route or temporary test harness):
//   import { PlannerV2DevPreview } from "./pages/plannerV2/DevPreview";
//   <PlannerV2DevPreview />
//
// Or view individual pages:
//   import { YourBreedingPlansPageV2 } from "./pages/plannerV2";
//   <YourBreedingPlansPageV2 plans={yourPlansArray} />

import * as React from "react";
import YourBreedingPlansPageV2 from "./YourBreedingPlansPageV2";
import WhatIfPlanningPageV2 from "./WhatIfPlanningPageV2";
import type { WhatIfFemale } from "./whatIfTypes.v2";

type PreviewPage = "breeding-plans" | "what-if";

// Enhanced mock data for development preview
// Covers multiple phases to test tri-state toggles and phase grouping
const MOCK_PLANS = [
  // PLANNING - has dam+sire but no breed date
  {
    id: "plan-planning-1",
    name: "Luna x Max - Planning",
    species: "Dog",
    damId: 101,
    sireId: 201,
    lockedCycleStart: "2026-03-01",
    expectedCycleStart: "2026-03-01",
    expectedBreedDate: "2026-03-11",
    expectedBirthDate: "2026-05-12",
    expectedPlacementStartDate: "2026-07-07",
    expectedPlacementCompleted: "2026-07-21",
    breedDateActual: null,
    birthDateActual: null,
  },
  // COMMITTED - has dam+sire, 2+ plans for indeterminate testing
  {
    id: "plan-committed-1",
    name: "Bella x Duke - Committed",
    species: "Dog",
    damId: 102,
    sireId: 202,
    lockedCycleStart: "2026-04-15",
    expectedCycleStart: "2026-04-15",
    expectedBreedDate: "2026-04-25",
    expectedBirthDate: "2026-06-26",
    expectedPlacementStartDate: "2026-08-21",
    expectedPlacementCompleted: "2026-09-04",
    breedDateActual: null,
    birthDateActual: null,
  },
  {
    id: "plan-committed-2",
    name: "Sadie x Bear - Committed",
    species: "Dog",
    damId: 103,
    sireId: 203,
    lockedCycleStart: "2026-04-20",
    expectedCycleStart: "2026-04-20",
    expectedBreedDate: "2026-04-30",
    expectedBirthDate: "2026-07-01",
    expectedPlacementStartDate: "2026-08-26",
    expectedPlacementCompleted: "2026-09-09",
    breedDateActual: null,
    birthDateActual: null,
  },
  // BRED - has breedDateActual
  {
    id: "plan-bred-1",
    name: "Daisy x Cooper - Bred",
    species: "Dog",
    damId: 104,
    sireId: 204,
    lockedCycleStart: "2026-01-10",
    expectedCycleStart: "2026-01-10",
    expectedBreedDate: "2026-01-20",
    breedDateActual: "2026-01-21",
    expectedBirthDate: "2026-03-23",
    expectedPlacementStartDate: "2026-05-18",
    expectedPlacementCompleted: "2026-06-01",
    birthDateActual: null,
  },
  // BIRTHED - has birthDateActual
  {
    id: "plan-birthed-1",
    name: "Molly x Tucker - Birthed",
    species: "Dog",
    damId: 105,
    sireId: 205,
    lockedCycleStart: "2025-10-01",
    expectedCycleStart: "2025-10-01",
    breedDateActual: "2025-10-12",
    expectedBirthDate: "2025-12-13",
    birthDateActual: "2025-12-14",
    expectedWeaned: "2026-01-25",
    expectedPlacementStartDate: "2026-02-08",
    expectedPlacementCompleted: "2026-02-22",
    weanedDateActual: null,
  },
  // WEANED - has weanedDateActual
  {
    id: "plan-weaned-1",
    name: "Bailey x Zeus - Weaned",
    species: "Dog",
    damId: 106,
    sireId: 206,
    lockedCycleStart: "2025-07-01",
    expectedCycleStart: "2025-07-01",
    breedDateActual: "2025-07-12",
    birthDateActual: "2025-09-12",
    weanedDateActual: "2025-10-24",
    expectedPlacementStartDate: "2025-11-07",
    expectedPlacementCompleted: "2025-11-21",
    placementStartDateActual: null,
  },
  // HOMING_STARTED - has placementStartDateActual
  {
    id: "plan-homing-1",
    name: "Chloe x Rocky - Homing",
    species: "Dog",
    damId: 107,
    sireId: 207,
    lockedCycleStart: "2025-04-01",
    expectedCycleStart: "2025-04-01",
    breedDateActual: "2025-04-12",
    birthDateActual: "2025-06-13",
    weanedDateActual: "2025-07-25",
    placementStartDateActual: "2025-08-08",
    expectedPlacementCompleted: "2025-08-22",
    placementCompletedDateActual: null,
  },
  // COMPLETE - has placementCompletedDateActual or completedDateActual
  {
    id: "plan-complete-1",
    name: "Maggie x Charlie - Complete",
    species: "Dog",
    damId: 108,
    sireId: 208,
    lockedCycleStart: "2025-01-15",
    expectedCycleStart: "2025-01-15",
    breedDateActual: "2025-01-26",
    birthDateActual: "2025-03-29",
    weanedDateActual: "2025-05-10",
    placementStartDateActual: "2025-05-24",
    placementCompletedDateActual: "2025-06-07",
    status: null, // status derived from dates
  },
  // Plan without lockedCycleStart - should be filtered from chart
  {
    id: "plan-no-cycle",
    name: "Pending Setup - No Cycle Date",
    species: "Dog",
    damId: 109,
    sireId: 209,
    lockedCycleStart: null,
    expectedCycleStart: null,
    expectedBreedDate: null,
    expectedBirthDate: null,
  },
  // CANCELED status
  {
    id: "plan-canceled-1",
    name: "Canceled Plan",
    species: "Dog",
    damId: 110,
    sireId: 210,
    lockedCycleStart: "2025-06-01",
    expectedCycleStart: "2025-06-01",
    status: "CANCELED",
  },
];

// Mock females for What If planner
const MOCK_FEMALES: WhatIfFemale[] = [
  { id: 101, name: "Luna", species: "Dog", femaleCycleLenOverrideDays: null },
  { id: 102, name: "Bella", species: "Dog", femaleCycleLenOverrideDays: 21 },
  { id: 103, name: "Sadie", species: "Dog", femaleCycleLenOverrideDays: null },
  { id: 111, name: "Whiskers", species: "Cat", femaleCycleLenOverrideDays: null },
  { id: 112, name: "Mittens", species: "Cat", femaleCycleLenOverrideDays: 14 },
];

const TABS: { key: PreviewPage; label: string }[] = [
  { key: "breeding-plans", label: "Your Breeding Plans" },
  { key: "what-if", label: "What If Planning" },
];

export function PlannerV2DevPreview() {
  const [currentPage, setCurrentPage] = React.useState<PreviewPage>("breeding-plans");
  const [useMockData, setUseMockData] = React.useState(true);

  const plans = useMockData ? MOCK_PLANS : [];
  const females = useMockData ? MOCK_FEMALES : [];

  // Count plans by phase for inspector
  const phaseCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      PLANNING: 0, COMMITTED: 0, BRED: 0, BIRTHED: 0,
      WEANED: 0, HOMING_STARTED: 0, COMPLETE: 0, CANCELED: 0, NO_CYCLE: 0,
    };
    for (const p of plans) {
      if (!p.lockedCycleStart) {
        counts.NO_CYCLE++;
      } else if (p.status === "CANCELED") {
        counts.CANCELED++;
      } else if (p.placementCompletedDateActual || p.completedDateActual) {
        counts.COMPLETE++;
      } else if (p.placementStartDateActual) {
        counts.HOMING_STARTED++;
      } else if (p.weanedDateActual) {
        counts.WEANED++;
      } else if (p.birthDateActual) {
        counts.BIRTHED++;
      } else if (p.breedDateActual) {
        counts.BRED++;
      } else if (p.damId && p.sireId) {
        counts.COMMITTED++;
      } else {
        counts.PLANNING++;
      }
    }
    return counts;
  }, [plans]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Dev toolbar */}
      <div className="sticky top-0 z-50 bg-amber-100 dark:bg-amber-900 border-b border-amber-300 dark:border-amber-700 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded text-amber-800 dark:text-amber-200">
              DEV PREVIEW
            </span>
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Planner V2
            </span>
          </div>

          {/* Mock data toggle */}
          <label className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300">
            <input
              type="checkbox"
              checked={useMockData}
              onChange={(e) => setUseMockData(e.target.checked)}
              className="rounded"
            />
            Mock data
          </label>
        </div>
      </div>

      {/* Tab navigation - dark theme consistent */}
      <div className="border-b border-neutral-700 bg-neutral-800">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1" aria-label="Planner tabs">
            {TABS.map((tab) => {
              const isActive = currentPage === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentPage(tab.key)}
                  className={[
                    "relative px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "text-neutral-100"
                      : "text-neutral-400 hover:text-neutral-200",
                  ].join(" ")}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t bg-[hsl(var(--brand-orange,24_94%_50%))]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="pb-16">
        {currentPage === "breeding-plans" ? (
          <YourBreedingPlansPageV2 plans={plans} />
        ) : (
          <WhatIfPlanningPageV2 plans={plans} females={females} />
        )}
      </div>

      {/* Dev info footer with selection inspector */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 text-neutral-300 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span>
              Viewing: <code className="bg-neutral-700 px-1 rounded">{currentPage}</code>
            </span>
            <span>
              Plans: {plans.length} | Females: {females.length} | Mock: {useMockData ? "ON" : "OFF"}
            </span>
          </div>
          {/* Phase counts inspector */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-400">
            <span>Phase breakdown:</span>
            {Object.entries(phaseCounts).map(([phase, count]) => (
              count > 0 && (
                <span key={phase} className="bg-neutral-700/50 px-1.5 py-0.5 rounded">
                  {phase}: {count}
                </span>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlannerV2DevPreview;
