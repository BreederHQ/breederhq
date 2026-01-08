// apps/breeding/src/components/PunnettSquare.tsx
import * as React from "react";

/**
 * Inheritance type determines how alleles interact
 */
export type InheritanceType =
  | "simple-dominance"   // One allele dominant over another (e.g., B > b)
  | "codominance"        // Both alleles express equally (e.g., blood types)
  | "incomplete-dominance" // Blended expression (e.g., red x white = pink)
  | "recessive-lethal"   // Homozygous recessive is lethal (e.g., some color genes)
  | "dominant-lethal"    // Homozygous dominant is lethal (e.g., double merle)
  | "health-marker";     // Health test results (Clear/Carrier/Affected)

/**
 * Outcome classification for color coding
 */
export type OutcomeType =
  | "desirable"    // Green - ideal outcome
  | "carrier"      // Yellow - carries recessive trait
  | "caution"      // Orange - needs attention
  | "affected"     // Red - health concern or lethal
  | "neutral";     // Gray - standard outcome

/**
 * Props for the PunnettSquare component
 */
export interface PunnettSquareProps {
  /** Dam's alleles for this locus (e.g., ['E', 'e']) - can also use parent1Genotype */
  damAlleles?: [string, string];
  /** Sire's alleles for this locus (e.g., ['E', 'e']) - can also use parent2Genotype */
  sireAlleles?: [string, string];
  /** Alternative: Dam's genotype as string (e.g., 'E/e') */
  parent1Genotype?: string;
  /** Alternative: Sire's genotype as string (e.g., 'E/e') */
  parent2Genotype?: string;
  /** Name of the locus (e.g., "E Locus", "Extension") */
  locusName: string;
  /** Species for phenotype lookup */
  species?: string;
  /** Locus identifier for phenotype mapping (e.g., "E", "B", "D") */
  locusId?: string;
  /** Type of inheritance pattern */
  inheritanceType?: InheritanceType;
  /** Custom function to classify outcomes (overrides default behavior) */
  classifyOutcome?: (genotype: string) => OutcomeType;
  /** Custom function to get phenotype description (overrides default) */
  getPhenotype?: (genotype: string) => string;
  /** Map of dangerous genotypes to show as affected */
  dangerousGenotypes?: string[];
  /** Map of carrier genotypes */
  carrierGenotypes?: string[];
  /** Map of desirable genotypes */
  desirableGenotypes?: string[];
  /** Whether to show probability percentages */
  showProbabilities?: boolean;
  /** Whether to show phenotype descriptions */
  showPhenotypes?: boolean;
  /** Whether to show a legend */
  showLegend?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for smaller display */
  compact?: boolean;
}

/**
 * Parse a genotype string (e.g., "E/e" or "E/E") into alleles array
 */
function parseGenotype(genotype: string | undefined): [string, string] | null {
  if (!genotype) return null;
  // Handle various formats: "E/e", "E|e", "Ee", etc.
  const parts = genotype.split(/[\/|]/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return [parts[0].trim(), parts[1].trim()];
  }
  // Handle two-character format like "Ee"
  if (genotype.length === 2) {
    return [genotype[0], genotype[1]];
  }
  return null;
}

/**
 * Normalizes a genotype by sorting alleles alphabetically
 * This ensures consistent display regardless of parent order
 */
function normalizeGenotype(allele1: string, allele2: string): string {
  // Sort alleles - typically uppercase (dominant) comes first
  const sorted = [allele1, allele2].sort((a, b) => {
    // Uppercase letters come before lowercase
    const aIsUpper = a[0] === a[0].toUpperCase();
    const bIsUpper = b[0] === b[0].toUpperCase();
    if (aIsUpper && !bIsUpper) return -1;
    if (!aIsUpper && bIsUpper) return 1;
    return a.localeCompare(b);
  });
  return sorted.join('/');
}

/**
 * Default outcome classifier based on inheritance type and genotype
 */
