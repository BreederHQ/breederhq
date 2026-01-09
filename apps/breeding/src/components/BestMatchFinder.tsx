// apps/breeding/src/components/BestMatchFinder.tsx
import * as React from "react";
import { Search, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Loader2, Filter } from "lucide-react";

type Animal = {
  id: number | string;
  name: string;
  species: string;
  breed?: string | null;
  sex: string;
};

type GeneticsData = {
  coatColor?: Array<{ locus: string; locusName?: string; allele1?: string; allele2?: string; genotype?: string }>;
  coatType?: Array<{ locus: string; locusName?: string; allele1?: string; allele2?: string; genotype?: string }>;
  health?: Array<{ locus: string; locusName?: string; genotype?: string; status?: string }>;
  physicalTraits?: Array<{ locus: string; locusName?: string; allele1?: string; allele2?: string }>;
  eyeColor?: Array<{ locus: string; locusName?: string; allele1?: string; allele2?: string }>;
};

type COIResult = {
  coefficient: number;
  generationsAnalyzed: number;
  commonAncestors: Array<{ id: number; name: string; pathCount: number; contribution: number }>;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
};

type MatchResult = {
  animal: Animal;
  genetics: GeneticsData | null;
  coi: COIResult | null;
  score: number;
  warnings: string[];
  healthRisks: string[];
  scoreBreakdown: {
    coiPenalty: number;
    healthPenalty: number;
    warningPenalty: number;
    bonusPoints: number;
  };
};

interface BestMatchFinderProps {
  /** All available animals */
  animals: Animal[];
  /** API instance for COI calculation */
  api: any;
  /** Currently selected animal (the one we're finding matches for) */
  selectedAnimal?: Animal | null;
  /** Mode: find sires for a dam, or dams for a sire */
  mode: "find-sires" | "find-dams";
  /** Callback when user selects a match to view full pairing */
  onSelectMatch?: (matchId: number | string) => void;
  /** Function to calculate genetic pairing (passed from parent) */
  calculateGeneticPairing: (damGenetics: any, sireGenetics: any, species: string) => any;
}

// Scoring constants
const COI_PENALTIES: Record<string, number> = {
  CRITICAL: 40,
  HIGH: 25,
  MODERATE: 15,
  LOW: 0,
};

const LETHAL_WARNINGS = [
  "Double Merle",
  "Lethal White Overo",
  "Double Fold",
  "Polled x Polled",
  "Double LP",
];

