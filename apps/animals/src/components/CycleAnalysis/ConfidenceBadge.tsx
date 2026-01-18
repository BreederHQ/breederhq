import * as React from "react";
import { Badge, Tooltip } from "@bhq/ui";
import type { ConfidenceLevel, DataSource } from "./types";

type ConfidenceBadgeProps = {
  confidence: ConfidenceLevel;
  source?: DataSource;
  showIcon?: boolean;
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { variant: "green" | "blue" | "neutral"; icon: string; label: string }> = {
  HIGH: { variant: "green", icon: "H", label: "Hormone-tested" },
  MEDIUM: { variant: "blue", icon: "C", label: "Back-calculated" },
  LOW: { variant: "neutral", icon: "E", label: "Estimated" },
};

const SOURCE_ICONS: Record<DataSource, string> = {
  HORMONE_TEST: "H",
  BIRTH_CALCULATED: "C",
  ESTIMATED: "E",
};

const SOURCE_LABELS: Record<DataSource, string> = {
  HORMONE_TEST: "Hormone-tested",
  BIRTH_CALCULATED: "Calculated from birth",
  ESTIMATED: "Estimated",
};

export function ConfidenceBadge({
  confidence,
  source,
  showIcon = true,
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence];
  const displayLabel = source ? SOURCE_LABELS[source] : config.label;
  const displayIcon = source ? SOURCE_ICONS[source] : config.icon;

  const tooltipContent = (
    <div className="text-xs max-w-xs">
      <div className="font-medium">{displayLabel}</div>
      <div className="text-secondary mt-1">
        {confidence === "HIGH" && "Ovulation confirmed via progesterone or LH testing"}
        {confidence === "MEDIUM" && "Ovulation back-calculated from actual birth date (birth - 63 days)"}
        {confidence === "LOW" && "Ovulation estimated from species average offset"}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <Badge variant={config.variant} className="gap-1">
        {showIcon && <span className="font-bold">{displayIcon}</span>}
        {displayLabel}
      </Badge>
    </Tooltip>
  );
}
