// apps/breeding/src/components/OffspringSimulator.tsx
import * as React from "react";
import { Tooltip } from "@bhq/ui";

/**
 * Types for genetic result data passed from the parent genetics calculator.
 * These match the structure from calculateGeneticPairing in App-Breeding.tsx.
 */
export type LocusPrediction = {
  trait: string;           // e.g., "E Locus (Extension)"
  damGenotype: string;     // e.g., "E/e"
  sireGenotype: string;    // e.g., "E/E"
  prediction: string;      // e.g., "50% Black-based, 50% Black-based (carries red)"
  breedSpecific?: string;
  warning?: boolean;
};

export type HealthPrediction = {
  trait: string;
  damGenotype: string;
  sireGenotype: string;
  prediction: string;
  warning?: boolean;
  breedSpecific?: string;
};

export type GeneticWarning = {
  severity: "warning" | "danger";
  message: string;
};

export type GeneticsResults = {
  coatColor: LocusPrediction[];
  coatType: LocusPrediction[];
  physicalTraits: LocusPrediction[];
  eyeColor: LocusPrediction[];
  health: HealthPrediction[];
  warnings: GeneticWarning[];
  score: number;
  colorSummary: string;
};

/**
 * Parsed outcome from a prediction string (e.g., "50% Black-based")
 */
type PredictionOutcome = {
  percentage: number;
  phenotype: string;
  genotype?: string;
};

/**
 * A single simulated locus result
 */
type SimulatedLocus = {
  locus: string;
  locusName: string;
  genotype: string;
  phenotype: string;
  isCarrier?: boolean;
  isAffected?: boolean;
};

/**
 * A complete simulated offspring
 */
type SimulatedOffspring = {
  id: string;
  coatColor: SimulatedLocus[];
  coatType: SimulatedLocus[];
  physicalTraits: SimulatedLocus[];
  eyeColor: SimulatedLocus[];
  health: SimulatedLocus[];
  phenotypeSummary: string;
  warnings: string[];
  healthStatus: "clear" | "carrier" | "affected";
};

/**
 * Litter statistics
 */
type LitterStats = {
  totalOffspring: number;
  coatColorBreakdown: Map<string, number>;
  healthCarriers: number;
  healthAffected: number;
  healthClear: number;
  warningCount: number;
};

type OffspringSimulatorProps = {
  results: GeneticsResults;
  species: string;
  damName?: string;
  sireName?: string;
  className?: string;
};

/**
 * Parse a prediction string like "50% Black-based, 25% Red-based" into structured outcomes.
 */
function parsePrediction(prediction: string): PredictionOutcome[] {
  const parts = prediction.split(", ").map((p) => p.trim());
  const outcomes: PredictionOutcome[] = [];

  for (const part of parts) {
    // Match patterns like "50% Black-based" or "25% Affected"
    const match = part.match(/^(\d+)%\s+(.+)$/);
    if (match) {
      outcomes.push({
        percentage: parseInt(match[1], 10),
        phenotype: match[2],
      });
    }
  }

  return outcomes;
}

/**
 * Extract locus code from trait string like "E Locus (Extension)" -> "E"
 */
function extractLocusCode(trait: string): string {
  const match = trait.match(/^([A-Za-z]+)\s+Locus/);
  return match ? match[1] : trait.split(" ")[0];
}

/**
 * Extract locus name from trait string like "E Locus (Extension)" -> "Extension"
 */
function extractLocusName(trait: string): string {
  const match = trait.match(/\(([^)]+)\)/);
  return match ? match[1] : trait;
}

/**
 * Select a random outcome based on weighted probabilities.
 */
function selectWeightedRandom(outcomes: PredictionOutcome[]): PredictionOutcome {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.percentage, 0);
  let random = Math.random() * totalWeight;

  for (const outcome of outcomes) {
    random -= outcome.percentage;
    if (random <= 0) {
      return outcome;
    }
  }

  // Fallback to last outcome (should not normally happen)
  return outcomes[outcomes.length - 1];
}

/**
 * Try to extract genotype from phenotype description.
 * E.g., "Black-based (carries red)" might indicate E/e genotype.
 */
