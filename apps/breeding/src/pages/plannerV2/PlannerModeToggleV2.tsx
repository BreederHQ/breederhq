// apps/breeding/src/pages/plannerV2/PlannerModeToggleV2.tsx
// Local toggle component for v2 planner pages - does not modify existing PlannerSwitch.tsx

import * as React from "react";

export type PlannerModeV2 = "rollup" | "per-plan";

type Props = {
  mode: PlannerModeV2;
  onChange: (m: PlannerModeV2) => void;
  className?: string;
};

export default function PlannerModeToggleV2({ mode, onChange, className = "" }: Props) {
  const tabs: { key: PlannerModeV2; label: string }[] = [
    { key: "rollup", label: "Rollup" },
    { key: "per-plan", label: "Per Plan" },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg bg-black/10 p-1 ${className}`}
      role="tablist"
      aria-label="Planner view mode"
    >
      {tabs.map((tab) => {
        const isActive = mode === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={[
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              isActive
                ? "bg-white dark:bg-neutral-800 text-primary shadow-sm"
                : "text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-neutral-700/50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
