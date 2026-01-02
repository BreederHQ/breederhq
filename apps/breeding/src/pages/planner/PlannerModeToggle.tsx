// apps/breeding/src/pages/planner/PlannerModeToggle.tsx
// Toggle component for planner view modes (Rollup vs Per Plan)
// Uses underline-style tabs

import * as React from "react";

export type PlannerMode = "rollup" | "per-plan";

type Props = {
  mode: PlannerMode;
  onChange: (m: PlannerMode) => void;
  className?: string;
};

export default function PlannerModeToggle({ mode, onChange, className = "" }: Props) {
  const tabs: { key: PlannerMode; label: string }[] = [
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