function defaultClassifyOutcome(
  genotype: string,
  inheritanceType: InheritanceType,
  dangerousGenotypes?: string[],
  carrierGenotypes?: string[],
  desirableGenotypes?: string[]
): OutcomeType {
  const normalized = genotype.toLowerCase();
  const parts = genotype.split('/');

  // Check custom lists first
  if (dangerousGenotypes?.some(g => g.toLowerCase() === normalized ||
      normalizeGenotype(...(g.split('/') as [string, string])).toLowerCase() === normalized)) {
    return "affected";
  }
  if (desirableGenotypes?.some(g => g.toLowerCase() === normalized ||
      normalizeGenotype(...(g.split('/') as [string, string])).toLowerCase() === normalized)) {
    return "desirable";
  }
  if (carrierGenotypes?.some(g => g.toLowerCase() === normalized ||
      normalizeGenotype(...(g.split('/') as [string, string])).toLowerCase() === normalized)) {
    return "carrier";
  }

  // Default classification based on inheritance type
  switch (inheritanceType) {
    case "health-marker":
      // N/N = clear, N/X = carrier, X/X = affected
      if (parts[0] === 'N' && parts[1] === 'N') return "desirable";
      if (parts[0] === 'N' || parts[1] === 'N') return "carrier";
      return "affected";

    case "dominant-lethal":
      // Homozygous dominant is lethal (e.g., M/M double merle)
      const allele0Upper = parts[0][0] === parts[0][0].toUpperCase();
      const allele1Upper = parts[1][0] === parts[1][0].toUpperCase();
      if (allele0Upper && allele1Upper && parts[0] === parts[1]) return "affected";
      if (allele0Upper || allele1Upper) return "carrier";
      return "desirable";

    case "recessive-lethal":
      // Homozygous recessive is lethal
      const allele0Lower = parts[0][0] === parts[0][0].toLowerCase();
      const allele1Lower = parts[1][0] === parts[1][0].toLowerCase();
      if (allele0Lower && allele1Lower) return "affected";
      if (allele0Lower || allele1Lower) return "carrier";
      return "desirable";

    case "simple-dominance":
    case "codominance":
    case "incomplete-dominance":
    default:
      // Check if heterozygous (carrier)
      if (parts[0] !== parts[1]) return "carrier";
      // Homozygous - consider dominant as desirable
      const isUpperCase = parts[0][0] === parts[0][0].toUpperCase();
      return isUpperCase ? "desirable" : "neutral";
  }
}

/**
 * Get color classes for an outcome type
 */
function getOutcomeColors(outcome: OutcomeType): {
  bg: string;
  border: string;
  text: string;
} {
  switch (outcome) {
    case "desirable":
      return {
        bg: "bg-green-500/15",
        border: "border-green-500/40",
        text: "text-green-600 dark:text-green-400",
      };
    case "carrier":
      return {
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/40",
        text: "text-yellow-600 dark:text-yellow-400",
      };
    case "caution":
      return {
        bg: "bg-orange-500/15",
        border: "border-orange-500/40",
        text: "text-orange-600 dark:text-orange-400",
      };
    case "affected":
      return {
        bg: "bg-red-500/15",
        border: "border-red-500/40",
        text: "text-red-600 dark:text-red-400",
      };
    case "neutral":
    default:
      return {
        bg: "bg-neutral-500/10",
        border: "border-neutral-500/30",
        text: "text-neutral-600 dark:text-neutral-400",
      };
  }
}

/**
 * Calculate all offspring genotypes and their probabilities
 */
function calculateOffspring(
  damAlleles: [string, string],
  sireAlleles: [string, string]
): { genotype: string; probability: number; position: [number, number] }[] {
  const offspring: { genotype: string; probability: number; position: [number, number] }[] = [];

  // Safety check - ensure we have valid alleles
  if (!damAlleles?.[0] || !damAlleles?.[1] || !sireAlleles?.[0] || !sireAlleles?.[1]) {
    return offspring;
  }

  // Create 2x2 Punnett square positions
  const positions: [number, number][] = [
    [0, 0], // dam allele 1 x sire allele 1
    [0, 1], // dam allele 1 x sire allele 2
    [1, 0], // dam allele 2 x sire allele 1
    [1, 1], // dam allele 2 x sire allele 2
  ];

  positions.forEach(([damIdx, sireIdx]) => {
    const damAllele = damAlleles[damIdx];
    const sireAllele = sireAlleles[sireIdx];
    if (damAllele && sireAllele) {
      const genotype = normalizeGenotype(damAllele, sireAllele);
      offspring.push({
        genotype,
        probability: 25, // Each cell is 25%
        position: [damIdx, sireIdx],
      });
    }
  });

  return offspring;
}

