// apps/breeding/src/hooks/useDamCycleAnalysis.ts
// Hook to fetch cycle analysis data for a selected dam (female animal)
// Used to surface learned ovulation patterns when creating/editing breeding plans

import { useState, useEffect, useCallback } from "react";
import type { CycleAnalysisResult } from "../api";

export type UseDamCycleAnalysisParams = {
  /** The dam (female animal) ID to fetch cycle analysis for */
  damId: number | null | undefined;
  /** The API instance with animals.getCycleAnalysis method */
  api: {
    animals: {
      getCycleAnalysis: (animalId: number) => Promise<CycleAnalysisResult>;
    };
  } | null;
  /** Whether the species supports ovulation upgrade (DOG, HORSE) */
  supportsOvulationUpgrade?: boolean;
  /** Skip fetching (e.g., when not in edit mode) */
  skip?: boolean;
};

export type UseDamCycleAnalysisResult = {
  /** The cycle analysis data */
  data: CycleAnalysisResult | null;
  /** Loading state */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh the data */
  refresh: () => void;
  /** Whether the dam has a learned ovulation pattern */
  hasPattern: boolean;
  /** Simplified pattern data for display */
  pattern: {
    avgOffsetDays: number | null;
    stdDeviation: number | null;
    classification: string;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    sampleSize: number;
    guidance: string;
  } | null;
};

/**
 * Hook to fetch and manage cycle analysis data for a dam.
 *
 * Use this hook when creating or editing a breeding plan to surface
 * the dam's learned ovulation pattern. This allows breeders to use
 * historical data to improve timeline predictions.
 *
 * @example
 * ```tsx
 * const { data, pattern, hasPattern, loading } = useDamCycleAnalysis({
 *   damId: selectedDamId,
 *   api,
 *   supportsOvulationUpgrade: species === "DOG" || species === "HORSE",
 * });
 *
 * {hasPattern && pattern && (
 *   <OvulationInsightCard
 *     classification={pattern.classification}
 *     avgOffsetDays={pattern.avgOffsetDays}
 *     stdDeviation={pattern.stdDeviation}
 *     confidence={pattern.confidence}
 *     onUsePattern={() => applyPattern(pattern.avgOffsetDays)}
 *   />
 * )}
 * ```
 */
export function useDamCycleAnalysis({
  damId,
  api,
  supportsOvulationUpgrade = false,
  skip = false,
}: UseDamCycleAnalysisParams): UseDamCycleAnalysisResult {
  const [data, setData] = useState<CycleAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Skip if no dam selected, no API, species doesn't support upgrade, or explicitly skipped
    if (!damId || !api || !supportsOvulationUpgrade || skip) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.animals.getCycleAnalysis(damId);
      setData(result);
    } catch (err: any) {
      // Don't show error for 404 (animal has no cycle data) - this is expected
      if (err?.status === 404) {
        setData(null);
      } else {
        setError(err?.message || "Failed to load cycle analysis");
      }
    } finally {
      setLoading(false);
    }
  }, [damId, api, supportsOvulationUpgrade, skip]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive simplified pattern data
  const pattern = data?.ovulationPattern
    ? {
        avgOffsetDays: data.ovulationPattern.avgOffsetDays,
        stdDeviation: data.ovulationPattern.stdDeviation,
        classification: data.ovulationPattern.classification,
        confidence: data.ovulationPattern.confidence,
        sampleSize: data.ovulationPattern.sampleSize,
        guidance: data.ovulationPattern.guidance,
      }
    : null;

  // Check if there's a meaningful pattern (not "Insufficient Data")
  const hasPattern =
    pattern !== null &&
    pattern.classification !== "Insufficient Data" &&
    pattern.avgOffsetDays !== null;

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    hasPattern,
    pattern,
  };
}

export default useDamCycleAnalysis;
