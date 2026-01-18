import * as React from "react";
import { utils } from "@bhq/ui";

const { getSpeciesDefaults } = utils.reproEngine;

type CycleLengthClassification = "Short Cycler" | "Average" | "Long Cycler";

type CycleLengthInsightProps = {
  cycleLengthDays: number;
  cycleLengthSource: "OVERRIDE" | "HISTORY" | "BIOLOGY";
  species: string;
};

function getClassification(
  cycleLengthDays: number,
  speciesDefault: number,
  species: string
): { classification: CycleLengthClassification; variance: number; guidance: string } {
  const variance = cycleLengthDays - speciesDefault;
  const variancePercent = Math.abs(variance) / speciesDefault;

  // Threshold for "significant" variance depends on species
  // Dogs have 180-day cycles, so ±14 days (2 weeks) is notable
  // Horses/cattle have 21-day cycles, so ±3 days is notable
  const isLongCycle = species === "DOG" || species === "CAT";
  const threshold = isLongCycle ? 14 : 3;

  let classification: CycleLengthClassification;
  let guidance: string;

  // Threshold for showing advice (higher than display threshold)
  const adviceThreshold = isLongCycle ? 14 : 5;

  if (variance <= -threshold) {
    classification = "Short Cycler";
    // Only show advice for significant variances
    guidance = Math.abs(variance) >= adviceThreshold
      ? (isLongCycle
          ? "Expect more frequent breeding opportunities."
          : "Monitor closely as heat periods will be more frequent.")
      : "";
  } else if (variance >= threshold) {
    classification = "Long Cycler";
    // Only show advice for significant variances
    guidance = variance >= adviceThreshold
      ? (isLongCycle
          ? "Be patient between cycles and don't assume she's not cycling."
          : "Plan accordingly and don't rush.")
      : "";
  } else {
    classification = "Average";
    guidance = "";
  }

  return { classification, variance, guidance };
}

export function CycleLengthInsight({
  cycleLengthDays,
  cycleLengthSource,
  species,
}: CycleLengthInsightProps) {
  const speciesDefault = getSpeciesDefaults(species?.toUpperCase() ?? "DOG").cycleLenDays;

  // Only show insights when we have actual history data, not just biology defaults
  if (cycleLengthSource === "BIOLOGY") {
    return null;
  }

  const { classification, variance, guidance } = getClassification(
    cycleLengthDays,
    speciesDefault,
    species?.toUpperCase() ?? "DOG"
  );

  // Don't show anything for "Average" - only notable patterns
  if (classification === "Average") {
    return null;
  }

  const isShort = classification === "Short Cycler";
  // Purple for short cyclers, amber for long cyclers
  const accentColor = isShort ? "#8b5cf6" : "#f59e0b";
  const accentBg = isShort ? "rgba(139, 92, 246, 0.15)" : "rgba(245, 158, 11, 0.15)";
  const accentBorder = isShort ? "rgba(139, 92, 246, 0.3)" : "rgba(245, 158, 11, 0.3)";

  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        backgroundColor: "#1a1a1a",
        border: `1px solid ${accentBorder}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accentBg }}
        >
          <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: accentBg, color: accentColor }}
            >
              {classification}
            </span>
            {cycleLengthSource === "OVERRIDE" && (
              <span
                className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.5)" }}
              >
                Manual
              </span>
            )}
          </div>

          <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
            This female's cycle is{" "}
            <strong style={{ color: accentColor }}>
              {Math.abs(variance)} day{Math.abs(variance) !== 1 ? "s" : ""} {variance < 0 ? "shorter" : "longer"}
            </strong>{" "}
            than the species average of {speciesDefault} days. {guidance}
          </p>
        </div>
      </div>
    </div>
  );
}
