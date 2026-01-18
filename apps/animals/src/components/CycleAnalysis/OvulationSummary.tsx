import { Tooltip } from "@bhq/ui";
import type { OvulationPattern } from "./types";

type OvulationSummaryProps = {
  ovulationPattern: OvulationPattern;
  speciesDefault: number;
  species: string;
};

// How many days from breed average before we show "early" or "late"
const CLASSIFICATION_THRESHOLD = 1;

export function OvulationSummary({
  ovulationPattern,
  speciesDefault,
  species,
}: OvulationSummaryProps) {
  const { avgOffsetDays, stdDeviation, classification, guidance } = ovulationPattern;

  // Not enough data
  if (classification === "Insufficient Data" || avgOffsetDays === null) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(60, 60, 60, 0.5)" }}>
        <div className="text-center py-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: "rgba(113, 113, 122, 0.15)" }}
          >
            <svg className="w-6 h-6" style={{ color: "#71717a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-base font-medium text-primary mb-1">Building Pattern</div>
          <p className="text-sm text-secondary max-w-xs mx-auto">
            Record at least 2 cycles with confirmed ovulation to see pattern insights.
          </p>
        </div>
      </div>
    );
  }

  const variance = avgOffsetDays - speciesDefault;
  const isEarly = variance < -CLASSIFICATION_THRESHOLD;
  const isLate = variance > CLASSIFICATION_THRESHOLD;
  const isAverage = !isEarly && !isLate;

  // Consistency assessment
  const isConsistent = stdDeviation !== null && stdDeviation <= 1;
  const isModerate = stdDeviation !== null && stdDeviation > 1 && stdDeviation <= 2;
  // stdDeviation > 2 would be variable

  // Spectrum positioning: map avgOffsetDays to a 0-100 scale
  // We'll show a range from (speciesDefault - 4) to (speciesDefault + 4)
  const spectrumMin = speciesDefault - 4;
  const spectrumMax = speciesDefault + 4;
  const spectrumRange = spectrumMax - spectrumMin;
  const markerPosition = Math.max(0, Math.min(100, ((avgOffsetDays - spectrumMin) / spectrumRange) * 100));
  const avgMarkerPosition = ((speciesDefault - spectrumMin) / spectrumRange) * 100;

  // Color based on classification
  const classificationColor = isEarly ? "#3b82f6" : isLate ? "#f59e0b" : "#22c55e";
  const classificationBg = isEarly ? "rgba(59, 130, 246, 0.15)" : isLate ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)";

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(60, 60, 60, 0.5)" }}>
      {/* Header: Classification */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: classificationBg }}
        >
          {isEarly ? (
            <svg className="w-5 h-5" style={{ color: classificationColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : isLate ? (
            <svg className="w-5 h-5" style={{ color: classificationColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" style={{ color: classificationColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          <div className="text-lg font-semibold" style={{ color: classificationColor }}>
            {classification}
          </div>
          <div className="text-xs text-secondary">
            {isConsistent ? "Very consistent" : isModerate ? "Fairly consistent" : "Variable"} pattern
          </div>
        </div>
      </div>

      {/* Spectrum indicator */}
      <div className="mb-5">
        <div className="relative h-8 mb-2">
          {/* Track */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full"
            style={{
              background: "linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(34, 197, 94, 0.3) 50%, rgba(245, 158, 11, 0.3))"
            }}
          />

          {/* Breed average marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5"
            style={{ left: `${avgMarkerPosition}%`, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
          />

          {/* Current position marker */}
          <Tooltip
            content={
              <div className="text-xs">
                <div className="font-medium">Day {Math.round(avgOffsetDays)}</div>
                {stdDeviation !== null && stdDeviation > 0 && (
                  <div className="text-secondary">±{stdDeviation.toFixed(1)} day variance</div>
                )}
              </div>
            }
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110"
              style={{
                left: `${markerPosition}%`,
                backgroundColor: classificationColor,
                boxShadow: `0 0 0 3px ${classificationBg}, 0 2px 8px rgba(0,0,0,0.3)`
              }}
            />
          </Tooltip>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-[10px] text-secondary px-1">
          <span>Early</span>
          <span>Day {speciesDefault} (Breed Avg)</span>
          <span>Late</span>
        </div>
      </div>

      {/* Key stats in a clean row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "rgba(60, 60, 60, 0.3)" }}>
          <div className="text-xl font-bold text-white">Day {Math.round(avgOffsetDays)}</div>
          <div className="text-[10px] uppercase tracking-wide text-secondary">Typical Ovulation</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "rgba(60, 60, 60, 0.3)" }}>
          <div className="text-xl font-bold" style={{ color: variance === 0 ? "#22c55e" : variance > 0 ? "#f59e0b" : "#3b82f6" }}>
            {variance === 0 ? "Avg" : variance > 0 ? `+${Math.round(variance)}` : Math.round(variance)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-secondary">vs Breed Avg</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "rgba(60, 60, 60, 0.3)" }}>
          <div className="text-xl font-bold text-white">
            {stdDeviation !== null ? `±${stdDeviation.toFixed(1)}` : "-"}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-secondary">Variance</div>
        </div>
      </div>

      {/* Guidance - the actionable part */}
      {guidance && (
        <div
          className="rounded-lg p-4 flex items-start gap-3"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)" }}
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-blue-400 mb-1">Breeding Tip</div>
            <p className="text-sm text-secondary">{guidance}</p>
          </div>
        </div>
      )}
    </div>
  );
}
