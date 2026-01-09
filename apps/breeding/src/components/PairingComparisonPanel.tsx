// apps/breeding/src/components/PairingComparisonPanel.tsx
import * as React from "react";
import { Plus, X, AlertTriangle, CheckCircle, Trophy, Loader2 } from "lucide-react";

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

type PairingResult = {
  coatColor: Array<{ trait: string; damGenotype: string; sireGenotype: string; prediction: string }>;
  coatType: Array<{ trait: string; damGenotype: string; sireGenotype: string; prediction: string }>;
  health: Array<{ trait: string; damGenotype: string; sireGenotype: string; prediction: string; warning?: boolean }>;
  physicalTraits: Array<{ trait: string; damGenotype: string; sireGenotype: string; prediction: string }>;
  eyeColor: Array<{ trait: string; damGenotype: string; sireGenotype: string; prediction: string }>;
  warnings: Array<{ severity: string; message: string }>;
  score: number;
};

type ComparisonColumn = {
  sire: Animal;
  sireGenetics: GeneticsData | null;
  coi: COIResult | null;
  results: PairingResult | null;
  loading: boolean;
};

interface PairingComparisonPanelProps {
  /** The dam (female) being compared against */
  dam: Animal | null;
  /** Dam's genetics data */
  damGenetics: GeneticsData | null;
  /** All available sires */
  availableSires: Animal[];
  /** API instance for COI calculation */
  api: any;
  /** Function to calculate genetic pairing */
  calculateGeneticPairing: (damGenetics: any, sireGenetics: any, species: string) => PairingResult;
  /** Callback when user wants to view full pairing */
  onViewFullPairing?: (sireId: number | string) => void;
}

