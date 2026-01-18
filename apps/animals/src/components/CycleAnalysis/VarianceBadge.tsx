import * as React from "react";
import { Badge, Tooltip } from "@bhq/ui";

type VarianceBadgeProps = {
  variance: number;
};

export function VarianceBadge({ variance }: VarianceBadgeProps) {
  if (variance === 0) {
    return (
      <Badge variant="blue">
        on avg
      </Badge>
    );
  }

  const isLate = variance > 0;
  const variant = Math.abs(variance) >= 3 ? "amber" : isLate ? "neutral" : "green";
  const label = isLate
    ? `+${variance} day${Math.abs(variance) !== 1 ? "s" : ""}`
    : `${variance} day${Math.abs(variance) !== 1 ? "s" : ""}`;

  const tooltipContent = isLate
    ? `${variance} day${Math.abs(variance) !== 1 ? "s" : ""} later than species average`
    : `${Math.abs(variance)} day${Math.abs(variance) !== 1 ? "s" : ""} earlier than species average`;

  return (
    <Tooltip content={tooltipContent}>
      <Badge variant={variant}>
        {label}
      </Badge>
    </Tooltip>
  );
}