/**
 * Calculate probability summary for unique genotypes
 */
function calculateProbabilities(
  offspring: { genotype: string; probability: number }[]
): Map<string, number> {
  const probabilities = new Map<string, number>();

  offspring.forEach(({ genotype, probability }) => {
    probabilities.set(genotype, (probabilities.get(genotype) || 0) + probability);
  });

  return probabilities;
}

/**
 * PunnettSquare Component
 *
 * A visual representation of Mendelian inheritance showing all possible
 * offspring genotypes from a genetic cross between two parents.
 */
export default function PunnettSquare({
  damAlleles: damAllelesProp,
  sireAlleles: sireAllelesProp,
  parent1Genotype,
  parent2Genotype,
  locusName,
  species = "DOG",
  locusId,
  inheritanceType = "simple-dominance",
  classifyOutcome,
  getPhenotype,
  dangerousGenotypes,
  carrierGenotypes,
  desirableGenotypes,
  showProbabilities = true,
  showPhenotypes = true,
  showLegend = true,
  className = "",
  compact = false,
}: PunnettSquareProps) {
  // Resolve alleles from either prop format (tuple or genotype string)
  const damAlleles = damAllelesProp || parseGenotype(parent1Genotype);
  const sireAlleles = sireAllelesProp || parseGenotype(parent2Genotype);

  // Early return with message if alleles are invalid
  if (!damAlleles || !sireAlleles || damAlleles.length !== 2 || sireAlleles.length !== 2) {
    return (
      <div className={`rounded-lg border border-hairline bg-surface p-4 ${className}`}>
        <div className="text-sm text-secondary">
          <span className="font-medium">{locusName}</span>
          <p className="mt-1 text-xs opacity-70">
            Insufficient genetic data for this locus. Both parents need complete genotype information.
          </p>
        </div>
      </div>
    );
  }

  // Calculate offspring and probabilities
  const offspring = React.useMemo(
    () => calculateOffspring(damAlleles, sireAlleles),
    [damAlleles, sireAlleles]
  );

  const probabilities = React.useMemo(
    () => calculateProbabilities(offspring),
    [offspring]
  );

  // Get outcome classification for a genotype
  const getOutcome = React.useCallback(
    (genotype: string): OutcomeType => {
      if (classifyOutcome) {
        return classifyOutcome(genotype);
      }
      return defaultClassifyOutcome(
        genotype,
        inheritanceType,
        dangerousGenotypes,
        carrierGenotypes,
        desirableGenotypes
      );
    },
    [classifyOutcome, inheritanceType, dangerousGenotypes, carrierGenotypes, desirableGenotypes]
  );

  // Get phenotype description
  const getPhenotypeDescription = React.useCallback(
    (genotype: string): string => {
      if (getPhenotype) {
        return getPhenotype(genotype);
      }
      // Default phenotype based on genotype structure
      const parts = genotype.split('/');
      if (parts[0] === parts[1]) {
        return `Homozygous ${parts[0]}`;
      }
      return `Heterozygous`;
    },
    [getPhenotype]
  );

  // Build the 2x2 grid data
  const gridCells = React.useMemo(() => {
    const cells: {
      row: number;
      col: number;
      genotype: string;
      outcome: OutcomeType;
      colors: ReturnType<typeof getOutcomeColors>;
    }[] = [];

    offspring.forEach(({ genotype, position }) => {
      const outcome = getOutcome(genotype);
      cells.push({
        row: position[0],
        col: position[1],
        genotype,
        outcome,
        colors: getOutcomeColors(outcome),
      });
    });

    return cells;
  }, [offspring, getOutcome]);

  // Get unique outcomes for legend
  const uniqueOutcomes = React.useMemo(() => {
    const outcomes = new Set<OutcomeType>();
    gridCells.forEach(cell => outcomes.add(cell.outcome));
    return Array.from(outcomes);
  }, [gridCells]);

  const cellSize = compact ? "h-16 w-16" : "h-20 w-20 sm:h-24 sm:w-24";
  const headerSize = compact ? "h-8 w-16" : "h-10 w-20 sm:w-24";
  const fontSize = compact ? "text-xs" : "text-sm";

  return (
    <div className={`inline-block ${className}`}>
      {/* Title */}
      <div className="text-center mb-3">
        <h4 className="font-medium text-primary text-sm">{locusName}</h4>
        {locusId && (
          <span className="text-xs text-secondary">Locus: {locusId}</span>
        )}
      </div>

      {/* Punnett Square Grid */}
      <div className="inline-flex flex-col">
        {/* Header row with sire alleles */}
        <div className="flex">
          {/* Empty corner cell */}
          <div className={`${headerSize} flex items-center justify-center`}>
            <span className="text-xs text-secondary opacity-50"></span>
          </div>
          {/* Sire allele headers */}
          {sireAlleles.map((allele, idx) => (
            <div
              key={`sire-${idx}`}
              className={`${cellSize} flex flex-col items-center justify-center border-b-2 border-blue-500/50`}
            >
              <span className="text-[10px] text-blue-500 mb-0.5">Sire</span>
              <span className={`font-bold text-blue-600 dark:text-blue-400 ${fontSize}`}>
                {allele}
              </span>
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {[0, 1].map((rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex">
            {/* Dam allele header */}
            <div
              className={`${headerSize} flex flex-col items-center justify-center border-r-2 border-pink-500/50`}
            >
              <span className="text-[10px] text-pink-500 mb-0.5">Dam</span>
              <span className={`font-bold text-pink-600 dark:text-pink-400 ${fontSize}`}>
                {damAlleles[rowIdx]}
              </span>
            </div>

            {/* Grid cells */}
            {[0, 1].map((colIdx) => {
              const cell = gridCells.find(
                (c) => c.row === rowIdx && c.col === colIdx
              );
              if (!cell) return null;

              return (
                <div
                  key={`cell-${rowIdx}-${colIdx}`}
                  className={`
                    ${cellSize}
                    ${cell.colors.bg}
                    border ${cell.colors.border}
                    flex flex-col items-center justify-center
                    transition-all duration-200
                    hover:scale-105 hover:shadow-md
                    cursor-default
                    m-0.5 rounded-md
                  `}
                  title={`${cell.genotype}: ${getPhenotypeDescription(cell.genotype)}`}
                >
                  <span className={`font-mono font-bold ${cell.colors.text} ${fontSize}`}>
                    {cell.genotype}
                  </span>
                  {showPhenotypes && !compact && (
                    <span className={`text-[10px] ${cell.colors.text} opacity-80 text-center px-1 leading-tight mt-1`}>
                      {getPhenotypeDescription(cell.genotype)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Probability Summary */}
      {showProbabilities && (
        <div className="mt-4 space-y-1">
          <div className="text-xs font-medium text-secondary mb-2">
            Offspring Probabilities:
          </div>
          {Array.from(probabilities.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([genotype, probability]) => {
              const outcome = getOutcome(genotype);
              const colors = getOutcomeColors(outcome);
              return (
                <div
                  key={genotype}
                  className={`
                    flex items-center justify-between
                    px-2 py-1 rounded
                    ${colors.bg}
                    ${colors.border}
                    border
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-medium ${colors.text} ${fontSize}`}>
                      {genotype}
                    </span>
                    {showPhenotypes && (
                      <span className={`text-xs ${colors.text} opacity-75`}>
                        ({getPhenotypeDescription(genotype)})
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${colors.text} ${fontSize}`}>
                    {probability}%
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Legend */}
      {showLegend && uniqueOutcomes.length > 1 && (
        <div className="mt-4 pt-3 border-t border-hairline">
          <div className="text-xs font-medium text-secondary mb-2">Legend:</div>
          <div className="flex flex-wrap gap-2">
            {uniqueOutcomes.map((outcome) => {
              const colors = getOutcomeColors(outcome);
              const labels: Record<OutcomeType, string> = {
                desirable: "Desirable",
                carrier: "Carrier",
                caution: "Caution",
                affected: "Affected",
                neutral: "Standard",
              };
              return (
                <div
                  key={outcome}
                  className={`
                    px-2 py-0.5 rounded text-xs
                    ${colors.bg}
                    ${colors.border}
                    ${colors.text}
                    border
                  `}
                >
                  {labels[outcome]}
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
 * Multi-locus Punnett display for showing multiple loci at once
 */
export interface MultiLocusPunnettProps {
  /** Array of locus configurations */
  loci: Omit<PunnettSquareProps, 'showLegend' | 'className'>[];
  /** Title for the entire display */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

export function MultiLocusPunnett({
  loci,
  title,
  className = "",
}: MultiLocusPunnettProps) {
  if (loci.length === 0) {
    return (
      <div className={`text-center text-secondary py-4 ${className}`}>
        No genetic loci data available
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loci.map((locusProps, idx) => (
          <div
            key={`locus-${idx}-${locusProps.locusId || locusProps.locusName}`}
            className="rounded-lg border border-hairline bg-surface p-4"
          >
            <PunnettSquare
              {...locusProps}
              showLegend={false}
              compact
            />
          </div>
        ))}
      </div>

      {/* Shared Legend */}
      <div className="mt-6 pt-4 border-t border-hairline">
        <div className="text-xs font-medium text-secondary mb-2">Legend:</div>
        <div className="flex flex-wrap gap-3">
          {(["desirable", "carrier", "caution", "affected", "neutral"] as OutcomeType[]).map(
            (outcome) => {
              const colors = getOutcomeColors(outcome);
              const labels: Record<OutcomeType, string> = {
                desirable: "Desirable / Clear",
                carrier: "Carrier / Heterozygous",
                caution: "Needs Attention",
                affected: "Affected / At Risk",
                neutral: "Standard Outcome",
              };
              return (
                <div
                  key={outcome}
                  className={`
                    px-3 py-1 rounded text-xs font-medium
                    ${colors.bg}
                    ${colors.border}
                    ${colors.text}
                    border
                  `}
                >
                  {labels[outcome]}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper hook to convert genetics data from the API format to PunnettSquare props
 */
export function useGeneticsPunnettData(
  damGenetics: { locus: string; locusName?: string; allele1: string; allele2: string }[],
  sireGenetics: { locus: string; locusName?: string; allele1: string; allele2: string }[],
  species: string = "DOG",
  phenotypeMap?: Record<string, string>
): Omit<PunnettSquareProps, 'showLegend' | 'className'>[] {
  return React.useMemo(() => {
    const damLoci = new Map(damGenetics.map(l => [l.locus, l]));
    const sireLoci = new Map(sireGenetics.map(l => [l.locus, l]));
    const allLoci = new Set([...damLoci.keys(), ...sireLoci.keys()]);

    const punnettData: Omit<PunnettSquareProps, 'showLegend' | 'className'>[] = [];

    for (const locus of allLoci) {
      const damLocus = damLoci.get(locus);
      const sireLocus = sireLoci.get(locus);

      if (!damLocus || !sireLocus) continue;
      if (!damLocus.allele1 || !damLocus.allele2 || !sireLocus.allele1 || !sireLocus.allele2) continue;

      punnettData.push({
        damAlleles: [damLocus.allele1, damLocus.allele2],
        sireAlleles: [sireLocus.allele1, sireLocus.allele2],
        locusName: damLocus.locusName || sireLocus.locusName || locus,
        locusId: locus,
        species,
        getPhenotype: phenotypeMap
          ? (genotype) => phenotypeMap[genotype] || genotype
          : undefined,
      });
    }

    return punnettData;
  }, [damGenetics, sireGenetics, species, phenotypeMap]);
}
