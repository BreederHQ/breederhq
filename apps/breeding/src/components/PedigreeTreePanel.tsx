// apps/breeding/src/components/PedigreeTreePanel.tsx
import * as React from "react";
import { ChevronRight, ChevronDown, User, Loader2, AlertCircle, Dna } from "lucide-react";

type GeneticLocus = {
  locus: string;
  locusName?: string;
  genotype?: string;
  allele1?: string;
  allele2?: string;
  status?: "clear" | "carrier" | "affected" | "unknown";
};

type PedigreeAnimal = {
  id: number;
  name: string;
  species?: string;
  breed?: string | null;
  sex: string;
  birthDate?: string | null;
  registrationNumber?: string | null;
  coatColor?: GeneticLocus[];
  health?: GeneticLocus[];
  coatType?: GeneticLocus[];
  sireId?: number | null;
  damId?: number | null;
};

type PedigreeNode = {
  animal: PedigreeAnimal;
  sire?: PedigreeNode | null;
  dam?: PedigreeNode | null;
  generation: number;
};

interface PedigreeTreePanelProps {
  /** The root animal to show pedigree for */
  animalId: number | string | null;
  /** Animal name (for display while loading) */
  animalName?: string;
  /** Number of generations to fetch */
  generations?: number;
  /** Loci to highlight in the tree */
  highlightLoci?: string[];
  /** Callback when clicking an ancestor */
  onAnimalClick?: (animal: PedigreeAnimal) => void;
}

// Status colors for genetic loci
const STATUS_COLORS = {
  clear: "bg-green-500/10 text-green-600 border-green-500/30",
  carrier: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  affected: "bg-red-500/10 text-red-600 border-red-500/30",
  unknown: "bg-surface-alt text-secondary",
};

