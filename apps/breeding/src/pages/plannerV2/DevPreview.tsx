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

type PreviewPage = "breeding-plans" | "what-if";

// Sample mock data for development preview
const MOCK_PLANS = [
  {
    id: "mock-1",
    name: "Luna x Max - Spring 2026",
    species: "Dog",
    lockedCycleStart: "2026-02-15",
    expectedCycleStart: "2026-02-15",
    expectedBreedDate: "2026-02-25",
    expectedBirthDate: "2026-04-27",
    expectedPlacementStartDate: "2026-06-22",
    expectedPlacementCompleted: "2026-07-06",
  },
  {
    id: "mock-2",
    name: "Bella x Duke - Summer 2026",
    species: "Dog",
    lockedCycleStart: "2026-05-01",
    expectedCycleStart: "2026-05-01",
    expectedBreedDate: "2026-05-11",
    expectedBirthDate: "2026-07-12",
    expectedPlacementStartDate: "2026-09-06",
    expectedPlacementCompleted: "2026-09-20",
  },
  {
    id: "mock-3",
    name: "Daisy x Cooper - Fall 2026",
    species: "Dog",
    lockedCycleStart: "2026-08-10",
    expectedCycleStart: "2026-08-10",
    expectedBreedDate: "2026-08-20",
    expectedBirthDate: "2026-10-21",
    expectedPlacementStartDate: "2026-12-16",
    expectedPlacementCompleted: "2026-12-30",
  },
];

export function PlannerV2DevPreview() {
  const [currentPage, setCurrentPage] = React.useState<PreviewPage>("breeding-plans");
  const [useMockData, setUseMockData] = React.useState(true);

  const plans = useMockData ? MOCK_PLANS : undefined;

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
              Planner V2 Pages
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Page selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 dark:text-amber-300">Page:</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value as PreviewPage)}
                className="text-sm bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded px-2 py-1"
              >
                <option value="breeding-plans">Your Breeding Plans</option>
                <option value="what-if">What If Planning</option>
              </select>
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
      </div>

      {/* Page content */}
      <div className="pb-8">
        {currentPage === "breeding-plans" ? (
          <YourBreedingPlansPageV2 plans={plans} />
        ) : (
          <WhatIfPlanningPageV2 plans={plans} />
        )}
      </div>

      {/* Dev info footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 text-neutral-300 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>
            Viewing: <code className="bg-neutral-700 px-1 rounded">{currentPage}</code>
          </span>
          <span>
            Plans: {plans?.length ?? 0} | Mock data: {useMockData ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PlannerV2DevPreview;