function inferGenotype(phenotype: string, locusCode: string): string {
  // Check for common patterns
  const hasCarrier = phenotype.toLowerCase().includes("carries");
  const isAffected = phenotype.toLowerCase().includes("affected");
  const isClear = phenotype.toLowerCase().includes("clear");

  // For simple mendelian traits
  if (isAffected) return `${locusCode.toLowerCase()}/${locusCode.toLowerCase()}`;
  if (hasCarrier) return `${locusCode}/${locusCode.toLowerCase()}`;
  if (isClear) return `${locusCode}/${locusCode}`;

  // Default display
  return phenotype.includes("/") ? phenotype.split(" ")[0] : `${locusCode}/?`;
}

/**
 * Check if a simulated locus represents a dangerous genotype.
 */
const DANGEROUS_GENOTYPES: Record<string, { genotype: string; warning: string }[]> = {
  M: [{ genotype: "M/M", warning: "DOUBLE MERLE: Risk of deafness/blindness" }],
  Fd: [{ genotype: "Fd/Fd", warning: "DOUBLE FOLD: Severe osteochondrodysplasia" }],
  O: [{ genotype: "O/O", warning: "LETHAL WHITE OVERO: Fatal condition" }],
  LP: [{ genotype: "LP/LP", warning: "Double LP: Vision issues (CSNB)" }],
  En: [{ genotype: "En/En", warning: "CHARLIE: May have digestive issues" }],
  P: [{ genotype: "P/P", warning: "POLLED x POLLED: Risk of intersex" }],
};

function checkForWarnings(offspring: SimulatedOffspring): string[] {
  const warnings: string[] = [];

  const allLoci = [
    ...offspring.coatColor,
    ...offspring.coatType,
    ...offspring.physicalTraits,
    ...offspring.eyeColor,
    ...offspring.health,
  ];

  for (const locus of allLoci) {
    const dangerousOptions = DANGEROUS_GENOTYPES[locus.locus];
    if (dangerousOptions) {
      for (const danger of dangerousOptions) {
        // Check if phenotype suggests the dangerous genotype
        if (locus.phenotype.includes(danger.genotype.split("/")[0]) &&
            locus.phenotype.toLowerCase().includes("double")) {
          warnings.push(danger.warning);
        }
        // Also check for specific phenotype indicators
        if (locus.locus === "M" && locus.phenotype.includes("Double Merle")) {
          warnings.push(danger.warning);
        }
        if (locus.locus === "O" && locus.phenotype.includes("Lethal White")) {
          warnings.push(danger.warning);
        }
      }
    }
  }

  // Check health status
  for (const health of offspring.health) {
    if (health.isAffected) {
      warnings.push(`${health.locusName}: Affected`);
    }
  }

  return [...new Set(warnings)]; // Remove duplicates
}

/**
 * Simulate a single offspring based on genetic predictions.
 */
