// apps/breeding/src/pages/planner/PlannerModeToggle.tsx
// Toggle component for planner view modes (Rollup vs Per Plan)
// Uses orange button toggle style matching Table|Cards toggle

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
    <div
      className={`flex items-center rounded-lg border border-hairline overflow-hidden ${className}`}
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
            className={`px-3 py-1.5 text-sm transition-colors select-none ${
              isActive
                ? "bg-[hsl(var(--brand-orange))] text-black"
                : "bg-transparent text-secondary hover:text-primary hover:bg-[hsl(var(--muted)/0.5)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
