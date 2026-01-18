// apps/animals/src/components/MareReproductiveHistoryTab.tsx
// Mare Reproductive History Tab - displays aggregate breeding history for mares

import * as React from "react";
import { Heart, AlertTriangle, Activity, TrendingUp, Calendar, Baby } from "lucide-react";
import { Button } from "@bhq/ui";

type MareReproductiveHistory = {
  id: number;
  totalFoalings: number;
  totalLiveFoals: number;
  totalComplicatedFoalings: number;
  totalVeterinaryInterventions: number;
  totalRetainedPlacentas: number;
  lastFoalingDate?: string | null;
  lastFoalingComplications?: boolean | null;
  lastMareCondition?: string | null;
  lastPlacentaPassed?: boolean | null;
  lastPlacentaMinutes?: number | null;
  avgPostFoalingHeatDays?: number | null;
  minPostFoalingHeatDays?: number | null;
  maxPostFoalingHeatDays?: number | null;
  lastPostFoalingHeatDate?: string | null;
  lastReadyForRebreeding?: boolean | null;
  lastRebredDate?: string | null;
  riskScore: number;
  riskFactors: string[];
  lastUpdatedFromBreedYear?: number | null;
};

type DetailedFoalingHistory = {
  breedingPlanId: number;
  breedingPlanCode?: string | null;
  breedDate?: string | null;
  birthDate?: string | null;
  sire?: { id: number; name: string } | null;
  foalCount: number;
  liveFoalCount: number;
  outcome?: {
    hadComplications: boolean;
    complicationDetails?: string | null;
    veterinarianCalled: boolean;
    mareCondition?: string | null;
    placentaPassed?: boolean | null;
    placentaPassedMinutes?: number | null;
    postFoalingHeatDate?: string | null;
    readyForRebreeding: boolean;
    rebredDate?: string | null;
  } | null;
};

type MareReproductiveHistoryTabProps = {
  animal: {
    id: number;
    name: string;
    species?: string;
    sex?: string;
  };
  mode: "view" | "edit";
  api?: {
    getMareReproductiveHistory: (mareId: number) => Promise<MareReproductiveHistory>;
    getMareDetailedFoalingHistory: (mareId: number) => Promise<DetailedFoalingHistory[]>;
    recalculateMareHistory: (mareId: number) => Promise<MareReproductiveHistory>;
  };
};

const sectionClass = "rounded-lg border border-hairline bg-surface/50 p-4";
const labelClass = "text-xs text-secondary/70 uppercase tracking-wider";
const valueClass = "text-2xl font-semibold";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRiskColor(score: number): string {
  if (score === 0) return "text-emerald-400";
  if (score < 30) return "text-green-400";
  if (score < 50) return "text-amber-400";
  if (score < 70) return "text-orange-400";
  return "text-red-400";
}

function getConditionDisplay(condition?: string | null): { text: string; color: string } {
  switch (condition) {
    case "EXCELLENT":
      return { text: "Excellent", color: "text-emerald-400" };
    case "GOOD":
      return { text: "Good", color: "text-green-400" };
    case "FAIR":
      return { text: "Fair", color: "text-amber-400" };
    case "POOR":
      return { text: "Poor", color: "text-orange-400" };
    case "VETERINARY_CARE_REQUIRED":
      return { text: "Veterinary Care Required", color: "text-red-400" };
    default:
      return { text: "—", color: "text-secondary" };
  }
}

