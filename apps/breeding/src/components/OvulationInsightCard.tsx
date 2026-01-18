// apps/breeding/src/components/OvulationInsightCard.tsx
// Displays learned ovulation pattern when dam is selected in breeding plan creation/edit
// Shows pattern classification, timing data, and allows breeder to use it for predictions

import * as React from "react";

export type OvulationInsightCardProps = {
  /** The classification of the ovulation pattern */
  classification: "Early Ovulator" | "Average" | "Late Ovulator" | "Insufficient Data" | string;
  /** Average offset days from cycle start to ovulation */
  avgOffsetDays: number | null;
  /** Standard deviation of the offset (±X days) */
  stdDeviation: number | null;
  /** Confidence level of the pattern */
  confidence: "HIGH" | "MEDIUM" | "LOW";
  /** Number of cycles analyzed */
  sampleSize: number;
  /** Guidance text explaining the pattern */
  guidance?: string;
  /** Dam name for personalized messaging */
  damName?: string;
  /** Callback when user clicks "Use this pattern" */
  onUsePattern?: () => void;
  /** Whether the "Use this pattern" button should be disabled */
  usePatternDisabled?: boolean;
  /** Additional class names */
  className?: string;
};

// Badge colors for classification
const CLASSIFICATION_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  "Early Ovulator": {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    icon: "arrows-pointing-in", // Fast/early
  },
  Average: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    icon: "check-circle", // Normal/good
  },
  "Late Ovulator": {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    icon: "clock", // Slower/later
  },
  "Insufficient Data": {
    bg: "bg-zinc-500/20",
    text: "text-zinc-400",
    icon: "question-mark-circle",
  },
};

// Confidence badge styles
const CONFIDENCE_STYLES: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  MEDIUM: { bg: "bg-amber-500/20", text: "text-amber-400" },
  LOW: { bg: "bg-zinc-500/20", text: "text-zinc-400" },
};

/**
 * OvulationInsightCard displays a dam's learned ovulation pattern.
 *
 * This component is shown when:
 * 1. A dam is selected in the breeding plan form
 * 2. The species supports ovulation upgrade (DOG, HORSE)
 * 3. The dam has a learned pattern (not "Insufficient Data")
 *
 * It helps breeders understand their dam's typical ovulation timing
 * and optionally use it to improve breeding timeline predictions.
 */
export function OvulationInsightCard({
  classification,
  avgOffsetDays,
  stdDeviation,
  confidence,
  sampleSize,
  guidance,
  damName,
  onUsePattern,
  usePatternDisabled = false,
  className = "",
}: OvulationInsightCardProps) {
  const classStyles = CLASSIFICATION_STYLES[classification] || CLASSIFICATION_STYLES["Insufficient Data"];
  const confStyles = CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.LOW;

  // Format the offset for display (e.g., "Day 12 (±2 days)")
  const offsetDisplay = avgOffsetDays !== null
    ? `Day ${avgOffsetDays}${stdDeviation ? ` (±${stdDeviation.toFixed(1)} days)` : ""}`
    : "Unknown";

  // Generate a personalized title
  const title = damName
    ? `${damName}'s Ovulation Pattern`
    : "Learned Ovulation Pattern";

  return (
    <div
      className={`rounded-lg border border-hairline bg-surface/50 p-4 ${className}`}
    >
      {/* Header with title and classification badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-medium text-primary">{title}</h4>
          <p className="text-xs text-secondary mt-0.5">
            Based on {sampleSize} {sampleSize === 1 ? "cycle" : "cycles"}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${classStyles.bg} ${classStyles.text}`}
        >
          {classification}
        </span>
      </div>

      {/* Pattern details */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-secondary mb-1">Typical Ovulation</div>
          <div className="text-sm font-medium text-primary">{offsetDisplay}</div>
        </div>
        <div>
          <div className="text-xs text-secondary mb-1">Confidence</div>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${confStyles.bg} ${confStyles.text}`}
          >
            {confidence}
          </span>
        </div>
      </div>

      {/* Guidance text */}
      {guidance && (
        <p className="text-xs text-secondary mb-3 leading-relaxed">
          {guidance}
        </p>
      )}

      {/* Info box explaining the benefit */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-2 mb-3">
        <p className="text-xs text-blue-300">
          <strong>Why this matters:</strong> Using this pattern can improve breeding timeline
          predictions from ±3-5 days to ±1-2 days, helping you schedule testing and breeding
          more accurately.
        </p>
      </div>

      {/* Action button */}
      {onUsePattern && (
        <button
          type="button"
          onClick={onUsePattern}
          disabled={usePatternDisabled}
          className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            usePatternDisabled
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Use This Pattern for Predictions
        </button>
      )}
    </div>
  );
}

export default OvulationInsightCard;