export function PairingComparisonPanel({
  dam,
  damGenetics,
  availableSires,
  api,
  calculateGeneticPairing,
  onViewFullPairing,
}: PairingComparisonPanelProps) {
  const [columns, setColumns] = React.useState<ComparisonColumn[]>([]);
  const [selectedSireIds, setSelectedSireIds] = React.useState<Set<number | string>>(new Set());

  // Filter sires to same species as dam
  const filteredSires = React.useMemo(() => {
    if (!dam) return availableSires;
    return availableSires.filter(
      (s) => (s.species || "").toUpperCase() === (dam.species || "").toUpperCase()
    );
  }, [availableSires, dam]);

  // Add a sire to comparison
  const addSire = async (sire: Animal) => {
    if (selectedSireIds.has(sire.id) || columns.length >= 3) return;

    setSelectedSireIds((prev) => new Set([...prev, sire.id]));

    const newColumn: ComparisonColumn = {
      sire,
      sireGenetics: null,
      coi: null,
      results: null,
      loading: true,
    };

    setColumns((prev) => [...prev, newColumn]);

    // Load genetics and calculate
    try {
      // Load sire genetics
      const geneticsRes = await fetch(`/api/v1/animals/${sire.id}/genetics`, {
        credentials: "include",
      });
      let sireGenetics: GeneticsData | null = null;
      if (geneticsRes.ok) {
        sireGenetics = await geneticsRes.json();
      }

      // Calculate COI
      let coi: COIResult | null = null;
      if (dam) {
        try {
          coi = await api.lineage.getProspectiveCOI(Number(dam.id), Number(sire.id), 10);
        } catch (err) {
          console.debug("COI not available");
        }
      }

      // Calculate pairing results
      let results: PairingResult | null = null;
      if (damGenetics && sireGenetics) {
        results = calculateGeneticPairing(damGenetics, sireGenetics, dam?.species || "DOG");
      }

      // Update column
      setColumns((prev) =>
        prev.map((col) =>
          String(col.sire.id) === String(sire.id)
            ? { ...col, sireGenetics, coi, results, loading: false }
            : col
        )
      );
    } catch (err) {
      console.error("Failed to load comparison data:", err);
      setColumns((prev) =>
        prev.map((col) =>
          String(col.sire.id) === String(sire.id) ? { ...col, loading: false } : col
        )
      );
    }
  };

  // Remove a sire from comparison
  const removeSire = (sireId: number | string) => {
    setSelectedSireIds((prev) => {
      const next = new Set(prev);
      next.delete(sireId);
      return next;
    });
    setColumns((prev) => prev.filter((col) => String(col.sire.id) !== String(sireId)));
  };

  // Find the "best" column for highlighting
  const bestColumn = React.useMemo(() => {
    if (columns.length < 2) return null;
    const validColumns = columns.filter((c) => c.results && !c.loading);
    if (validColumns.length < 2) return null;

    let best = validColumns[0];
    for (const col of validColumns) {
      if (col.results && best.results && col.results.score > best.results.score) {
        best = col;
      }
    }
    return best.sire.id;
  }, [columns]);

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case "LOW": return "text-green-600 bg-green-500/10 border-green-500/30";
      case "MODERATE": return "text-yellow-600 bg-yellow-500/10 border-yellow-500/30";
      case "HIGH": return "text-orange-600 bg-orange-500/10 border-orange-500/30";
      case "CRITICAL": return "text-red-600 bg-red-500/10 border-red-500/30";
      default: return "text-secondary bg-surface-alt";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  // Get all unique loci across all columns for a category
  const getAllLoci = (category: keyof PairingResult) => {
    const lociSet = new Set<string>();
    for (const col of columns) {
      if (col.results && Array.isArray(col.results[category])) {
        for (const item of col.results[category] as any[]) {
          lociSet.add(item.trait);
        }
      }
    }
    return Array.from(lociSet);
  };

  // Get prediction for a specific locus from a column
  const getPrediction = (col: ComparisonColumn, category: keyof PairingResult, locus: string) => {
    if (!col.results || !Array.isArray(col.results[category])) return null;
    return (col.results[category] as any[]).find((item) => item.trait === locus);
  };

  if (!dam) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
        <h3 className="text-lg font-semibold text-primary mb-2">Pairing Comparison</h3>
        <p className="text-secondary">Select a dam first to compare potential sire pairings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with dam info */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <h3 className="text-lg font-semibold text-primary mb-2">
          Compare Pairings for {dam.name}
        </h3>
        <p className="text-sm text-secondary">
          {dam.species} • {dam.breed || "Unknown breed"} • Select up to 3 sires to compare
        </p>
      </div>

      {/* Sire selector */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <label className="block text-sm font-medium text-primary mb-2">
          Add Sire to Compare ({columns.length}/3)
        </label>
        <div className="flex gap-2">
          <select
            disabled={columns.length >= 3}
            className="flex-1 px-3 py-2 rounded-lg border border-hairline bg-surface text-primary disabled:opacity-50"
            onChange={(e) => {
              const sire = filteredSires.find((s) => String(s.id) === e.target.value);
              if (sire) {
                addSire(sire);
                e.target.value = "";
              }
            }}
            value=""
          >
            <option value="">Select a sire...</option>
            {filteredSires
              .filter((s) => !selectedSireIds.has(s.id))
              .map((sire) => (
                <option key={String(sire.id)} value={String(sire.id)}>
                  {sire.name} — {sire.breed || "Unknown"}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Comparison grid */}
      {columns.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface overflow-hidden">
          {/* Column headers */}
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
            {/* Dam column header */}
            <div className="p-4 bg-surface-alt border-b border-r border-hairline">
              <div className="font-semibold text-primary">Dam</div>
              <div className="text-sm text-secondary truncate">{dam.name}</div>
            </div>

            {/* Sire column headers */}
            {columns.map((col) => (
              <div
                key={String(col.sire.id)}
                className={`p-4 border-b border-hairline relative ${
                  bestColumn === col.sire.id ? "bg-green-500/5" : "bg-surface-alt"
                }`}
              >
                {bestColumn === col.sire.id && (
                  <Trophy className="absolute top-2 right-2 w-4 h-4 text-green-600" />
                )}
                <button
                  onClick={() => removeSire(col.sire.id)}
                  className="absolute top-2 right-2 p-1 hover:bg-surface rounded"
                  style={{ right: bestColumn === col.sire.id ? "28px" : "8px" }}
                >
                  <X className="w-4 h-4 text-secondary" />
                </button>
                <div className="font-semibold text-primary truncate pr-12">{col.sire.name}</div>
                <div className="text-sm text-secondary truncate">{col.sire.breed || "Unknown"}</div>
              </div>
            ))}
          </div>

          {/* Score row */}
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
            <div className="p-3 bg-surface border-b border-r border-hairline font-medium text-sm text-primary">
              Score
            </div>
            {columns.map((col) => (
              <div
                key={`score-${col.sire.id}`}
                className={`p-3 border-b border-hairline text-center ${
                  bestColumn === col.sire.id ? "bg-green-500/5" : ""
                }`}
              >
                {col.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-secondary" />
                ) : (
                  <span className={`text-xl font-bold ${getScoreColor(col.results?.score || 0)}`}>
                    {col.results?.score || "—"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* COI row */}
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
            <div className="p-3 bg-surface border-b border-r border-hairline font-medium text-sm text-primary">
              COI
            </div>
            {columns.map((col) => (
              <div
                key={`coi-${col.sire.id}`}
                className={`p-3 border-b border-hairline text-center ${
                  bestColumn === col.sire.id ? "bg-green-500/5" : ""
                }`}
              >
                {col.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-secondary" />
                ) : col.coi ? (
                  <span className={`px-2 py-0.5 rounded text-sm font-medium ${getRiskColor(col.coi.riskLevel)}`}>
                    {(col.coi.coefficient * 100).toFixed(1)}% ({col.coi.riskLevel})
                  </span>
                ) : (
                  <span className="text-secondary text-sm">N/A</span>
                )}
              </div>
            ))}
          </div>

          {/* Warnings row */}
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
            <div className="p-3 bg-surface border-b border-r border-hairline font-medium text-sm text-primary">
              Warnings
            </div>
            {columns.map((col) => (
              <div
                key={`warnings-${col.sire.id}`}
                className={`p-3 border-b border-hairline ${
                  bestColumn === col.sire.id ? "bg-green-500/5" : ""
                }`}
              >
                {col.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-secondary" />
                ) : col.results?.warnings && col.results.warnings.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {col.results.warnings.map((w, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 text-xs rounded"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {w.message.split(":")[0]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    None
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Coat Color section */}
          {getAllLoci("coatColor").length > 0 && (
            <>
              <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
                <div className="p-2 bg-accent/10 border-b border-r border-hairline font-medium text-sm text-accent" style={{ gridColumn: `span ${columns.length + 1}` }}>
                  Coat Color
                </div>
              </div>
              {getAllLoci("coatColor").map((locus) => (
                <div key={locus} className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
                  <div className="p-2 bg-surface border-b border-r border-hairline text-sm text-secondary truncate">
                    {locus}
                  </div>
                  {columns.map((col) => {
                    const pred = getPrediction(col, "coatColor", locus);
                    return (
                      <div
                        key={`${locus}-${col.sire.id}`}
                        className={`p-2 border-b border-hairline text-sm ${
                          bestColumn === col.sire.id ? "bg-green-500/5" : ""
                        }`}
                      >
                        {col.loading ? (
                          <span className="text-secondary">...</span>
                        ) : pred ? (
                          <span className="text-primary">{pred.prediction}</span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          {/* Health section */}
          {getAllLoci("health").length > 0 && (
            <>
              <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
                <div className="p-2 bg-accent/10 border-b border-r border-hairline font-medium text-sm text-accent" style={{ gridColumn: `span ${columns.length + 1}` }}>
                  Health
                </div>
              </div>
              {getAllLoci("health").map((locus) => (
                <div key={locus} className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
                  <div className="p-2 bg-surface border-b border-r border-hairline text-sm text-secondary truncate">
                    {locus}
                  </div>
                  {columns.map((col) => {
                    const pred = getPrediction(col, "health", locus);
                    return (
                      <div
                        key={`${locus}-${col.sire.id}`}
                        className={`p-2 border-b border-hairline text-sm ${
                          bestColumn === col.sire.id ? "bg-green-500/5" : ""
                        } ${pred?.warning ? "bg-orange-500/5" : ""}`}
                      >
                        {col.loading ? (
                          <span className="text-secondary">...</span>
                        ) : pred ? (
                          <span className={pred.warning ? "text-orange-600" : "text-primary"}>
                            {pred.prediction}
                          </span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          {/* Coat Type section */}
          {getAllLoci("coatType").length > 0 && (
            <>
              <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
                <div className="p-2 bg-accent/10 border-b border-r border-hairline font-medium text-sm text-accent" style={{ gridColumn: `span ${columns.length + 1}` }}>
                  Coat Type
                </div>
              </div>
              {getAllLoci("coatType").map((locus) => (
                <div key={locus} className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
                  <div className="p-2 bg-surface border-b border-r border-hairline text-sm text-secondary truncate">
                    {locus}
                  </div>
                  {columns.map((col) => {
                    const pred = getPrediction(col, "coatType", locus);
                    return (
                      <div
                        key={`${locus}-${col.sire.id}`}
                        className={`p-2 border-b border-hairline text-sm ${
                          bestColumn === col.sire.id ? "bg-green-500/5" : ""
                        }`}
                      >
                        {col.loading ? (
                          <span className="text-secondary">...</span>
                        ) : pred ? (
                          <span className="text-primary">{pred.prediction}</span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          {/* Action buttons */}
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${columns.length}, 1fr)` }}>
            <div className="p-3 bg-surface border-r border-hairline"></div>
            {columns.map((col) => (
              <div
                key={`action-${col.sire.id}`}
                className={`p-3 ${bestColumn === col.sire.id ? "bg-green-500/5" : ""}`}
              >
                {onViewFullPairing && (
                  <button
                    onClick={() => onViewFullPairing(col.sire.id)}
                    className="w-full px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm font-medium"
                  >
                    View Full Analysis
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {columns.length === 0 && (
        <div className="rounded-lg border border-dashed border-hairline bg-surface p-8 text-center">
          <Plus className="w-12 h-12 mx-auto text-secondary/50 mb-4" />
          <p className="text-secondary">
            Add sires above to start comparing potential pairings
          </p>
        </div>
      )}
    </div>
  );
}

export default PairingComparisonPanel;
