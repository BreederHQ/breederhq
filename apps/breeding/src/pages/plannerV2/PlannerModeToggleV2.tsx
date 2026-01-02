// apps/breeding/src/pages/plannerV2/PlannerModeToggleV2.tsx
// Local toggle component for v2 planner pages - does not modify existing PlannerSwitch.tsx
// Uses underline-style tabs matching legacy Planner design

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
    <nav
      className={`inline-flex items-end gap-6 ${className}`}
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
              "pb-1 text-sm font-medium transition-colors select-none",
              isActive
                ? "text-neutral-900 dark:text-neutral-50"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
            ].join(" ")}
            style={{
              borderBottom: isActive
                ? "2px solid #f97316"
                : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
