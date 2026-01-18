import * as React from "react";
import { Tooltip } from "@bhq/ui";
import type { CycleHistoryEntry, ConfidenceLevel, DataSource } from "./types";

type OvulationDotPlotProps = {
  cycles: CycleHistoryEntry[];
  avgOffset: number | null;
  speciesDefault: number;
  species: string;
  showAllOption?: boolean;
};

/**
 * Parse an ISO date string (YYYY-MM-DD) as a local date to avoid timezone issues.
 */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatMonth(iso: string): string {
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// Confidence determines fill opacity/style
const CONFIDENCE_STYLES: Record<ConfidenceLevel, { opacity: string; label: string }> = {
  HIGH: { opacity: "opacity-100", label: "High" },
  MEDIUM: { opacity: "opacity-70", label: "Medium" },
  LOW: { opacity: "opacity-40", label: "Low" },
};

// Data source determines border color
const SOURCE_STYLES: Record<DataSource, { border: string; label: string }> = {
  HORMONE_TEST: { border: "ring-emerald-500", label: "Tested" },
  BIRTH_CALCULATED: { border: "ring-blue-500", label: "From birth" },
  ESTIMATED: { border: "ring-zinc-400", label: "Estimated" },
};

export function OvulationDotPlot({
  cycles,
  avgOffset,
  speciesDefault,
  species,
  showAllOption = false,
}: OvulationDotPlotProps) {
  const [showAll, setShowAll] = React.useState(false);

  // Filter to only cycles with offset data
  const cyclesWithOffset = cycles.filter(c => c.offsetDays !== null);

  if (cyclesWithOffset.length === 0) {
    return (
      <div className="py-8 text-center text-secondary text-sm">
        No ovulation data recorded yet
      </div>
    );
  }

  // Calculate chart bounds
  const allOffsets = cyclesWithOffset.map(c => c.offsetDays!);
  const minOffset = Math.min(...allOffsets, speciesDefault - 2, (avgOffset ?? speciesDefault) - 2);
  const maxOffset = Math.max(...allOffsets, speciesDefault + 2, (avgOffset ?? speciesDefault) + 2);

  // Add padding
  const chartMin = Math.max(0, Math.floor(minOffset) - 1);
  const chartMax = Math.ceil(maxOffset) + 1;
  const range = chartMax - chartMin;

  const getPosition = (offset: number) => {
    return ((offset - chartMin) / range) * 100;
  };

  // Generate day markers
  const dayMarkers: number[] = [];
  for (let d = chartMin; d <= chartMax; d += 2) {
    dayMarkers.push(d);
  }

  // Determine visible cycles
  const maxVisible = 6;
  const hasMore = cyclesWithOffset.length > maxVisible;
  const visibleCycles = showAll ? cyclesWithOffset : cyclesWithOffset.slice(0, maxVisible);

  return (
    <div className="space-y-4">
      {/* Chart Container */}
      <div className="relative">
        {/* Y-axis labels and dots */}
        <div className="space-y-3">
          {visibleCycles.map((cycle, idx) => {
            const confStyle = CONFIDENCE_STYLES[cycle.confidence];
            const srcStyle = SOURCE_STYLES[cycle.source];
            const position = getPosition(cycle.offsetDays!);

            return (
              <div key={cycle.id} className="flex items-center gap-3">
                {/* Date label */}
                <div className="w-16 text-xs text-secondary text-right flex-shrink-0">
                  {formatMonth(cycle.cycleStart)}
                </div>

                {/* Dot track */}
                <div className="flex-1 relative h-6">
                  {/* Track background */}
                  <div className="absolute inset-y-2 left-0 right-0 bg-surface-strong rounded-full" />

                  {/* Breed average reference line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-zinc-600 z-10"
                    style={{ left: `${getPosition(speciesDefault)}%` }}
                  />

                  {/* Individual average line (if we have enough data) */}
                  {avgOffset !== null && cyclesWithOffset.length >= 2 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-emerald-500/50 z-10"
                      style={{ left: `${getPosition(avgOffset)}%` }}
                    />
                  )}

                  {/* Dot */}
                  <Tooltip
                    content={
                      <div className="text-xs">
                        <div className="font-medium">{formatMonth(cycle.cycleStart)}</div>
                        <div>Day {cycle.offsetDays} ovulation</div>
                        <div className="text-secondary">{srcStyle.label} • {confStyle.label} confidence</div>
                        {cycle.variance !== null && cycle.variance !== 0 && (
                          <div className={cycle.variance > 0 ? "text-amber-400" : "text-emerald-400"}>
                            {cycle.variance > 0 ? "+" : ""}{cycle.variance} from avg
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white ${confStyle.opacity} ring-2 ${srcStyle.border} cursor-pointer transition-all hover:scale-125 hover:ring-4 focus:scale-125 focus:ring-4 focus:outline-none z-20`}
                      style={{ left: `calc(${position}% - 8px)` }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${formatMonth(cycle.cycleStart)}: Day ${cycle.offsetDays} ovulation, ${srcStyle.label}, ${confStyle.label} confidence${cycle.variance !== null && cycle.variance !== 0 ? `, ${cycle.variance > 0 ? "+" : ""}${cycle.variance} from average` : ""}`}
                    />
                  </Tooltip>

                  {/* Day label on right */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-secondary pl-2">
                    Day {cycle.offsetDays}
                    {cycle.variance !== null && cycle.variance !== 0 && (
                      <span className={`ml-1 ${cycle.variance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                        ({cycle.variance > 0 ? "+" : ""}{cycle.variance})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis scale */}
        <div className="flex items-center gap-3 mt-4 pt-2 border-t border-hairline">
          <div className="w-16 flex-shrink-0" />
          <div className="flex-1 relative h-6">
            {dayMarkers.map(day => (
              <div
                key={day}
                className="absolute text-[10px] text-secondary -translate-x-1/2"
                style={{ left: `${getPosition(day)}%` }}
              >
                {day}
              </div>
            ))}

            {/* Breed average label */}
            <Tooltip content={`Breed average: Day ${speciesDefault}`}>
              <div
                className="absolute -top-1 text-[10px] text-zinc-400 -translate-x-1/2 cursor-help"
                style={{ left: `${getPosition(speciesDefault)}%` }}
              >
                <div className="w-px h-2 bg-zinc-600 mx-auto mb-0.5" />
                Avg
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Legend - Data Source (border color) */}
      <div className="space-y-2 pt-2">
        <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
          <span className="font-medium text-primary/70">Source:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white ring-2 ring-emerald-500" />
            <span>Tested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white ring-2 ring-blue-500" />
            <span>From birth</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white ring-2 ring-zinc-400" />
            <span>Estimated</span>
          </div>
        </div>
        {/* Legend - Confidence (fill opacity) */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
          <span className="font-medium text-primary/70">Confidence:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white opacity-100 ring-2 ring-zinc-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white opacity-70 ring-2 ring-zinc-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white opacity-40 ring-2 ring-zinc-500" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-4 h-px bg-zinc-600" />
            <span>Breed average (Day {speciesDefault})</span>
          </div>
        </div>
      </div>

      {/* Show all toggle */}
      {showAllOption && hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>
            {showAll
              ? "Show fewer"
              : `Show all ${cyclesWithOffset.length} cycles`}
          </span>
        </button>
      )}
    </div>
  );
}
