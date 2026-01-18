// Types for Cycle Analysis components

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
export type DataSource = "HORMONE_TEST" | "BIRTH_CALCULATED" | "ESTIMATED";
export type OvulationClassification = "Early Ovulator" | "Average" | "Late Ovulator" | "Insufficient Data";

export type CycleHistoryEntry = {
  id: number;
  cycleStart: string;
  ovulation: string | null;
  ovulationMethod: string | null;
  offsetDays: number | null;
  variance: number | null;
  confidence: ConfidenceLevel;
  source: DataSource;
  breedingPlanId: number | null;
  birthDate: string | null;
  notes: string | null;
};

export type OvulationPattern = {
  sampleSize: number;
  confirmedCycles: number;
  avgOffsetDays: number | null;
  stdDeviation: number | null;
  minOffset: number | null;
  maxOffset: number | null;
  classification: OvulationClassification;
  confidence: ConfidenceLevel;
  guidance: string;
};

export type NextCycleProjection = {
  projectedHeatStart: string | null;
  projectedOvulationWindow: {
    earliest: string;
    latest: string;
    mostLikely: string;
  } | null;
  recommendedTestingStart: string | null;
  confidence: ConfidenceLevel;
} | null;

export type CycleAnalysisResult = {
  animalId: number;
  species: string;
  cycleHistory: CycleHistoryEntry[];
  ovulationPattern: OvulationPattern;
  nextCycleProjection: NextCycleProjection;
  cycleLengthDays: number;
  cycleLengthSource: "OVERRIDE" | "HISTORY" | "BIOLOGY";
};
