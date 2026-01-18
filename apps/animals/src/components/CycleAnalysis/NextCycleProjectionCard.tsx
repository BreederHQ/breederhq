import * as React from "react";
import { Tooltip } from "@bhq/ui";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { NextCycleProjection, ConfidenceLevel, OvulationPattern } from "./types";

type NextCycleProjectionCardProps = {
  projection: NextCycleProjection;
  ovulationPattern: OvulationPattern;
  species: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateRange(earliest: string, latest: string): string {
  const e = new Date(earliest);
  const l = new Date(latest);

  // Same month
  if (e.getMonth() === l.getMonth() && e.getFullYear() === l.getFullYear()) {
    return `${e.toLocaleDateString("en-US", { month: "short" })} ${e.getDate()}-${l.getDate()}, ${l.getFullYear()}`;
  }

  return `${formatDate(earliest)} - ${formatDate(latest)}`;
}

function getPatternGuidance(pattern: OvulationPattern, species: string): string | null {
  if (!pattern.avgOffsetDays) return null;

  const speciesDefaults: Record<string, number> = {
    DOG: 12,
    HORSE: 5,
    CAT: 0,
    GOAT: 2,
    SHEEP: 2,
  };

  const speciesDefault = speciesDefaults[species] ?? 12;
  const variance = pattern.avgOffsetDays - speciesDefault;

  if (Math.abs(variance) < 1) return null;

  if (variance > 0) {
    return `This female typically ovulates ${Math.round(variance)} day${Math.abs(variance) !== 1 ? "s" : ""} later than breed average. Plan progesterone testing accordingly.`;
  } else {
    return `This female typically ovulates ${Math.abs(Math.round(variance))} day${Math.abs(variance) !== 1 ? "s" : ""} earlier than breed average. Start testing early.`;
  }
}

export function NextCycleProjectionCard({
  projection,
  ovulationPattern,
  species,
}: NextCycleProjectionCardProps) {
  if (!projection) {
    return null;
  }

  const guidance = getPatternGuidance(ovulationPattern, species);

  return (
    <div className="mt-3 rounded-lg border border-hairline bg-surface-strong p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium">Next Projected Cycle</span>
        <ConfidenceBadge confidence={projection.confidence} showIcon={false} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-secondary">Heat Expected</div>
          <div className="font-medium">{formatDate(projection.projectedHeatStart)}</div>
        </div>

        {projection.projectedOvulationWindow && (
          <div>
            <div className="text-xs text-secondary flex items-center gap-1">
              Ovulation Window
              <Tooltip content="Based on this female's individual pattern and historical data">
                <span className="cursor-help text-secondary">?</span>
              </Tooltip>
            </div>
            <div className="font-medium">
              {formatDateRange(
                projection.projectedOvulationWindow.earliest,
                projection.projectedOvulationWindow.latest
              )}
            </div>
            <div className="text-xs text-secondary">
              Most likely: {formatDate(projection.projectedOvulationWindow.mostLikely)}
            </div>
          </div>
        )}

        {projection.recommendedTestingStart && (
          <div>
            <div className="text-xs text-secondary">Start Testing</div>
            <div className="font-medium">{formatDate(projection.recommendedTestingStart)}</div>
          </div>
        )}
      </div>

      {guidance && (
        <div className="mt-3 pt-3 border-t border-hairline text-xs text-secondary flex items-start gap-2">
          <span className="flex-shrink-0">Info:</span>
          <span>{guidance}</span>
        </div>
      )}
    </div>
  );
}