export function PedigreeTreePanel({
  animalId,
  animalName,
  generations = 4,
  highlightLoci = [],
  onAnimalClick,
}: PedigreeTreePanelProps) {
  const [pedigree, setPedigree] = React.useState<PedigreeNode | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = React.useState<Set<number>>(new Set());
  const [selectedLoci, setSelectedLoci] = React.useState<Set<string>>(new Set(highlightLoci));

  // Fetch pedigree data
  React.useEffect(() => {
    if (!animalId) {
      setPedigree(null);
      return;
    }

    const fetchPedigree = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch root animal with genetics
        const rootRes = await fetch(`/api/v1/animals/${animalId}`, {
          credentials: "include",
        });
        if (!rootRes.ok) throw new Error("Failed to load animal");
        const rootAnimal = await rootRes.json();

        // Fetch genetics
        const geneticsRes = await fetch(`/api/v1/animals/${animalId}/genetics`, {
          credentials: "include",
        });
        let genetics: any = {};
        if (geneticsRes.ok) {
          genetics = await geneticsRes.json();
        }

        // Build root node
        const rootNode: PedigreeNode = {
          animal: {
            id: rootAnimal.id,
            name: rootAnimal.name,
            species: rootAnimal.species,
            breed: rootAnimal.breed,
            sex: rootAnimal.sex,
            birthDate: rootAnimal.birthDate,
            registrationNumber: rootAnimal.registrationNumber,
            sireId: rootAnimal.sireId,
            damId: rootAnimal.damId,
            coatColor: genetics.coatColor || [],
            health: genetics.health || [],
            coatType: genetics.coatType || [],
          },
          generation: 0,
        };

        // Recursively fetch ancestors
        await fetchAncestors(rootNode, 1, generations);

        setPedigree(rootNode);

        // Auto-expand first 2 generations
        const toExpand = new Set<number>();
        const collectIds = (node: PedigreeNode, maxGen: number) => {
          if (node.generation < maxGen) {
            toExpand.add(node.animal.id);
            if (node.sire) collectIds(node.sire, maxGen);
            if (node.dam) collectIds(node.dam, maxGen);
          }
        };
        collectIds(rootNode, 2);
        setExpandedNodes(toExpand);
      } catch (err) {
        console.error("Failed to load pedigree:", err);
        setError("Failed to load pedigree data");
      } finally {
        setLoading(false);
      }
    };

    fetchPedigree();
  }, [animalId, generations]);

  // Fetch ancestors recursively
  const fetchAncestors = async (node: PedigreeNode, currentGen: number, maxGen: number) => {
    if (currentGen > maxGen) return;

    const { sireId, damId } = node.animal;

    // Fetch sire
    if (sireId) {
      try {
        const sireRes = await fetch(`/api/v1/animals/${sireId}`, { credentials: "include" });
        if (sireRes.ok) {
          const sire = await sireRes.json();

          // Fetch sire genetics
          const geneticsRes = await fetch(`/api/v1/animals/${sireId}/genetics`, { credentials: "include" });
          let genetics: any = {};
          if (geneticsRes.ok) {
            genetics = await geneticsRes.json();
          }

          node.sire = {
            animal: {
              id: sire.id,
              name: sire.name,
              species: sire.species,
              breed: sire.breed,
              sex: sire.sex,
              birthDate: sire.birthDate,
              registrationNumber: sire.registrationNumber,
              sireId: sire.sireId,
              damId: sire.damId,
              coatColor: genetics.coatColor || [],
              health: genetics.health || [],
              coatType: genetics.coatType || [],
            },
            generation: currentGen,
          };

          await fetchAncestors(node.sire, currentGen + 1, maxGen);
        }
      } catch (err) {
        console.debug(`Failed to fetch sire ${sireId}`);
      }
    }

    // Fetch dam
    if (damId) {
      try {
        const damRes = await fetch(`/api/v1/animals/${damId}`, { credentials: "include" });
        if (damRes.ok) {
          const dam = await damRes.json();

          // Fetch dam genetics
          const geneticsRes = await fetch(`/api/v1/animals/${damId}/genetics`, { credentials: "include" });
          let genetics: any = {};
          if (geneticsRes.ok) {
            genetics = await geneticsRes.json();
          }

          node.dam = {
            animal: {
              id: dam.id,
              name: dam.name,
              species: dam.species,
              breed: dam.breed,
              sex: dam.sex,
              birthDate: dam.birthDate,
              registrationNumber: dam.registrationNumber,
              sireId: dam.sireId,
              damId: dam.damId,
              coatColor: genetics.coatColor || [],
              health: genetics.health || [],
              coatType: genetics.coatType || [],
            },
            generation: currentGen,
          };

          await fetchAncestors(node.dam, currentGen + 1, maxGen);
        }
      } catch (err) {
        console.debug(`Failed to fetch dam ${damId}`);
      }
    }
  };

  // Get all unique loci in the pedigree
  const allLoci = React.useMemo(() => {
    const lociSet = new Set<string>();
    const collectLoci = (node: PedigreeNode | null | undefined) => {
      if (!node) return;
      const allGenes = [
        ...(node.animal.coatColor || []),
        ...(node.animal.health || []),
        ...(node.animal.coatType || []),
      ];
      for (const gene of allGenes) {
        if (gene.locus) lociSet.add(gene.locus);
      }
      collectLoci(node.sire);
      collectLoci(node.dam);
    };
    collectLoci(pedigree);
    return Array.from(lociSet).sort();
  }, [pedigree]);

  // Toggle node expansion
  const toggleExpand = (id: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle locus highlighting
  const toggleLocus = (locus: string) => {
    setSelectedLoci((prev) => {
      const next = new Set(prev);
      if (next.has(locus)) {
        next.delete(locus);
      } else {
        next.add(locus);
      }
      return next;
    });
  };

  // Render a single animal node
  const renderNode = (node: PedigreeNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.sire || node.dam;
    const isExpanded = expandedNodes.has(node.animal.id);
    const isMale = node.animal.sex?.toUpperCase().startsWith("M");

    // Get relevant genetics for highlighting
    const allGenes = [
      ...(node.animal.coatColor || []),
      ...(node.animal.health || []),
      ...(node.animal.coatType || []),
    ];
    const highlightedGenes = selectedLoci.size > 0
      ? allGenes.filter((g) => selectedLoci.has(g.locus))
      : [];

    return (
      <div key={node.animal.id} className="relative">
        {/* Connection line */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 w-4 h-6 border-l-2 border-b-2 border-hairline"
            style={{ marginLeft: "-16px" }}
          />
        )}

        {/* Animal card */}
        <div
          className={`
            rounded-lg border p-3 mb-2 cursor-pointer transition-colors
            ${isMale ? "border-blue-500/30 bg-blue-500/5" : "border-pink-500/30 bg-pink-500/5"}
            hover:shadow-md
          `}
          onClick={() => onAnimalClick?.(node.animal)}
        >
          <div className="flex items-start gap-2">
            {/* Expand toggle */}
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.animal.id);
                }}
                className="p-1 hover:bg-surface rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-secondary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-secondary" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}

            {/* Sex icon */}
            <div className={`p-1 rounded ${isMale ? "bg-blue-500/20" : "bg-pink-500/20"}`}>
              <User className={`w-4 h-4 ${isMale ? "text-blue-600" : "text-pink-600"}`} />
            </div>

            {/* Animal info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-primary truncate">{node.animal.name}</div>
              <div className="text-xs text-secondary">
                {node.animal.breed || "Unknown breed"}
                {node.animal.registrationNumber && ` • ${node.animal.registrationNumber}`}
              </div>

              {/* Highlighted genetics */}
              {highlightedGenes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {highlightedGenes.map((gene) => (
                    <span
                      key={gene.locus}
                      className={`
                        px-1.5 py-0.5 text-xs rounded border
                        ${STATUS_COLORS[gene.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.unknown}
                      `}
                    >
                      {gene.locus}: {gene.genotype || `${gene.allele1}/${gene.allele2}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Generation badge */}
            <div className="text-xs text-secondary bg-surface-alt px-1.5 py-0.5 rounded">
              G{node.generation}
            </div>
          </div>
        </div>

        {/* Children (parents) */}
        {hasChildren && isExpanded && (
          <div className="ml-8 pl-4 border-l-2 border-hairline">
            {node.sire && renderNode(node.sire, depth + 1)}
            {node.dam && renderNode(node.dam, depth + 1)}
          </div>
        )}
      </div>
    );
  };

  if (!animalId) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
        <Dna className="w-12 h-12 mx-auto text-secondary/50 mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">Pedigree Viewer</h3>
        <p className="text-secondary">Select an animal to view its pedigree tree with genetic information.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
        <p className="text-secondary">Loading pedigree for {animalName || "animal"}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-8 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Loci filter */}
      {allLoci.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dna className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary">Highlight Loci</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allLoci.map((locus) => (
              <button
                key={locus}
                onClick={() => toggleLocus(locus)}
                className={`
                  px-2 py-1 text-xs rounded-full border transition-colors
                  ${selectedLoci.has(locus)
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-alt text-secondary border-hairline hover:border-accent"
                  }
                `}
              >
                {locus}
              </button>
            ))}
            {selectedLoci.size > 0 && (
              <button
                onClick={() => setSelectedLoci(new Set())}
                className="px-2 py-1 text-xs text-secondary hover:text-primary"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pedigree tree */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">
            Pedigree: {pedigree?.animal.name}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Expand all
                const all = new Set<number>();
                const collect = (node: PedigreeNode | null | undefined) => {
                  if (!node) return;
                  all.add(node.animal.id);
                  collect(node.sire);
                  collect(node.dam);
                };
                collect(pedigree);
                setExpandedNodes(all);
              }}
              className="px-2 py-1 text-xs bg-surface-alt rounded hover:bg-surface-alt/80 text-secondary"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedNodes(new Set([pedigree?.animal.id || 0]))}
              className="px-2 py-1 text-xs bg-surface-alt rounded hover:bg-surface-alt/80 text-secondary"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-500/20" />
            <span className="text-secondary">Male</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-pink-500 bg-pink-500/20" />
            <span className="text-secondary">Female</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded border ${STATUS_COLORS.clear}`}>Clear</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded border ${STATUS_COLORS.carrier}`}>Carrier</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded border ${STATUS_COLORS.affected}`}>Affected</span>
          </div>
        </div>

        {/* Tree */}
        {pedigree && renderNode(pedigree)}

        {!pedigree && (
          <p className="text-secondary text-center py-8">No pedigree data available</p>
        )}
      </div>
    </div>
  );
}

export default PedigreeTreePanel;