function simulateOffspring(results: GeneticsResults): SimulatedOffspring {
  const id = `offspring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const offspring: SimulatedOffspring = {
    id,
    coatColor: [],
    coatType: [],
    physicalTraits: [],
    eyeColor: [],
    health: [],
    phenotypeSummary: "",
    warnings: [],
    healthStatus: "clear",
  };

  // Simulate coat color loci
  for (const locus of results.coatColor) {
    const outcomes = parsePrediction(locus.prediction);
    if (outcomes.length > 0) {
      const selected = selectWeightedRandom(outcomes);
      const locusCode = extractLocusCode(locus.trait);
      offspring.coatColor.push({
        locus: locusCode,
        locusName: extractLocusName(locus.trait),
        genotype: inferGenotype(selected.phenotype, locusCode),
        phenotype: selected.phenotype,
        isCarrier: selected.phenotype.toLowerCase().includes("carries"),
      });
    }
  }

  // Simulate coat type loci
  for (const locus of results.coatType) {
    const outcomes = parsePrediction(locus.prediction);
    if (outcomes.length > 0) {
      const selected = selectWeightedRandom(outcomes);
      const locusCode = extractLocusCode(locus.trait);
      offspring.coatType.push({
        locus: locusCode,
        locusName: extractLocusName(locus.trait),
        genotype: inferGenotype(selected.phenotype, locusCode),
        phenotype: selected.phenotype,
        isCarrier: selected.phenotype.toLowerCase().includes("carries"),
      });
    }
  }

  // Simulate physical traits
  for (const locus of results.physicalTraits) {
    const outcomes = parsePrediction(locus.prediction);
    if (outcomes.length > 0) {
      const selected = selectWeightedRandom(outcomes);
      const locusCode = extractLocusCode(locus.trait);
      offspring.physicalTraits.push({
        locus: locusCode,
        locusName: extractLocusName(locus.trait),
        genotype: inferGenotype(selected.phenotype, locusCode),
        phenotype: selected.phenotype,
        isCarrier: selected.phenotype.toLowerCase().includes("carries"),
      });
    }
  }

  // Simulate eye color
  for (const locus of results.eyeColor) {
    const outcomes = parsePrediction(locus.prediction);
    if (outcomes.length > 0) {
      const selected = selectWeightedRandom(outcomes);
      const locusCode = extractLocusCode(locus.trait);
      offspring.eyeColor.push({
        locus: locusCode,
        locusName: extractLocusName(locus.trait),
        genotype: inferGenotype(selected.phenotype, locusCode),
        phenotype: selected.phenotype,
      });
    }
  }

  // Simulate health markers
  let hasCarrier = false;
  let hasAffected = false;

  for (const health of results.health) {
    const outcomes = parsePrediction(health.prediction);
    if (outcomes.length > 0) {
      const selected = selectWeightedRandom(outcomes);
      const locusCode = extractLocusCode(health.trait);
      const isAffected = selected.phenotype.toLowerCase().includes("affected");
      const isCarrier = selected.phenotype.toLowerCase().includes("carrier");

      offspring.health.push({
        locus: locusCode,
        locusName: extractLocusName(health.trait),
        genotype: inferGenotype(selected.phenotype, locusCode),
        phenotype: selected.phenotype,
        isCarrier,
        isAffected,
      });

      if (isAffected) hasAffected = true;
      if (isCarrier) hasCarrier = true;
    }
  }

  // Determine overall health status
  if (hasAffected) {
    offspring.healthStatus = "affected";
  } else if (hasCarrier) {
    offspring.healthStatus = "carrier";
  } else {
    offspring.healthStatus = "clear";
  }

  // Generate phenotype summary
  const colorParts: string[] = [];
  const coatTypeParts: string[] = [];
  const physicalParts: string[] = [];

  for (const locus of offspring.coatColor) {
    // Extract main phenotype (before any "carries" note)
    const mainPhenotype = locus.phenotype.split(" (")[0];
    if (mainPhenotype && !colorParts.includes(mainPhenotype)) {
      colorParts.push(mainPhenotype);
    }
  }

  for (const locus of offspring.coatType) {
    const mainPhenotype = locus.phenotype.split(" (")[0];
    if (mainPhenotype && !coatTypeParts.includes(mainPhenotype)) {
      coatTypeParts.push(mainPhenotype);
    }
  }

  for (const locus of offspring.physicalTraits) {
    const mainPhenotype = locus.phenotype.split(" (")[0];
    if (mainPhenotype && !physicalParts.includes(mainPhenotype)) {
      physicalParts.push(mainPhenotype);
    }
  }

  // Build summary
  const summaryParts: string[] = [];
  if (colorParts.length > 0) summaryParts.push(colorParts.slice(0, 3).join(", "));
  if (coatTypeParts.length > 0) summaryParts.push(coatTypeParts.join(", "));
  if (physicalParts.length > 0) summaryParts.push(physicalParts.join(", "));

  offspring.phenotypeSummary = summaryParts.join(" - ") || "Unable to predict phenotype";

  // Check for warnings
  offspring.warnings = checkForWarnings(offspring);

  return offspring;
}

/**
 * Calculate statistics for a litter of offspring.
 */
function calculateLitterStats(litter: SimulatedOffspring[]): LitterStats {
  const stats: LitterStats = {
    totalOffspring: litter.length,
    coatColorBreakdown: new Map(),
    healthCarriers: 0,
    healthAffected: 0,
    healthClear: 0,
    warningCount: 0,
  };

  for (const offspring of litter) {
    // Count coat color combinations
    const colorKey = offspring.coatColor.map((l) => l.phenotype.split(" (")[0]).join(" + ") || "Unknown";
    stats.coatColorBreakdown.set(colorKey, (stats.coatColorBreakdown.get(colorKey) || 0) + 1);

    // Count health statuses
    if (offspring.healthStatus === "affected") {
      stats.healthAffected++;
    } else if (offspring.healthStatus === "carrier") {
      stats.healthCarriers++;
    } else {
      stats.healthClear++;
    }

    // Count warnings
    if (offspring.warnings.length > 0) {
      stats.warningCount++;
    }
  }

  return stats;
}

/**
 * Single offspring card component
 */
function OffspringCard({
  offspring,
  index,
  onRemove,
}: {
  offspring: SimulatedOffspring;
  index: number;
  onRemove?: () => void;
}) {
  const healthStatusColors = {
    clear: "bg-green-500/10 text-green-600 border-green-500/20",
    carrier: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    affected: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const healthStatusLabels = {
    clear: "Clear",
    carrier: "Carrier",
    affected: "Affected",
  };

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 relative group transition-all hover:shadow-md hover:border-accent/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <div className="text-xs text-secondary uppercase tracking-wide">Simulated Offspring</div>
            <div className="font-medium text-sm">{offspring.phenotypeSummary}</div>
          </div>
        </div>
        {onRemove && (
          <Tooltip content="Remove from litter">
            <button
              onClick={onRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-red-500 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Health Status Badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${healthStatusColors[offspring.healthStatus]}`}>
          {offspring.healthStatus === "clear" && (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944z" clipRule="evenodd" />
            </svg>
          )}
          {offspring.healthStatus === "carrier" && (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {offspring.healthStatus === "affected" && (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          Health: {healthStatusLabels[offspring.healthStatus]}
        </span>
      </div>

      {/* Warnings */}
      {offspring.warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {offspring.warnings.map((warning, wIdx) => (
            <div key={wIdx} className="flex items-start gap-2 text-xs bg-red-500/10 text-red-600 p-2 rounded border border-red-500/20">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Genotype Grid */}
      <div className="space-y-2">
        {/* Coat Color */}
        {offspring.coatColor.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Coat Color</div>
            <div className="flex flex-wrap gap-1">
              {offspring.coatColor.map((locus, idx) => (
                <Tooltip key={idx} content={locus.phenotype}>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      locus.isCarrier ? "bg-yellow-500/10 text-yellow-700" : "bg-accent/10 text-accent"
                    }`}
                  >
                    <span className="font-mono font-medium mr-1">{locus.locus}:</span>
                    <span className="truncate max-w-[120px]">{locus.phenotype.split(" (")[0]}</span>
                    {locus.isCarrier && <span className="ml-1 text-[10px]">(c)</span>}
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Coat Type */}
        {offspring.coatType.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Coat Type</div>
            <div className="flex flex-wrap gap-1">
              {offspring.coatType.map((locus, idx) => (
                <Tooltip key={idx} content={locus.phenotype}>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      locus.isCarrier ? "bg-yellow-500/10 text-yellow-700" : "bg-blue-500/10 text-blue-600"
                    }`}
                  >
                    <span className="font-mono font-medium mr-1">{locus.locus}:</span>
                    <span className="truncate max-w-[120px]">{locus.phenotype.split(" (")[0]}</span>
                    {locus.isCarrier && <span className="ml-1 text-[10px]">(c)</span>}
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Physical Traits */}
        {offspring.physicalTraits.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Physical</div>
            <div className="flex flex-wrap gap-1">
              {offspring.physicalTraits.map((locus, idx) => (
                <Tooltip key={idx} content={locus.phenotype}>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-600"
                  >
                    <span className="font-mono font-medium mr-1">{locus.locus}:</span>
                    <span className="truncate max-w-[120px]">{locus.phenotype.split(" (")[0]}</span>
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Eye Color */}
        {offspring.eyeColor.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Eyes</div>
            <div className="flex flex-wrap gap-1">
              {offspring.eyeColor.map((locus, idx) => (
                <Tooltip key={idx} content={locus.phenotype}>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-600"
                  >
                    <span className="font-mono font-medium mr-1">{locus.locus}:</span>
                    <span className="truncate max-w-[120px]">{locus.phenotype.split(" (")[0]}</span>
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Health Markers */}
        {offspring.health.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Health</div>
            <div className="flex flex-wrap gap-1">
              {offspring.health.map((locus, idx) => (
                <Tooltip key={idx} content={locus.phenotype}>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      locus.isAffected
                        ? "bg-red-500/10 text-red-600"
                        : locus.isCarrier
                        ? "bg-yellow-500/10 text-yellow-700"
                        : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    <span className="font-mono font-medium mr-1">{locus.locus}:</span>
                    <span className="truncate max-w-[120px]">{locus.phenotype.split(" (")[0]}</span>
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Litter statistics summary component
 */
function LitterStatsPanel({ stats }: { stats: LitterStats }) {
  const colorBreakdownArray = Array.from(stats.coatColorBreakdown.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Litter Statistics
      </h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Total */}
        <div className="text-center p-2 rounded bg-accent/5 border border-accent/20">
          <div className="text-2xl font-bold text-accent">{stats.totalOffspring}</div>
          <div className="text-xs text-secondary">Total Offspring</div>
        </div>

        {/* Health Clear */}
        <div className="text-center p-2 rounded bg-green-500/5 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{stats.healthClear}</div>
          <div className="text-xs text-secondary">Health Clear</div>
        </div>

        {/* Health Carriers */}
        <div className="text-center p-2 rounded bg-yellow-500/5 border border-yellow-500/20">
          <div className="text-2xl font-bold text-yellow-600">{stats.healthCarriers}</div>
          <div className="text-xs text-secondary">Carriers</div>
        </div>

        {/* Warnings */}
        <div className="text-center p-2 rounded bg-red-500/5 border border-red-500/20">
          <div className="text-2xl font-bold text-red-600">{stats.warningCount}</div>
          <div className="text-xs text-secondary">With Warnings</div>
        </div>
      </div>

      {/* Color Breakdown */}
      {colorBreakdownArray.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Color Distribution</div>
          <div className="space-y-1">
            {colorBreakdownArray.slice(0, 5).map(([color, count], idx) => {
              const percentage = Math.round((count / stats.totalOffspring) * 100);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 bg-hairline rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <Tooltip content={color}>
                    <span className="text-xs text-secondary w-24 truncate">
                      {color}
                    </span>
                  </Tooltip>
                  <span className="text-xs font-medium w-12 text-right">
                    {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Offspring Simulator Component
 */
export default function OffspringSimulator({
  results,
  species,
  damName,
  sireName,
  className = "",
}: OffspringSimulatorProps) {
  const [litter, setLitter] = React.useState<SimulatedOffspring[]>([]);
  const [isRolling, setIsRolling] = React.useState(false);
  const [litterSize, setLitterSize] = React.useState(6);
  const [showLitterMode, setShowLitterMode] = React.useState(false);

  // Check if we have any genetic data to simulate
  const hasData =
    results.coatColor.length > 0 ||
    results.coatType.length > 0 ||
    results.physicalTraits.length > 0 ||
    results.eyeColor.length > 0 ||
    results.health.length > 0;

  const litterStats = React.useMemo(() => calculateLitterStats(litter), [litter]);

  const handleSimulateOne = React.useCallback(() => {
    setIsRolling(true);

    // Add a brief animation delay for the "rolling" effect
    setTimeout(() => {
      const newOffspring = simulateOffspring(results);
      setLitter((prev) => [...prev, newOffspring]);
      setIsRolling(false);
    }, 300);
  }, [results]);

  const handleSimulateLitter = React.useCallback(() => {
    setIsRolling(true);
    setLitter([]); // Clear existing litter

    // Simulate with staggered animation
    const newLitter: SimulatedOffspring[] = [];
    let count = 0;

    const addOne = () => {
      if (count < litterSize) {
        newLitter.push(simulateOffspring(results));
        setLitter([...newLitter]);
        count++;
        setTimeout(addOne, 100);
      } else {
        setIsRolling(false);
      }
    };

    setTimeout(addOne, 200);
  }, [results, litterSize]);

  const handleClearLitter = React.useCallback(() => {
    setLitter([]);
  }, []);

  const handleRemoveOffspring = React.useCallback((id: string) => {
    setLitter((prev) => prev.filter((o) => o.id !== id));
  }, []);

  if (!hasData) {
    return (
      <div className={`rounded-xl border border-hairline bg-surface p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎲</div>
          <h3 className="text-lg font-bold mb-2">Offspring Simulator</h3>
          <p className="text-sm text-secondary">
            Add genetic data for both parents to simulate potential offspring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 border-accent/30 bg-surface p-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">🎲</span>
            Offspring Simulator
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            {damName && sireName
              ? `Simulating offspring from ${damName} x ${sireName}`
              : "Roll the dice to generate random offspring based on genetic probabilities"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 bg-hairline rounded-lg p-1">
          <button
            onClick={() => setShowLitterMode(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              !showLitterMode ? "bg-surface shadow text-primary" : "text-secondary hover:text-primary"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setShowLitterMode(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              showLitterMode ? "bg-surface shadow text-primary" : "text-secondary hover:text-primary"
            }`}
          >
            Litter
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-hairline">
        {showLitterMode ? (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm text-secondary">Litter size:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={litterSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 20) {
                    setLitterSize(val);
                  }
                }}
                className="h-8 w-16 px-2 text-sm text-center border border-hairline rounded bg-surface focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
              <span className="text-xs text-secondary">(1-20)</span>
            </div>
            <button
              onClick={handleSimulateLitter}
              disabled={isRolling}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200
                ${
                  isRolling
                    ? "bg-accent/50 text-white cursor-wait"
                    : "bg-accent hover:bg-accent/90 text-white shadow-md hover:shadow-lg active:scale-95"
                }
              `}
            >
              {isRolling ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Simulating...
                </>
              ) : (
                <>
                  <span className="text-lg">🎲</span>
                  Simulate Litter
                </>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={handleSimulateOne}
            disabled={isRolling}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                isRolling
                  ? "bg-accent/50 text-white cursor-wait"
                  : "bg-accent hover:bg-accent/90 text-white shadow-md hover:shadow-lg active:scale-95"
              }
            `}
          >
            {isRolling ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Rolling...
              </>
            ) : (
              <>
                <span className="text-lg">🎲</span>
                Roll the Dice
              </>
            )}
          </button>
        )}

        {litter.length > 0 && (
          <button
            onClick={handleClearLitter}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-secondary hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        )}
      </div>

      {/* Litter Statistics (when we have offspring) */}
      {litter.length > 0 && showLitterMode && <LitterStatsPanel stats={litterStats} />}

      {/* Offspring Grid */}
      {litter.length > 0 ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {litter.map((offspring, index) => (
              <OffspringCard
                key={offspring.id}
                offspring={offspring}
                index={index}
                onRemove={() => handleRemoveOffspring(offspring.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-secondary">
          <div className="text-4xl mb-3 animate-bounce">🎲</div>
          <p className="text-sm">
            {showLitterMode
              ? `Click "Simulate Litter" to generate ${litterSize} potential offspring${litterSize > 1 ? '' : ' (increase to simulate a full litter)'}`
              : "Click \"Roll the Dice\" to generate a random offspring"}
          </p>
          <p className="text-xs mt-2 text-secondary/80">
            Each simulation uses weighted Mendelian probabilities
          </p>
        </div>
      )}

      {/* Educational Footer */}
      <div className="mt-4 pt-4 border-t border-hairline">
        <div className="flex items-start gap-2 text-xs text-secondary">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            <strong>Note:</strong> This simulator uses random selection weighted by Mendelian probabilities.
            Actual offspring outcomes may vary. This is for educational and planning purposes only.
            {species && (
              <span className="ml-1">
                (Simulating {species.charAt(0) + species.slice(1).toLowerCase()} genetics)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
