// apps/breeding/src/components/PlannerSwitch.tsx
import * as React from "react";
// import { Button } from "@bhq/ui"; // ⟵ remove (unused)

export type PlannerMode = "per-plan" | "master";

type Props = {
  mode: PlannerMode;
  onChange: (m: PlannerMode) => void;
  className?: string;
  masterEnabled?: boolean; // ⟵ optional gate
};

function PlannerSwitch({ mode, onChange, className, masterEnabled = true }: Props) {
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
        aria-disabled={!masterEnabled}
        disabled={!masterEnabled}
        onClick={masterEnabled ? setMaster : undefined}
        className={[
          "ml-1 px-3 h-8 rounded-md text-sm font-medium transition",
          mode === "master" ? "bg-white/10 text-primary" : "text-secondary hover:text-primary",
          !masterEnabled ? "opacity-50 cursor-not-allowed hover:text-secondary" : "",
        ].join(" ")}
        title={masterEnabled ? "Master" : "Coming soon"}
      >
        Master
      </button>
    </div>
  );
}

export const PlannerModeSwitch = PlannerSwitch;
export default PlannerSwitch;