export function MareReproductiveHistoryTab({ animal, mode, api }: MareReproductiveHistoryTabProps) {
  const [history, setHistory] = React.useState<MareReproductiveHistory | null>(null);
  const [detailedHistory, setDetailedHistory] = React.useState<DetailedFoalingHistory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showDetailedHistory, setShowDetailedHistory] = React.useState(false);

  // Check if this is a valid mare
  const isHorse = animal.species?.toUpperCase() === "HORSE";
  const isFemale = animal.sex?.toUpperCase() === "FEMALE";

  React.useEffect(() => {
    if (!isHorse || !isFemale || !api) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const historyData = await api.getMareReproductiveHistory(animal.id);
        setHistory(historyData);
      } catch (err: any) {
        if (err?.message?.includes("not found") || err?.status === 404) {
          // No history exists yet - try to auto-generate it
          try {
            const generated = await api.recalculateMareHistory(animal.id);
            setHistory(generated);
          } catch (genErr: any) {
            // If generation also fails (e.g., no foaling data exists), that's fine
            if (genErr?.message?.includes("not found") || genErr?.status === 404) {
              setHistory(null);
            } else {
              // Real error during generation
              setError(genErr?.message || "Failed to load reproductive history");
            }
          }
        } else {
          setError(err?.message || "Failed to load reproductive history");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [animal.id, isHorse, isFemale, api]);

  const handleShowDetailedHistory = async () => {
    if (!api || detailedHistory.length > 0) {
      setShowDetailedHistory(true);
      return;
    }

    try {
      const data = await api.getMareDetailedFoalingHistory(animal.id);
      setDetailedHistory(data);
      setShowDetailedHistory(true);
    } catch (err: any) {
      setError(err?.message || "Failed to load detailed history");
    }
  };


  if (!isHorse || !isFemale) {
    return (
      <div className={sectionClass}>
        <div className="text-center py-8">
          <Heart className="h-12 w-12 text-secondary mx-auto mb-4" />
          <p className="text-secondary">
            Reproductive history tracking is only available for female horses (mares).
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={sectionClass}>
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-secondary mx-auto mb-4 animate-pulse" />
          <p className="text-secondary">Loading reproductive history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={sectionClass}>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className={sectionClass}>
        <div className="text-center py-8">
          <Baby className="h-12 w-12 text-secondary mx-auto mb-4" />
          <p className="text-secondary">
            No foaling history recorded yet for {animal.name}.
          </p>
          <p className="text-xs text-secondary/70 mt-2">
            Reproductive history will be automatically generated after the first foaling outcome is recorded.
          </p>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(history.riskScore);
  const lastCondition = getConditionDisplay(history.lastMareCondition);
  const complicationRate = history.totalFoalings > 0
    ? (history.totalComplicatedFoalings / history.totalFoalings) * 100
    : 0;
  const survivalRate = history.totalFoalings > 0
    ? (history.totalLiveFoals / history.totalFoalings) * 100
    : 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold text-purple-100">
                Reproductive History for {animal.name}
              </h3>
              <p className="text-xs text-purple-200/70">
                {history.totalFoalings} lifetime foaling{history.totalFoalings !== 1 ? "s" : ""}
                {history.lastUpdatedFromBreedYear && ` • Last updated from ${history.lastUpdatedFromBreedYear} breeding`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lifetime Statistics */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          Lifetime Statistics
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className={labelClass}>Total Foalings</div>
            <div className={valueClass}>{history.totalFoalings}</div>
          </div>
          <div>
            <div className={labelClass}>Live Foals</div>
            <div className={`${valueClass} text-emerald-400`}>{history.totalLiveFoals}</div>
          </div>
          <div>
            <div className={labelClass}>Complication Rate</div>
            <div className={`${valueClass} ${complicationRate > 30 ? "text-orange-400" : "text-green-400"}`}>
              {complicationRate.toFixed(0)}%
            </div>
          </div>
          <div>
            <div className={labelClass}>Survival Rate</div>
            <div className={`${valueClass} text-emerald-400`}>{survivalRate.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Risk Assessment
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">Overall Risk Score</span>
            <span className={`text-2xl font-semibold ${riskColor}`}>{history.riskScore}/100</span>
          </div>
          {history.riskFactors.length > 0 && (
            <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
              <div className="text-xs font-semibold text-amber-300 mb-2">Risk Factors:</div>
              <ul className="space-y-1">
                {history.riskFactors.map((factor, idx) => (
                  <li key={idx} className="text-xs text-amber-200 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {history.riskFactors.length === 0 && (
            <div className="text-xs text-emerald-300">
              No significant risk factors identified. This mare has a clean foaling history.
            </div>
          )}
        </div>
      </div>

      {/* Last Foaling Information */}
      {history.lastFoalingDate && (
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
            <Calendar className="h-4 w-4 text-purple-400" />
            Most Recent Foaling
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className={labelClass}>Foaling Date</div>
              <div className="text-sm">{formatDate(history.lastFoalingDate)}</div>
            </div>
            <div>
              <div className={labelClass}>Mare Condition</div>
              <div className={`text-sm ${lastCondition.color}`}>{lastCondition.text}</div>
            </div>
            {history.lastFoalingComplications !== null && (
              <div>
                <div className={labelClass}>Complications</div>
                <div className={`text-sm ${history.lastFoalingComplications ? "text-orange-400" : "text-green-400"}`}>
                  {history.lastFoalingComplications ? "Yes" : "None"}
                </div>
              </div>
            )}
            {history.lastPlacentaPassed !== null && (
              <div>
                <div className={labelClass}>Placenta Passed</div>
                <div className={`text-sm ${history.lastPlacentaPassed ? "text-green-400" : "text-red-400"}`}>
                  {history.lastPlacentaPassed ? (
                    history.lastPlacentaMinutes ? `Yes (${history.lastPlacentaMinutes} min)` : "Yes"
                  ) : "No"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-Foaling Heat Cycle Patterns */}
      {history.avgPostFoalingHeatDays !== null && (
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
            <Activity className="h-4 w-4 text-pink-400" />
            Foal Heat Cycle Patterns
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className={labelClass}>Average Days</div>
              <div className={valueClass}>{history.avgPostFoalingHeatDays?.toFixed(1) ?? "—"}</div>
            </div>
            <div>
              <div className={labelClass}>Min Days</div>
              <div className="text-lg">{history.minPostFoalingHeatDays ?? "—"}</div>
            </div>
            <div>
              <div className={labelClass}>Max Days</div>
              <div className="text-lg">{history.maxPostFoalingHeatDays ?? "—"}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-secondary">
            Typical foal heat occurs 7-12 days after foaling. This mare averages{" "}
            {history.avgPostFoalingHeatDays?.toFixed(1) ?? "—"} days.
          </div>
        </div>
      )}

      {/* Detailed History Section */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Foaling History Details</div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShowDetailedHistory}
          >
            {showDetailedHistory ? "Hide Details" : "Show Details"}
          </Button>
        </div>

        {showDetailedHistory && (
          <div className="space-y-3">
            {detailedHistory.length === 0 ? (
              <div className="text-center py-4 text-secondary text-sm">
                Loading detailed history...
              </div>
            ) : (
              detailedHistory.map((item) => (
                <div
                  key={item.breedingPlanId}
                  className="p-3 rounded-md bg-surface border border-hairline"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium">
                        {item.breedingPlanCode || `Plan #${item.breedingPlanId}`}
                      </div>
                      <div className="text-xs text-secondary">
                        Bred {formatDate(item.breedDate)} • Born {formatDate(item.birthDate)}
                      </div>
                      {item.sire && (
                        <div className="text-xs text-secondary/70">Sire: {item.sire.name}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-emerald-400">
                        {item.liveFoalCount} of {item.foalCount} live
                      </div>
                    </div>
                  </div>

                  {item.outcome && (
                    <div className="mt-2 pt-2 border-t border-hairline text-xs space-y-1">
                      {item.outcome.hadComplications && (
                        <div className="text-orange-400">⚠️ Had complications</div>
                      )}
                      {item.outcome.veterinarianCalled && (
                        <div className="text-blue-400">🩺 Veterinary assistance</div>
                      )}
                      {item.outcome.mareCondition && (
                        <div className="text-secondary">
                          Mare condition: {getConditionDisplay(item.outcome.mareCondition).text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MareReproductiveHistoryTab;
