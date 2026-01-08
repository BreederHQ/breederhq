// apps/breeding/src/components/PedigreeGeneticsView.tsx
import * as React from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, HelpCircle, Dna } from "lucide-react";

/**
 * Pedigree Genetics View - Shows genetic information across a pedigree tree.
 * Tracks how traits flow through generations and identifies carriers.
 */

type GeneticStatus = "clear" | "carrier" | "affected" | "unknown";

type PedigreeLocus = {
  locus: string;
  locusName: string;
  genotype?: string;
  status: GeneticStatus;
};

type PedigreeAnimal = {
  id: number;
  name: string;
  registrationNumber?: string;
  sex: "M" | "F";
  birthDate?: string;
  coatColor?: PedigreeLocus[];
  health?: PedigreeLocus[];
  coatType?: PedigreeLocus[];
  physicalTraits?: PedigreeLocus[];
  sireId?: number;
  damId?: number;
};

type PedigreeNode = {
  animal: PedigreeAnimal;
  sire?: PedigreeNode;
  dam?: PedigreeNode;
  generation: number;
};

interface PedigreeGeneticsViewProps {
  /** The root animal (usually the prospective offspring or selected animal) */
  rootAnimal?: PedigreeAnimal;
  /** Full pedigree tree data */
  pedigree?: PedigreeNode;
  /** Number of generations to display */
  generations?: number;
  /** Selected loci to highlight in the pedigree */
  selectedLoci?: string[];
  /** Callback when an animal is clicked */
  onAnimalClick?: (animal: PedigreeAnimal) => void;
  /** Additional CSS classes */
  className?: string;
}

// Sample pedigree data for demonstration
const SAMPLE_PEDIGREE: PedigreeNode = {
  animal: {
    id: 1,
    name: "Future Puppy",
    sex: "M",
    coatColor: [
      { locus: "E", locusName: "Extension", genotype: "E/e", status: "carrier" },
      { locus: "K", locusName: "Dominant Black", genotype: "K/k", status: "carrier" },
      { locus: "A", locusName: "Agouti", genotype: "ay/at", status: "carrier" },
    ],
    health: [
      { locus: "DM", locusName: "Degenerative Myelopathy", genotype: "N/N", status: "clear" },
      { locus: "MDR1", locusName: "Multi-Drug Resistance", genotype: "N/M", status: "carrier" },
    ],
  },
  generation: 0,
  sire: {
    animal: {
      id: 2,
      name: "Champion Max",
      sex: "M",
      registrationNumber: "AKC12345",
      coatColor: [
        { locus: "E", locusName: "Extension", genotype: "E/E", status: "clear" },
        { locus: "K", locusName: "Dominant Black", genotype: "K/K", status: "clear" },
      ],
      health: [
        { locus: "DM", locusName: "Degenerative Myelopathy", genotype: "N/N", status: "clear" },
        { locus: "MDR1", locusName: "Multi-Drug Resistance", genotype: "N/M", status: "carrier" },
      ],
    },
    generation: 1,
    sire: {
      animal: {
        id: 4,
        name: "GCH Duke",
        sex: "M",
        coatColor: [
          { locus: "E", locusName: "Extension", genotype: "E/e", status: "carrier" },
        ],
        health: [
          { locus: "DM", locusName: "Degenerative Myelopathy", genotype: "N/N", status: "clear" },
        ],
      },
      generation: 2,
    },
    dam: {
      animal: {
        id: 5,
        name: "Princess Belle",
        sex: "F",
        coatColor: [
          { locus: "E", locusName: "Extension", genotype: "E/E", status: "clear" },
        ],
        health: [
          { locus: "MDR1", locusName: "Multi-Drug Resistance", genotype: "M/M", status: "affected" },
        ],
      },
      generation: 2,
    },
  },
  dam: {
    animal: {
      id: 3,
      name: "Sweet Luna",
      sex: "F",
      registrationNumber: "AKC67890",
      coatColor: [
        { locus: "E", locusName: "Extension", genotype: "E/e", status: "carrier" },
        { locus: "K", locusName: "Dominant Black", genotype: "k/k", status: "clear" },
        { locus: "A", locusName: "Agouti", genotype: "ay/at", status: "carrier" },
      ],
      health: [
        { locus: "DM", locusName: "Degenerative Myelopathy", genotype: "N/N", status: "clear" },
        { locus: "MDR1", locusName: "Multi-Drug Resistance", genotype: "N/N", status: "clear" },
      ],
    },
    generation: 1,
    sire: {
      animal: {
        id: 6,
        name: "Rocky",
        sex: "M",
        health: [
          { locus: "DM", locusName: "Degenerative Myelopathy", status: "unknown" },
        ],
      },
      generation: 2,
    },
    dam: {
      animal: {
        id: 7,
        name: "Lady",
        sex: "F",
        coatColor: [
          { locus: "E", locusName: "Extension", genotype: "e/e", status: "affected" },
        ],
      },
      generation: 2,
    },
  },
};

