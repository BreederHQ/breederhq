import * as React from "react";
import { Button } from "@bhq/ui";

export type PlannerMode = "per-plan" | "master";

export function PlannerModeSwitch({ mode, onChange }: { mode: PlannerMode; onChange: (m: PlannerMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-hairline p-1 bg-surface">
      <Button
        size="sm"
        variant={mode === "per-plan" ? "default" : "ghost"}
        onClick={() => onChange("per-plan")}
      >
        Per plan
      </Button>
      <Button
        size="sm"
        variant={mode === "master" ? "default" : "ghost"}
        onClick={() => onChange("master")}
      >
        Master
      </Button>
    </div>
  );
}
