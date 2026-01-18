import * as React from "react";
import { Badge, Tooltip } from "@bhq/ui";
import type { OvulationClassification, ConfidenceLevel } from "./types";

type OvulationPatternBadgeProps = {
  classification: OvulationClassification;
  confidence: ConfidenceLevel;
  sampleSize: number;
};

const CLASSIFICATION_CONFIG: Record<OvulationClassification, { variant: "green" | "blue" | "amber" | "neutral"; icon: string }> = {
  "Early Ovulator": { variant: "green", icon: "" },
  "Average": { variant: "blue", icon: "" },
  "Late Ovulator": { variant: "amber", icon: "" },
  "Insufficient Data": { variant: "neutral", icon: "" },
};

const CONFIDENCE_DESCRIPTION: Record<ConfidenceLevel, string> = {
  HIGH: "3+ hormone-tested ovulations, consistent pattern",
  MEDIUM: "2 hormone-tested OR back-calculated from births",
  LOW: "Single data point or breed average estimate",
};

export function OvulationPatternBadge({
  classification,
  confidence,
  sampleSize,
}: OvulationPatternBadgeProps) {
  const config = CLASSIFICATION_CONFIG[classification];

  const tooltipContent = (
    <div className="text-xs max-w-xs">
      <div className="font-medium mb-1">{classification}</div>
      <div className="text-secondary mb-2">
        Confidence: {confidence} - {CONFIDENCE_DESCRIPTION[confidence]}
      </div>
      <div className="text-secondary">
        Based on {sampleSize} cycle{sampleSize !== 1 ? "s" : ""}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <Badge variant={config.variant}>
        {classification}
        {sampleSize > 0 && classification !== "Insufficient Data" && (
          <span className="ml-1 opacity-70">({sampleSize})</span>
        )}
      </Badge>
    </Tooltip>
  );
}