export function BestMatchFinder({
  animals,
  api,
  selectedAnimal,
  mode,
  onSelectMatch,
  calculateGeneticPairing,
}: BestMatchFinderProps) {
  const [results, setResults] = React.useState<MatchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0 });
  const [expandedId, setExpandedId] = React.useState<number | string | null>(null);
  const [filters, setFilters] = React.useState({
    minScore: 0,
    breed: "all",
    maxCOI: 100,
  });
  const [sortBy, setSortBy] = React.useState<"score" | "coi" | "name">("score");

  // Get candidates based on mode
  const candidates = React.useMemo(() => {
    if (!selectedAnimal) return [];

    const targetSex = mode === "find-sires" ? "M" : "F";
    return animals.filter((a) => {
      const sexMatch = (a.sex || "").toUpperCase().startsWith(targetSex);
      const speciesMatch = (a.species || "").toUpperCase() === (selectedAnimal.species || "").toUpperCase();
      const notSelf = String(a.id) !== String(selectedAnimal.id);
      return sexMatch && speciesMatch && notSelf;
    });
  }, [animals, selectedAnimal, mode]);

  // Get unique breeds for filter
  const breeds = React.useMemo(() => {
    const breedSet = new Set(candidates.map((a) => a.breed).filter(Boolean));
    return Array.from(breedSet).sort();
  }, [candidates]);

  // Calculate matches when selected animal changes
  const calculateMatches = React.useCallback(async () => {
    if (!selectedAnimal || candidates.length === 0) return;

    setLoading(true);
    setProgress({ current: 0, total: candidates.length });
    setResults([]);

    const matchResults: MatchResult[] = [];

    // Load selected animal's genetics
    let selectedGenetics: GeneticsData | null = null;
    try {
      const res = await fetch(`/api/v1/animals/${selectedAnimal.id}/genetics`, {
        credentials: "include",
      });
      if (res.ok) {
        selectedGenetics = await res.json();
      }
    } catch (err) {
      console.error("Failed to load selected animal genetics:", err);
    }

    // Process candidates in batches for better performance
    const batchSize = 5;
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);

      const batchPromises = batch.map(async (candidate) => {
        const result: MatchResult = {
          animal: candidate,
          genetics: null,
          coi: null,
          score: 100,
          warnings: [],
          healthRisks: [],
          scoreBreakdown: {
            coiPenalty: 0,
            healthPenalty: 0,
            warningPenalty: 0,
            bonusPoints: 0,
          },
        };

        // Load candidate's genetics
        try {
          const res = await fetch(`/api/v1/animals/${candidate.id}/genetics`, {
            credentials: "include",
          });
          if (res.ok) {
            result.genetics = await res.json();
          }
        } catch (err) {
          console.error(`Failed to load genetics for ${candidate.name}:`, err);
        }

        // Calculate COI
        try {
          const damId = mode === "find-sires" ? selectedAnimal.id : candidate.id;
          const sireId = mode === "find-sires" ? candidate.id : selectedAnimal.id;
          result.coi = await api.lineage.getProspectiveCOI(Number(damId), Number(sireId), 10);
        } catch (err) {
          // COI calculation might fail for animals without lineage - that's ok
          console.debug(`COI not available for ${candidate.name}`);
        }

        // Calculate genetic compatibility if we have both genetics
        if (selectedGenetics && result.genetics) {
          const damGenetics = mode === "find-sires" ? selectedGenetics : result.genetics;
          const sireGenetics = mode === "find-sires" ? result.genetics : selectedGenetics;

          try {
            const pairingResults = calculateGeneticPairing(damGenetics, sireGenetics, selectedAnimal.species || "DOG");

            // Extract warnings
            if (pairingResults.warnings) {
              result.warnings = pairingResults.warnings.map((w: any) => w.message || w);
            }

            // Check for lethal combinations
            for (const warning of result.warnings) {
              if (LETHAL_WARNINGS.some(lw => warning.toLowerCase().includes(lw.toLowerCase()))) {
                result.scoreBreakdown.warningPenalty += 50;
              }
            }

            // Check health risks (carrier x carrier)
            if (pairingResults.health) {
              for (const health of pairingResults.health) {
                if (health.warning) {
                  result.healthRisks.push(health.trait);
                  result.scoreBreakdown.healthPenalty += 20;
                }
              }
            }

            // Bonus for all-clear health
            if (pairingResults.health?.length > 0 && result.healthRisks.length === 0) {
              result.scoreBreakdown.bonusPoints += 10;
            }
          } catch (err) {
            console.error(`Failed to calculate pairing for ${candidate.name}:`, err);
          }
        }

        // Apply COI penalty
        if (result.coi) {
          result.scoreBreakdown.coiPenalty = COI_PENALTIES[result.coi.riskLevel] || 0;
        }

        // Calculate final score
        result.score = Math.max(0, Math.min(100,
          100 -
          result.scoreBreakdown.coiPenalty -
          result.scoreBreakdown.healthPenalty -
          result.scoreBreakdown.warningPenalty +
          result.scoreBreakdown.bonusPoints
        ));

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      matchResults.push(...batchResults);
      setProgress({ current: Math.min(i + batchSize, candidates.length), total: candidates.length });
    }

    // Sort by score descending
    matchResults.sort((a, b) => b.score - a.score);
    setResults(matchResults);
    setLoading(false);
  }, [selectedAnimal, candidates, api, mode, calculateGeneticPairing]);

  // Filter and sort results
  const filteredResults = React.useMemo(() => {
    let filtered = results.filter((r) => {
      if (r.score < filters.minScore) return false;
      if (filters.breed !== "all" && r.animal.breed !== filters.breed) return false;
      if (r.coi && r.coi.coefficient * 100 > filters.maxCOI) return false;
      return true;
    });

    // Sort
    if (sortBy === "score") {
      filtered.sort((a, b) => b.score - a.score);
    } else if (sortBy === "coi") {
      filtered.sort((a, b) => (a.coi?.coefficient || 0) - (b.coi?.coefficient || 0));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.animal.name.localeCompare(b.animal.name));
    }

    return filtered;
  }, [results, filters, sortBy]);

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case "LOW": return "text-green-600 bg-green-500/10";
      case "MODERATE": return "text-yellow-600 bg-yellow-500/10";
      case "HIGH": return "text-orange-600 bg-orange-500/10";
      case "CRITICAL": return "text-red-600 bg-red-500/10";
      default: return "text-secondary bg-surface-alt";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  if (!selectedAnimal) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
        <Search className="w-12 h-12 mx-auto text-secondary/50 mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">Best Match Finder</h3>
        <p className="text-secondary">
          Select a {mode === "find-sires" ? "dam" : "sire"} first to find the best matching{" "}
          {mode === "find-sires" ? "sires" : "dams"}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">
              Best {mode === "find-sires" ? "Sire" : "Dam"} Matches for {selectedAnimal.name}
            </h3>
            <p className="text-sm text-secondary">
              {selectedAnimal.species} • {selectedAnimal.breed || "Unknown breed"}
            </p>
          </div>

          <button
            onClick={calculateMatches}
            disabled={loading}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Find Matches
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-secondary mb-1">
              <span>Analyzing {progress.current} of {progress.total} candidates</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {results.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary">Filters</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-secondary">Min Score:</span>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters(f => ({ ...f, minScore: Number(e.target.value) }))}
                className="px-2 py-1 rounded border border-hairline bg-surface text-sm"
              >
                <option value={0}>Any</option>
                <option value={60}>60+</option>
                <option value={70}>70+</option>
                <option value={80}>80+</option>
                <option value={90}>90+</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-sm text-secondary">Breed:</span>
              <select
                value={filters.breed}
                onChange={(e) => setFilters(f => ({ ...f, breed: e.target.value }))}
                className="px-2 py-1 rounded border border-hairline bg-surface text-sm"
              >
                <option value="all">All Breeds</option>
                {breeds.map(b => (
                  <option key={b} value={b || ""}>{b}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-sm text-secondary">Max COI:</span>
              <select
                value={filters.maxCOI}
                onChange={(e) => setFilters(f => ({ ...f, maxCOI: Number(e.target.value) }))}
                className="px-2 py-1 rounded border border-hairline bg-surface text-sm"
              >
                <option value={100}>Any</option>
                <option value={25}>≤25%</option>
                <option value={12.5}>≤12.5%</option>
                <option value={6.25}>≤6.25%</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-sm text-secondary">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1 rounded border border-hairline bg-surface text-sm"
              >
                <option value="score">Score (High to Low)</option>
                <option value="coi">COI (Low to High)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface overflow-hidden">
          <div className="px-4 py-3 bg-surface-alt border-b border-hairline">
            <span className="text-sm font-medium text-primary">
              {filteredResults.length} match{filteredResults.length !== 1 ? "es" : ""} found
            </span>
          </div>

          <div className="divide-y divide-hairline">
            {filteredResults.slice(0, 20).map((result, index) => (
              <div key={String(result.animal.id)} className="p-4">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === result.animal.id ? null : result.animal.id)}
                >
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-sm font-medium text-secondary">
                    {index + 1}
                  </div>

                  {/* Animal info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-primary truncate">{result.animal.name}</div>
                    <div className="text-xs text-secondary">{result.animal.breed || "Unknown breed"}</div>
                  </div>

                  {/* COI */}
                  <div className="text-center">
                    <div className={`text-sm font-medium px-2 py-0.5 rounded ${getRiskColor(result.coi?.riskLevel)}`}>
                      {result.coi ? `${(result.coi.coefficient * 100).toFixed(1)}%` : "N/A"}
                    </div>
                    <div className="text-xs text-secondary">COI</div>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                      {result.score}
                    </div>
                    <div className="text-xs text-secondary">Score</div>
                  </div>

                  {/* Warnings indicator */}
                  <div className="w-8 flex justify-center">
                    {result.warnings.length > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* Expand toggle */}
                  <div className="w-8 flex justify-center">
                    {expandedId === result.animal.id ? (
                      <ChevronUp className="w-5 h-5 text-secondary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === result.animal.id && (
                  <div className="mt-4 pt-4 border-t border-hairline space-y-3">
                    {/* Score breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2 bg-surface-alt rounded">
                        <div className="text-xs text-secondary">COI Penalty</div>
                        <div className="text-sm font-medium text-red-600">-{result.scoreBreakdown.coiPenalty}</div>
                      </div>
                      <div className="p-2 bg-surface-alt rounded">
                        <div className="text-xs text-secondary">Health Penalty</div>
                        <div className="text-sm font-medium text-red-600">-{result.scoreBreakdown.healthPenalty}</div>
                      </div>
                      <div className="p-2 bg-surface-alt rounded">
                        <div className="text-xs text-secondary">Warning Penalty</div>
                        <div className="text-sm font-medium text-red-600">-{result.scoreBreakdown.warningPenalty}</div>
                      </div>
                      <div className="p-2 bg-surface-alt rounded">
                        <div className="text-xs text-secondary">Bonus Points</div>
                        <div className="text-sm font-medium text-green-600">+{result.scoreBreakdown.bonusPoints}</div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div className="flex items-center gap-2 text-orange-600 font-medium text-sm mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          Warnings
                        </div>
                        <ul className="text-sm text-secondary space-y-1">
                          {result.warnings.map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Health risks */}
                    {result.healthRisks.length > 0 && (
                      <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div className="text-yellow-600 font-medium text-sm mb-2">
                          Health Risks (Carrier × Carrier)
                        </div>
                        <ul className="text-sm text-secondary space-y-1">
                          {result.healthRisks.map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Common ancestors */}
                    {result.coi?.commonAncestors && result.coi.commonAncestors.length > 0 && (
                      <div className="p-3 bg-surface-alt rounded-lg">
                        <div className="text-sm font-medium text-primary mb-2">Common Ancestors</div>
                        <div className="text-sm text-secondary">
                          {result.coi.commonAncestors.slice(0, 5).map((a, i) => (
                            <span key={a.id}>
                              {i > 0 && ", "}
                              {a.name} ({(a.contribution * 100).toFixed(1)}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    {onSelectMatch && (
                      <button
                        onClick={() => onSelectMatch(result.animal.id)}
                        className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm font-medium"
                      >
                        View Full Pairing Analysis
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredResults.length > 20 && (
            <div className="px-4 py-3 bg-surface-alt text-center text-sm text-secondary">
              Showing top 20 of {filteredResults.length} matches
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BestMatchFinder;
