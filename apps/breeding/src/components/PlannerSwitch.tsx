// apps/breeding/src/components/PlannerSwitch.tsx
import * as React from "react";
import { Button } from "@bhq/ui";

export type PlannerMode = "per-plan" | "master";

type Props = {
  mode: PlannerMode;
  onChange: (m: PlannerMode) => void;
  className?: string;
};

/**
 * Simple, accessible two-state planner mode switch.
 * Pure UI: does NOT render any charts or depend on plan data.
 */
function PlannerSwitch({ mode, onChange, className }: Props) {
  const setPerPlan = React.useCallback(() => onChange("per-plan"), [onChange]);
  const setMaster = React.useCallback(() => onChange("master"), [onChange]);

  return (
    <div
      className={["inline-flex items-center rounded-md border border-hairline bg-surface p-1", className || ""].join(" ")}
      role="tablist"
      aria-label="Planner view mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "per-plan"}
        onClick={setPerPlan}
        className={[
          "px-3 h-8 rounded-md text-sm font-medium transition",
          mode === "per-plan" ? "bg-white/10 text-primary" : "text-secondary hover:text-primary",
        ].join(" ")}
      >
        Per plan
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "master"}
        onClick={setMaster}
        className={[
          "ml-1 px-3 h-8 rounded-md text-sm font-medium transition",
          mode === "master" ? "bg-white/10 text-primary" : "text-secondary hover:text-primary",
        ].join(" ")}
      >
        Master
      </button>
    </div>
  );
}

/** Alias for imports that expect a named export */
export const PlannerModeSwitch = PlannerSwitch;

export default PlannerSwitch;