// Status colors and icons
const statusConfig: Record<GeneticStatus, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  clear: {
    color: "text-green-600",
    bgColor: "bg-green-500/10 border-green-500/30",
    icon: <CheckCircle className="w-3 h-3" />,
    label: "Clear",
  },
  carrier: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    icon: <AlertTriangle className="w-3 h-3" />,
    label: "Carrier",
  },
  affected: {
    color: "text-red-600",
    bgColor: "bg-red-500/10 border-red-500/30",
    icon: <AlertTriangle className="w-3 h-3" />,
    label: "Affected",
  },
  unknown: {
    color: "text-gray-500",
    bgColor: "bg-gray-500/10 border-gray-500/30",
    icon: <HelpCircle className="w-3 h-3" />,
    label: "Unknown",
  },
};

// Individual animal card in pedigree
function PedigreeAnimalCard({
  animal,
  generation,
  selectedLoci = [],
  expanded,
  onToggle,
  onClick,
}: {
  animal: PedigreeAnimal;
  generation: number;
  selectedLoci?: string[];
  expanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}) {
  // Combine all loci for display
  const allLoci = [
    ...(animal.coatColor || []),
    ...(animal.health || []),
    ...(animal.coatType || []),
    ...(animal.physicalTraits || []),
  ];

  // Filter to selected loci if specified
  const displayLoci = selectedLoci.length > 0
    ? allLoci.filter((l) => selectedLoci.includes(l.locus))
    : allLoci;

  // Get worst status for summary
  const getWorstStatus = (): GeneticStatus => {
    if (displayLoci.some((l) => l.status === "affected")) return "affected";
    if (displayLoci.some((l) => l.status === "carrier")) return "carrier";
    if (displayLoci.some((l) => l.status === "unknown")) return "unknown";
    return "clear";
  };

  const worstStatus = getWorstStatus();
  const config = statusConfig[worstStatus];

  // Size decreases with generation
  const sizeClass = generation === 0 ? "min-w-[180px]" : generation === 1 ? "min-w-[150px]" : "min-w-[120px]";

  return (
    <div
      className={`
        ${sizeClass} rounded-lg border transition-all
        ${config.bgColor}
        ${onClick ? "cursor-pointer hover:shadow-md" : ""}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-2 border-b border-inherit">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-lg ${animal.sex === "M" ? "" : ""}`}>
              {animal.sex === "M" ? "♂" : "♀"}
            </span>
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{animal.name}</div>
              {animal.registrationNumber && (
                <div className="text-[10px] text-secondary truncate">{animal.registrationNumber}</div>
              )}
            </div>
          </div>
          {displayLoci.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="p-1 hover:bg-black/5 rounded"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-secondary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-secondary" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Genetic summary (always visible) */}
      <div className="p-2">
        {displayLoci.length === 0 ? (
          <div className="text-xs text-secondary italic">No genetic data</div>
        ) : !expanded ? (
          <div className="flex items-center gap-1 text-xs">
            <span className={config.color}>{config.icon}</span>
            <span className={config.color}>{config.label}</span>
            <span className="text-secondary">({displayLoci.length} loci)</span>
          </div>
        ) : (
          <div className="space-y-1">
            {displayLoci.map((locus, idx) => {
              const locusConfig = statusConfig[locus.status];
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between text-xs p-1 rounded ${locusConfig.bgColor}`}
                >
                  <span className="font-mono font-medium">{locus.locus}</span>
                  <div className="flex items-center gap-1">
                    {locus.genotype && (
                      <span className="font-mono text-secondary">{locus.genotype}</span>
                    )}
                    <span className={locusConfig.color}>{locusConfig.icon}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Recursive pedigree tree component
function PedigreeTree({
  node,
  selectedLoci,
  expandedNodes,
  toggleNode,
  onAnimalClick,
  maxGeneration,
}: {
  node: PedigreeNode;
  selectedLoci: string[];
  expandedNodes: Set<number>;
  toggleNode: (id: number) => void;
  onAnimalClick?: (animal: PedigreeAnimal) => void;
  maxGeneration: number;
}) {
  if (node.generation > maxGeneration) return null;

  const hasParents = node.sire || node.dam;

  return (
    <div className="flex items-center gap-4">
      {/* Current animal */}
      <PedigreeAnimalCard
        animal={node.animal}
        generation={node.generation}
        selectedLoci={selectedLoci}
        expanded={expandedNodes.has(node.animal.id)}
        onToggle={() => toggleNode(node.animal.id)}
        onClick={onAnimalClick ? () => onAnimalClick(node.animal) : undefined}
      />

      {/* Parents */}
      {hasParents && node.generation < maxGeneration && (
        <div className="flex flex-col gap-2">
          {/* Sire branch */}
          {node.sire && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-hairline" />
              <PedigreeTree
                node={node.sire}
                selectedLoci={selectedLoci}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                onAnimalClick={onAnimalClick}
                maxGeneration={maxGeneration}
              />
            </div>
          )}
          {/* Dam branch */}
          {node.dam && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-hairline" />
              <PedigreeTree
                node={node.dam}
                selectedLoci={selectedLoci}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                onAnimalClick={onAnimalClick}
                maxGeneration={maxGeneration}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Locus filter selector
function LocusFilter({
  availableLoci,
  selectedLoci,
  onToggleLocus,
}: {
  availableLoci: Array<{ locus: string; locusName: string; category: string }>;
  selectedLoci: string[];
  onToggleLocus: (locus: string) => void;
}) {
  // Group by category
  const grouped = React.useMemo(() => {
    const groups: Record<string, Array<{ locus: string; locusName: string }>> = {};
    for (const l of availableLoci) {
      if (!groups[l.category]) groups[l.category] = [];
      groups[l.category].push({ locus: l.locus, locusName: l.locusName });
    }
    return groups;
  }, [availableLoci]);

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([category, loci]) => (
        <div key={category}>
          <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1">
            {category}
          </div>
          <div className="flex flex-wrap gap-1">
            {loci.map((l) => (
              <button
                key={l.locus}
                onClick={() => onToggleLocus(l.locus)}
                className={`
                  px-2 py-1 text-xs rounded-full border transition-all
                  ${selectedLoci.includes(l.locus)
                    ? "bg-accent text-white border-accent"
                    : "bg-surface border-hairline hover:border-accent"
                  }
                `}
                title={l.locusName}
              >
                {l.locus}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Extract all unique loci from pedigree
function extractAllLoci(node: PedigreeNode | undefined): Array<{ locus: string; locusName: string; category: string }> {
  if (!node) return [];

  const loci: Array<{ locus: string; locusName: string; category: string }> = [];
  const seen = new Set<string>();

  const addLoci = (arr: PedigreeLocus[] | undefined, category: string) => {
    if (!arr) return;
    for (const l of arr) {
      if (!seen.has(l.locus)) {
        seen.add(l.locus);
        loci.push({ locus: l.locus, locusName: l.locusName, category });
      }
    }
  };

  const traverse = (n: PedigreeNode | undefined) => {
    if (!n) return;
    addLoci(n.animal.coatColor, "Coat Color");
    addLoci(n.animal.health, "Health");
    addLoci(n.animal.coatType, "Coat Type");
    addLoci(n.animal.physicalTraits, "Physical Traits");
    traverse(n.sire);
    traverse(n.dam);
  };

  traverse(node);
  return loci;
}

// Main component
export default function PedigreeGeneticsView({
  rootAnimal,
  pedigree = SAMPLE_PEDIGREE,
  generations = 3,
  selectedLoci: initialSelectedLoci = [],
  onAnimalClick,
  className = "",
}: PedigreeGeneticsViewProps) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<number>>(new Set([pedigree.animal.id]));
  const [selectedLoci, setSelectedLoci] = React.useState<string[]>(initialSelectedLoci);
  const [showFilters, setShowFilters] = React.useState(false);

  // Extract all available loci from pedigree
  const availableLoci = React.useMemo(() => extractAllLoci(pedigree), [pedigree]);

  const toggleNode = React.useCallback((id: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleLocus = React.useCallback((locus: string) => {
    setSelectedLoci((prev) =>
      prev.includes(locus) ? prev.filter((l) => l !== locus) : [...prev, locus]
    );
  }, []);

  const expandAll = React.useCallback(() => {
    const ids: number[] = [];
    const traverse = (n: PedigreeNode | undefined) => {
      if (!n) return;
      ids.push(n.animal.id);
      traverse(n.sire);
      traverse(n.dam);
    };
    traverse(pedigree);
    setExpandedNodes(new Set(ids));
  }, [pedigree]);

  const collapseAll = React.useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return (
    <div className={`rounded-xl border border-hairline bg-surface ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Dna className="w-5 h-5 text-accent" />
              Pedigree Genetics View
            </h3>
            <p className="text-sm text-secondary mt-0.5">
              Track genetic traits across {generations} generations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                ${showFilters ? "bg-accent text-white border-accent" : "border-hairline hover:border-accent"}
              `}
            >
              {showFilters ? "Hide Filters" : "Filter Loci"}
            </button>
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs text-secondary hover:text-primary border border-hairline rounded-lg"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs text-secondary hover:text-primary border border-hairline rounded-lg"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Locus filters */}
        {showFilters && availableLoci.length > 0 && (
          <div className="mt-4 p-3 bg-surface-alt rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Filter by Locus</span>
              {selectedLoci.length > 0 && (
                <button
                  onClick={() => setSelectedLoci([])}
                  className="text-xs text-accent hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <LocusFilter
              availableLoci={availableLoci}
              selectedLoci={selectedLoci}
              onToggleLocus={toggleLocus}
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-hairline bg-surface-alt">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-secondary font-medium">Legend:</span>
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1">
              <span className={config.color}>{config.icon}</span>
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pedigree Tree */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-max">
          <PedigreeTree
            node={pedigree}
            selectedLoci={selectedLoci}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            onAnimalClick={onAnimalClick}
            maxGeneration={generations - 1}
          />
        </div>
      </div>

      {/* Carrier Analysis */}
      <div className="p-4 border-t border-hairline">
        <h4 className="text-sm font-bold mb-2">Carrier Flow Analysis</h4>
        <div className="text-xs text-secondary space-y-1">
          {availableLoci
            .filter((l) => selectedLoci.length === 0 || selectedLoci.includes(l.locus))
            .slice(0, 5)
            .map((locus) => {
              // Find carriers in pedigree
              const carriers: string[] = [];
              const affected: string[] = [];
              const traverse = (n: PedigreeNode | undefined) => {
                if (!n) return;
                const allLoci = [
                  ...(n.animal.coatColor || []),
                  ...(n.animal.health || []),
                ];
                const match = allLoci.find((l) => l.locus === locus.locus);
                if (match?.status === "carrier") carriers.push(n.animal.name);
                if (match?.status === "affected") affected.push(n.animal.name);
                traverse(n.sire);
                traverse(n.dam);
              };
              traverse(pedigree);

              if (carriers.length === 0 && affected.length === 0) return null;

              return (
                <div key={locus.locus} className="flex items-start gap-2">
                  <span className="font-mono font-medium w-12">{locus.locus}:</span>
                  <div>
                    {carriers.length > 0 && (
                      <span className="text-yellow-600">
                        Carriers: {carriers.join(", ")}
                      </span>
                    )}
                    {affected.length > 0 && (
                      <span className="text-red-600 ml-2">
                        Affected: {affected.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      </div>

      {/* Educational note */}
      <div className="p-4 border-t border-hairline bg-surface-alt rounded-b-xl">
        <div className="flex items-start gap-2 text-xs text-secondary">
          <Dna className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
          <p>
            <strong>Tip:</strong> Use the locus filters to track specific genes through the pedigree.
            Carriers are highlighted in yellow, affected individuals in red. This helps identify
            where genetic conditions originated and plan breedings to reduce carrier frequency.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Export types for use elsewhere
 */
export type { PedigreeAnimal, PedigreeNode, PedigreeLocus, GeneticStatus };
