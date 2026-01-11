// packages/ui/src/components/GeneticsDisplay/NetworkGeneticsCard.tsx
// Card for displaying genetics from network-linked animals

import * as React from "react";
import { Dna, Link2, Shield, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { AnimalGeneticResult, GeneticMarkerCategory, GeneticResultStatus } from "@bhq/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NetworkAnimalGenetics {
  /** Animal ID from network */
  animalId: number;
  /** Animal name */
  animalName: string;
  /** Owner/breeder name */
  ownerName?: string;
  /** Link to animal profile (if available) */
  profileUrl?: string;
  /** Relationship to current context (e.g., "Sire", "Dam", "Potential mate") */
  relationship?: string;
  /** Genetic results shared by the breeder */
  results: AnimalGeneticResult[];
  /** When the data was last updated */
  lastUpdated?: string;
}

export interface NetworkGeneticsCardProps {
  /** Network animal genetics data */
  animal: NetworkAnimalGenetics;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
  /** Callback when user wants to view full profile */
  onViewProfile?: (animalId: number) => void;
  /** Custom class name */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<GeneticResultStatus, { label: string; color: string; bgColor: string }> = {
  clear: {
    label: "Clear",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  carrier: {
    label: "Carrier",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  affected: {
    label: "Affected",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  at_risk: {
    label: "At Risk",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900",
  },
  not_tested: {
    label: "Not Tested",
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};

const CATEGORY_LABELS: Record<GeneticMarkerCategory, string> = {
  health: "Health",
  coat_color: "Coat Color",
  coat_type: "Coat Type",
  physical_traits: "Physical",
  eye_color: "Eye Color",
  other: "Other",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function NetworkGeneticsCard({
  animal,
  defaultExpanded = false,
  onViewProfile,
  className = "",
}: NetworkGeneticsCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const { results, animalName, ownerName, relationship, lastUpdated, profileUrl, animalId } = animal;

  // Group results by category
  const grouped = React.useMemo(() => {
    const groups = new Map<GeneticMarkerCategory, AnimalGeneticResult[]>();
    results.forEach((r) => {
      const cat = r.marker?.category || "other";
      const arr = groups.get(cat) || [];
      arr.push(r);
      groups.set(cat, arr);
    });
    return groups;
  }, [results]);

  // Health summary
  const healthResults = grouped.get("health") || [];
  const healthCounts = {
    clear: healthResults.filter((r) => r.status === "clear").length,
    carrier: healthResults.filter((r) => r.status === "carrier").length,
    affected: healthResults.filter((r) => r.status === "affected").length,
  };

  if (results.length === 0) {
    return (
      <div className={`border border-hairline rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center">
            <Dna className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{animalName}</div>
            {relationship && <div className="text-xs text-secondary">{relationship}</div>}
          </div>
          <div className="text-sm text-secondary">No genetics shared</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-hairline rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{animalName}</div>
          <div className="text-xs text-secondary flex items-center gap-2">
            {relationship && <span>{relationship}</span>}
            {ownerName && (
              <>
                <span className="text-hairline">•</span>
                <span>{ownerName}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Health summary badges */}
          <div className="flex items-center gap-1.5">
            {healthCounts.clear > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                <Shield className="w-3 h-3" />
                {healthCounts.clear}
              </span>
            )}
            {healthCounts.carrier > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                {healthCounts.carrier} carrier
              </span>
            )}
            {healthCounts.affected > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                {healthCounts.affected} affected
              </span>
            )}
          </div>

          <div className="text-xs text-secondary">
            {results.length} marker{results.length !== 1 ? "s" : ""}
          </div>

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-hairline p-4 bg-surface-alt space-y-4">
          {/* Health markers first */}
          {healthResults.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                Health Markers ({healthResults.length})
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {healthResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-2 rounded ${result.status ? STATUS_CONFIG[result.status].bgColor : "bg-surface"}`}
                  >
                    <div className="text-sm font-medium">{result.marker?.commonName || `Marker ${result.markerId}`}</div>
                    <div className={`text-xs font-mono ${result.status ? STATUS_CONFIG[result.status].color : ""}`}>
                      {result.status
                        ? STATUS_CONFIG[result.status].label
                        : result.genotype || result.rawValue || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other categories */}
          {Array.from(grouped.entries())
            .filter(([cat]) => cat !== "health")
            .map(([category, categoryResults]) => (
              <div key={category}>
                <h5 className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                  {CATEGORY_LABELS[category]} ({categoryResults.length})
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {categoryResults.map((result) => (
                    <div key={result.id} className="p-2 rounded bg-surface">
                      <div className="text-sm font-medium truncate">
                        {result.marker?.commonName || `Marker ${result.markerId}`}
                      </div>
                      <div className="text-xs font-mono text-secondary">
                        {result.genotype ||
                          (result.allele1 && result.allele2
                            ? `${result.allele1}/${result.allele2}`
                            : result.rawValue || "—")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-hairline">
            <div className="text-xs text-secondary">
              {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleDateString()}</span>}
            </div>
            {(profileUrl || onViewProfile) && (
              <button
                onClick={() => {
                  if (onViewProfile) onViewProfile(animalId);
                  else if (profileUrl) window.open(profileUrl, "_blank");
                }}
                className="text-xs text-brand hover:underline flex items-center gap-1"
              >
                View Full Profile
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * List of network genetics cards
 */
export function NetworkGeneticsList({
  animals,
  title,
  emptyMessage = "No genetics data available from network",
  onViewProfile,
  className = "",
}: {
  animals: NetworkAnimalGenetics[];
  title?: string;
  emptyMessage?: string;
  onViewProfile?: (animalId: number) => void;
  className?: string;
}) {
  if (animals.length === 0) {
    return (
      <div className={`text-center py-8 text-secondary ${className}`}>
        <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h3 className="font-medium flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          {title}
        </h3>
      )}
      {animals.map((animal) => (
        <NetworkGeneticsCard
          key={animal.animalId}
          animal={animal}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
}
