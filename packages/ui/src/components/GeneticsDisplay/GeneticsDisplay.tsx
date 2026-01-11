// packages/ui/src/components/GeneticsDisplay/GeneticsDisplay.tsx
// Public-facing genetics display component for marketplace and network sharing

import * as React from "react";
import { Dna, Heart, Palette, Sparkles, Eye, Shield, ChevronDown, ChevronUp } from "lucide-react";
import type { AnimalGeneticResult, GeneticMarkerCategory, GeneticResultStatus } from "@bhq/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneticsDisplayProps {
  /** Genetic results to display */
  results: AnimalGeneticResult[];
  /** Display mode - compact for cards, full for detail pages */
  mode?: "compact" | "full";
  /** Show health markers prominently */
  highlightHealth?: boolean;
  /** Max items to show in compact mode before "show more" */
  compactLimit?: number;
  /** Custom class name */
  className?: string;
  /** Title override */
  title?: string;
  /** Show category headers */
  showCategories?: boolean;
}

export interface GeneticsSummaryProps {
  /** Genetic results to summarize */
  results: AnimalGeneticResult[];
  /** Show count badges */
  showCounts?: boolean;
  /** Custom class name */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Category Config
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<GeneticMarkerCategory, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  health: {
    icon: <Heart className="w-4 h-4" />,
    label: "Health",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
  coat_color: {
    icon: <Palette className="w-4 h-4" />,
    label: "Coat Color",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  coat_type: {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Coat Type",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  physical_traits: {
    icon: <Dna className="w-4 h-4" />,
    label: "Physical Traits",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  eye_color: {
    icon: <Eye className="w-4 h-4" />,
    label: "Eye Color",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  other: {
    icon: <Dna className="w-4 h-4" />,
    label: "Other",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900",
  },
};

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

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function groupByCategory(results: AnimalGeneticResult[]): Map<GeneticMarkerCategory, AnimalGeneticResult[]> {
  const groups = new Map<GeneticMarkerCategory, AnimalGeneticResult[]>();

  // Initialize with empty arrays in display order
  const order: GeneticMarkerCategory[] = ["health", "coat_color", "coat_type", "physical_traits", "eye_color", "other"];
  order.forEach((cat) => groups.set(cat, []));

  // Populate groups
  results.forEach((result) => {
    const category = result.marker?.category || "other";
    const arr = groups.get(category) || [];
    arr.push(result);
    groups.set(category, arr);
  });

  // Remove empty groups
  order.forEach((cat) => {
    if (groups.get(cat)?.length === 0) {
      groups.delete(cat);
    }
  });

  return groups;
}

function getDisplayValue(result: AnimalGeneticResult): string {
  if (result.genotype) return result.genotype;
  if (result.allele1 && result.allele2) return `${result.allele1}/${result.allele2}`;
  if (result.status) return STATUS_CONFIG[result.status]?.label || result.status;
  if (result.rawValue) return result.rawValue;
  return "—";
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compact summary badge showing genetics highlights
 */
export function GeneticsSummary({ results, showCounts = true, className = "" }: GeneticsSummaryProps) {
  if (results.length === 0) return null;

  const grouped = groupByCategory(results);
  const healthResults = grouped.get("health") || [];

  // Count health statuses
  const healthCounts = {
    clear: healthResults.filter((r) => r.status === "clear").length,
    carrier: healthResults.filter((r) => r.status === "carrier").length,
    affected: healthResults.filter((r) => r.status === "affected").length,
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm">
        <Dna className="w-4 h-4 text-secondary" />
        <span className="font-medium">{results.length}</span>
        <span className="text-secondary">markers tested</span>
      </div>

      {healthResults.length > 0 && (
        <div className="flex items-center gap-1.5">
          {healthCounts.clear > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
              <Shield className="w-3 h-3" />
              {showCounts && <span>{healthCounts.clear}</span>}
              Clear
            </span>
          )}
          {healthCounts.carrier > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
              {showCounts && <span>{healthCounts.carrier}</span>}
              Carrier
            </span>
          )}
          {healthCounts.affected > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
              {showCounts && <span>{healthCounts.affected}</span>}
              Affected
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Full genetics display with categories and expandable sections
 */
export function GeneticsDisplay({
  results,
  mode = "full",
  highlightHealth = true,
  compactLimit = 6,
  className = "",
  title,
  showCategories = true,
}: GeneticsDisplayProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (results.length === 0) {
    return (
      <div className={`text-center py-4 text-secondary ${className}`}>
        <Dna className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No genetic test results available</p>
      </div>
    );
  }

  const grouped = groupByCategory(results);

  // In compact mode, show limited items
  const displayResults = mode === "compact" && !expanded ? results.slice(0, compactLimit) : results;
  const hasMore = mode === "compact" && results.length > compactLimit;

  // Health-highlighted mode: show health first and prominently
  if (highlightHealth && mode === "full") {
    const healthResults = grouped.get("health") || [];
    const otherGroups = new Map(grouped);
    otherGroups.delete("health");

    return (
      <div className={`space-y-4 ${className}`}>
        {title && <h3 className="font-medium flex items-center gap-2"><Dna className="w-4 h-4" />{title}</h3>}

        {/* Health markers section - prominent */}
        {healthResults.length > 0 && (
          <div className="p-4 rounded-lg border border-hairline bg-surface">
            <h4 className={`font-medium flex items-center gap-2 mb-3 ${CATEGORY_CONFIG.health.color}`}>
              {CATEGORY_CONFIG.health.icon}
              Health Screening ({healthResults.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {healthResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-2 rounded ${result.status ? STATUS_CONFIG[result.status].bgColor : "bg-surface-alt"}`}
                >
                  <div className="text-sm font-medium">{result.marker?.commonName || result.markerId}</div>
                  <div className={`text-xs font-mono ${result.status ? STATUS_CONFIG[result.status].color : ""}`}>
                    {getDisplayValue(result)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other categories */}
        {Array.from(otherGroups.entries()).map(([category, categoryResults]) => (
          <div key={category} className="space-y-2">
            {showCategories && (
              <h4 className={`text-sm font-medium flex items-center gap-1.5 ${CATEGORY_CONFIG[category].color}`}>
                {CATEGORY_CONFIG[category].icon}
                {CATEGORY_CONFIG[category].label} ({categoryResults.length})
              </h4>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {categoryResults.map((result) => (
                <div key={result.id} className="p-2 rounded bg-surface-alt">
                  <div className="text-sm font-medium truncate">{result.marker?.commonName || result.markerId}</div>
                  <div className="text-xs font-mono text-secondary">{getDisplayValue(result)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Compact or non-highlighted mode
  return (
    <div className={`space-y-3 ${className}`}>
      {title && <h3 className="font-medium flex items-center gap-2"><Dna className="w-4 h-4" />{title}</h3>}

      <div className="grid grid-cols-2 gap-2">
        {displayResults.map((result) => {
          const category = result.marker?.category || "other";
          return (
            <div
              key={result.id}
              className={`p-2 rounded ${result.status ? STATUS_CONFIG[result.status].bgColor : CATEGORY_CONFIG[category].bgColor}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={CATEGORY_CONFIG[category].color}>
                  {CATEGORY_CONFIG[category].icon}
                </span>
                <span className="text-sm font-medium truncate">{result.marker?.commonName || result.markerId}</span>
              </div>
              <div className={`text-xs font-mono mt-0.5 ${result.status ? STATUS_CONFIG[result.status].color : "text-secondary"}`}>
                {getDisplayValue(result)}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-secondary hover:text-primary flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {results.length - compactLimit} More
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Mini genetics badge for cards and lists
 */
export function GeneticsBadge({ results, className = "" }: { results: AnimalGeneticResult[]; className?: string }) {
  if (results.length === 0) return null;

  const healthResults = results.filter((r) => r.marker?.category === "health");
  const clearCount = healthResults.filter((r) => r.status === "clear").length;

  return (
    <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 ${className}`}>
      <Dna className="w-3 h-3" />
      {clearCount > 0 ? (
        <span>{clearCount} Clear</span>
      ) : (
        <span>{results.length} Tested</span>
      )}
    </div>
  );
}
