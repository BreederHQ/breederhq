// apps/breeding/src/components/PlannerSwitch.tsx
import * as React from "react";

export type PlannerMode = "per-plan" | "rollup";

type Props = {
  mode: PlannerMode;
  onChange: (m: PlannerMode) => void;
  className?: string;
  rollupEnabled?: boolean;
};

export default function PlannerSwitch({
  mode,
  onChange,
  className,
  rollupEnabled = true,
}: Props) {
  const containerClasses = [
    "inline-flex items-end gap-6", // no borders here
    className || "",
  ].join(" ");

  const baseTab =
    "pb-1 text-sm font-medium transition-colors select-none";

  const inactiveText =
    "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100";
  const activeText = "text-neutral-900 dark:text-neutral-50";

  const disabledText =
    "opacity-50 cursor-not-allowed text-neutral-400 dark:text-neutral-500";

  return (
    <div
      className={containerClasses}
      role="tablist"
      aria-label="Planner view mode"
    >
      {/* Per Plan */}
      <button
        type="button"
        role="tab"
        aria-selected={mode === "per-plan"}
        onClick={() => onChange("per-plan")}
        className={[
          baseTab,
          mode === "per-plan" ? activeText : inactiveText,
        ].join(" ")}
        style={{
          borderBottom:
            mode === "per-plan"
              ? "2px solid #f97316" // orange underline
              : "2px solid transparent",
        }}
      >
        Per Plan
      </button>

      {/* Rollup */}
      <button
        type="button"
        role="tab"
        aria-selected={mode === "rollup"}
        aria-disabled={!rollupEnabled}
        disabled={!rollupEnabled}
        onClick={rollupEnabled ? () => onChange("rollup") : undefined}
        className={[
          baseTab,
          !rollupEnabled
            ? disabledText
            : mode === "rollup"
            ? activeText
            : inactiveText,
        ].join(" ")}
        style={{
          borderBottom:
            mode === "rollup"
              ? "2px solid #f97316"
              : "2px solid transparent",
        }}
      >
        Rollup
      </button>
    </div>
  );
}
