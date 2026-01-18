import * as React from "react";
import { SectionCard, Button } from "@bhq/ui";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { CycleAnalysisResult, CycleHistoryEntry } from "./types";

type OvulationPatternAnalysisProps = {
  analysis: CycleAnalysisResult;
  onLearnMore?: () => void;
};

// Species defaults for ovulation offset (days from cycle start)
const SPECIES_DEFAULTS: Record<string, number> = {
  DOG: 12,
  HORSE: 5,
  CAT: 0,
  GOAT: 2,
  SHEEP: 2,
  RABBIT: 0,
  PIG: 2,
  CATTLE: 1,
};

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

type OvulationBarChartProps = {
  cycles: CycleHistoryEntry[];
  avgOffset: number | null;
  speciesDefault: number;
};

function OvulationBarChart({ cycles, avgOffset, speciesDefault }: OvulationBarChartProps) {
  // Filter to only cycles with offset data
  const cyclesWithOffset = cycles.filter(c => c.offsetDays !== null);

  if (cyclesWithOffset.length === 0) {
    return null;
  }

  // Calculate chart bounds
  const allOffsets = cyclesWithOffset.map(c => c.offsetDays!);
  const minOffset = Math.min(...allOffsets, speciesDefault, avgOffset ?? speciesDefault);
  const maxOffset = Math.max(...allOffsets, speciesDefault, avgOffset ?? speciesDefault);

  // Add padding
  const chartMin = Math.max(0, minOffset - 2);
  const chartMax = maxOffset + 2;
  const range = chartMax - chartMin;

  const getBarWidth = (offset: number) => {
    return ((offset - chartMin) / range) * 100;
  };

  const getPosition = (offset: number) => {
    return ((offset - chartMin) / range) * 100;
  };

  const confidenceColors: Record<string, string> = {
    HIGH: "bg-green-500",
    MEDIUM: "bg-blue-500",
    LOW: "bg-gray-400",
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-secondary mb-3">Cycle Start - Ovulation (Days)</div>

      {/* Cycle bars */}
      {cyclesWithOffset.slice(0, 5).map((cycle, idx) => (
        <div key={cycle.id} className="flex items-center gap-3">
          <div className="w-20 text-xs text-secondary text-right">
            {formatMonth(cycle.cycleStart)}
          </div>
          <div className="flex-1 relative h-5">
            <div className="absolute inset-0 bg-surface-strong rounded" />
            <div
              className={`absolute top-0 left-0 h-full rounded ${confidenceColors[cycle.confidence]}`}
              style={{ width: `${getBarWidth(cycle.offsetDays!)}%` }}
            />
            <span className="absolute top-0 right-2 text-xs leading-5 text-secondary">
              {cycle.offsetDays} days
              {cycle.variance !== null && cycle.variance !== 0 && (
                <span className={cycle.variance > 0 ? "text-amber-600" : "text-green-600"}>
                  {cycle.variance > 0 ? ` (+${cycle.variance})` : ` (${cycle.variance})`}
                </span>
              )}
            </span>
          </div>
          <div className="w-6 text-xs">
            {cycle.confidence === "HIGH" && "H"}
            {cycle.confidence === "MEDIUM" && "C"}
            {cycle.confidence === "LOW" && "E"}
          </div>
        </div>
      ))}

      {/* Species average reference line */}
      <div className="flex items-center gap-3 pt-2 border-t border-hairline mt-3">
        <div className="w-20 text-xs text-secondary text-right">Breed Avg</div>
        <div className="flex-1 relative h-5">
          <div className="absolute inset-0 bg-surface-strong rounded opacity-50" />
          <div
            className="absolute top-0 left-0 h-full bg-gray-300 rounded"
            style={{ width: `${getBarWidth(speciesDefault)}%` }}
          />
          <span className="absolute top-0 right-2 text-xs leading-5 text-secondary">
            {speciesDefault} days
          </span>
        </div>
        <div className="w-6" />
      </div>

      {/* Scale */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-20" />
        <div className="flex-1 flex justify-between text-[10px] text-secondary px-1">
          <span>Day {chartMin}</span>
          <span>Day {Math.round((chartMin + chartMax) / 2)}</span>
          <span>Day {chartMax}</span>
        </div>
        <div className="w-6" />
      </div>
    </div>
  );
}

export function OvulationPatternAnalysis({
  analysis,
  onLearnMore,
}: OvulationPatternAnalysisProps) {
  const { ovulationPattern, cycleHistory, species } = analysis;
  const speciesDefault = SPECIES_DEFAULTS[species] ?? 12;

  // Filter to only cycles with ovulation data
  const cyclesWithOvulation = cycleHistory.filter(c => c.offsetDays !== null);

  // Insufficient data state
  if (cyclesWithOvulation.length < 2 || ovulationPattern.classification === "Insufficient Data") {
    return (
      <SectionCard title="Ovulation Pattern Analysis">
        <div className="text-center py-6">
          <div className="text-lg mb-2 text-secondary">Building Your Pattern</div>
          <p className="text-sm text-secondary max-w-md mx-auto mb-4">
            Record at least 2 breeding cycles with confirmed ovulation
            (via progesterone testing) to unlock pattern insights.
          </p>
          {onLearnMore && (
            <Button variant="soft" size="sm" onClick={onLearnMore}>
              Learn About Ovulation Tracking
            </Button>
          )}
        </div>
      </SectionCard>
    );
  }

  const avgOffset = ovulationPattern.avgOffsetDays;
  const stdDev = ovulationPattern.stdDeviation;
  const varianceFromDefault = avgOffset !== null ? avgOffset - speciesDefault : null;

  return (
    <SectionCard title="Ovulation Pattern Analysis">
      {/* Pattern Chart */}
      <div className="mb-4">
        <OvulationBarChart
          cycles={cycleHistory}
          avgOffset={avgOffset}
          speciesDefault={speciesDefault}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-secondary mb-4">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          H = Hormone-tested
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          C = Calculated from birth
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
          E = Estimated
        </div>
      </div>

      {/* Pattern Summary */}
      <div className="rounded-lg p-4 bg-surface-strong border border-hairline">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium text-primary">
            {stdDev !== null && stdDev <= 1.5 ? "Consistent" : "Variable"} Pattern Detected
          </span>
          <ConfidenceBadge confidence={ovulationPattern.confidence} showIcon={false} />
        </div>

        <ul className="space-y-1 text-sm text-primary">
          {avgOffset !== null && (
            <li>
              This female ovulates on Day {Math.round(avgOffset)}
              {stdDev !== null && stdDev > 0 && ` (+/-${Math.round(stdDev)} day${Math.round(stdDev) !== 1 ? "s" : ""})`}
            </li>
          )}
          {varianceFromDefault !== null && Math.abs(varianceFromDefault) >= 1 && (
            <li>
              {Math.abs(Math.round(varianceFromDefault))} day{Math.abs(Math.round(varianceFromDefault)) !== 1 ? "s" : ""}
              {varianceFromDefault > 0 ? " later" : " earlier"} than breed average (Day {speciesDefault})
            </li>
          )}
          <li>
            Classified as: <strong>{ovulationPattern.classification}</strong>
          </li>
        </ul>

        {ovulationPattern.guidance && (
          <div className="mt-4 p-3 bg-surface rounded border border-hairline">
            <div className="text-sm font-medium mb-1 text-primary">
              Recommendation
            </div>
            <p className="text-sm text-secondary">{ovulationPattern.guidance}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
