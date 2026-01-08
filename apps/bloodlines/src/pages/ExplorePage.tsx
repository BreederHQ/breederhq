// apps/bloodlines/src/pages/ExplorePage.tsx
// Interactive pedigree tree using React Flow - FamilySearch/Geni style
import * as React from "react";
import { PageHeader, Button, AsyncAutocomplete, type AutocompleteOption } from "@bhq/ui";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* ───────────────── Types ───────────────── */

interface AnimalBasic {
  id: number;
  name: string | null;
  registeredName: string | null;
  species: string;
  sex: string | null;
  breed: string | null;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  titlePrefix: string | null;
  titleSuffix: string | null;
  sireId: number | null;
  damId: number | null;
}

interface PedigreeNode extends AnimalBasic {
  sire?: PedigreeNode | null;
  dam?: PedigreeNode | null;
}

interface PedigreeNodeData extends Record<string, unknown> {
  animal: PedigreeNode | null;
  isSire?: boolean;
  generation: number;
  isRoot?: boolean;
  hasParents?: boolean;
  onSelect: (animal: PedigreeNode) => void;
  onExpand?: (animal: PedigreeNode) => void;
}

/* ───────────────── API Helpers ───────────────── */

function getApiHeaders(): Record<string, string> {
  const tenantId = (window as any).__BHQ_TENANT_ID__;
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  return {
    "Content-Type": "application/json",
    ...(tenantId ? { "x-tenant-id": String(tenantId) } : {}),
    ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
  };
}

async function fetchAllAnimals(): Promise<AnimalBasic[]> {
  const res = await fetch(`/api/v1/animals?limit=100`, {
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch animals");
  const data = await res.json();
  return data.items || [];
}

async function fetchPedigree(animalId: number, generations: number = 4): Promise<PedigreeNode | null> {
  const res = await fetch(`/api/v1/animals/${animalId}/pedigree?generations=${generations}`, {
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}

/* ───────────────── Custom Node Component ───────────────── */

function PedigreeNodeComponent({ data }: NodeProps<Node<PedigreeNodeData>>) {
  const { animal, isSire, generation, isRoot, hasParents, onSelect, onExpand } = data;

  const isMale = animal?.sex === "MALE";
  const isFemale = animal?.sex === "FEMALE";

  // FamilySearch-style card dimensions
  const cardWidth = generation === 0 ? 160 : generation === 1 ? 140 : generation === 2 ? 130 : 120;
  const avatarSize = generation === 0 ? 48 : generation === 1 ? 40 : 36;

  // Colors - FamilySearch uses green tones, we use gender-specific colors
  const accentColor = animal
    ? isMale
      ? { border: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", text: "#38bdf8" }
      : isFemale
      ? { border: "#ec4899", bg: "rgba(236, 72, 153, 0.1)", text: "#f472b6" }
      : { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", text: "#fbbf24" }
    : { border: "#3f3f46", bg: "rgba(63, 63, 70, 0.3)", text: "#71717a" };

  const displayName = animal?.registeredName || animal?.name || "Unknown";
  const initial = displayName[0]?.toUpperCase() || "?";
  const birthYear = animal?.dateOfBirth
    ? new Date(animal.dateOfBirth).getFullYear().toString()
    : null;
  const deathYear = animal?.dateOfDeath
    ? new Date(animal.dateOfDeath).getFullYear().toString()
    : null;
  const lifespan = birthYear ? (deathYear ? `${birthYear}–${deathYear}` : birthYear) : null;

  // Check if this node can be expanded (has parent IDs but no loaded parent data)
  const canExpand = animal && (animal.sireId || animal.damId) && !hasParents;

  return (
    <div className="relative">
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      {/* FamilySearch-style card */}
      <button
        onClick={() => animal && onSelect(animal)}
        disabled={!animal}
        className="group relative flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
        style={{
          width: cardWidth,
          backgroundColor: isRoot ? "rgba(30, 30, 30, 0.95)" : "rgba(24, 24, 27, 0.9)",
          border: `2px solid ${accentColor.border}`,
          boxShadow: isRoot ? `0 0 20px ${accentColor.border}30` : undefined,
        }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white"
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: accentColor.bg,
            border: `2px solid ${accentColor.border}`,
            fontSize: avatarSize * 0.4,
          }}
        >
          {animal ? initial : "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          {/* Title prefix */}
          {animal?.titlePrefix && (
            <div className="text-[9px] font-bold text-amber-400 leading-tight truncate">
              {animal.titlePrefix}
            </div>
          )}
          {/* Name */}
          <div
            className="font-semibold leading-tight truncate text-white group-hover:text-amber-300 transition-colors"
            style={{ fontSize: generation === 0 ? 12 : 11 }}
          >
            {displayName}
          </div>
          {/* Lifespan */}
          {lifespan && (
            <div className="text-[10px] text-zinc-500 leading-tight">
              {lifespan}
            </div>
          )}
          {/* Gender indicator */}
          <div className="flex items-center gap-1 mt-0.5">
            <span style={{ color: accentColor.text }} className="text-[10px]">
              {isMale ? "♂" : isFemale ? "♀" : ""}
            </span>
            {animal?.breed && (
              <span className="text-[9px] text-zinc-600 truncate">
                {animal.breed}
              </span>
            )}
          </div>
        </div>

        {/* Deceased indicator */}
        {animal?.dateOfDeath && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-800 rounded-full border border-zinc-600 flex items-center justify-center">
            <span className="text-[8px] text-zinc-400">†</span>
          </div>
        )}
      </button>

      {/* Expand button for nodes with unloaded parents */}
      {canExpand && onExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand(animal);
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-colors shadow-lg"
          title="Load more ancestors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
    </div>
  );
}

const nodeTypes = {
  pedigree: PedigreeNodeComponent,
};

/* ───────────────── Build Tree Layout ───────────────── */

// FamilySearch-style horizontal layout: root on left, ancestors to the right
function buildTreeFromPedigree(
  root: PedigreeNode,
  onSelect: (animal: PedigreeNode) => void,
  onExpand?: (animal: PedigreeNode) => void
): { nodes: Node<PedigreeNodeData>[]; edges: Edge[] } {
  const nodes: Node<PedigreeNodeData>[] = [];
  const edges: Edge[] = [];

  // Layout constants - horizontal layout
  const HORIZONTAL_SPACING = 200; // Space between generations (left to right)
  const ROW_HEIGHT = 70; // Vertical spacing between nodes in same generation

  // Calculate y positions for each generation
  // More ancestors = need more vertical spread
  const getVerticalOffset = (gen: number, index: number, totalInGen: number) => {
    const totalHeight = (totalInGen - 1) * ROW_HEIGHT;
    const startY = -totalHeight / 2;
    return startY + index * ROW_HEIGHT;
  };

  // Create nodes for each generation
  const addNode = (
    id: string,
    animal: PedigreeNode | null,
    x: number,
    y: number,
    generation: number,
    isSire?: boolean,
    isRoot?: boolean
  ) => {
    const hasParents = !!(animal?.sire || animal?.dam);
    nodes.push({
      id,
      type: "pedigree",
      position: { x, y },
      data: { animal, generation, isSire, isRoot, hasParents, onSelect, onExpand },
    });
  };

  // Edge style
  const edgeStyle = { stroke: "#52525b", strokeWidth: 1.5 };

  // Generation 0: Root (leftmost)
  addNode("root", root, 0, 0, 0, undefined, true);

  // Generation 1: Parents (2 nodes)
  const gen1Y = getVerticalOffset(1, 0, 2);
  if (root.sire || root.sireId) {
    addNode("sire", root.sire || null, HORIZONTAL_SPACING, gen1Y, 1, true);
    edges.push({ id: "e-root-sire", source: "root", target: "sire", type: "smoothstep", style: edgeStyle });
  }
  if (root.dam || root.damId) {
    addNode("dam", root.dam || null, HORIZONTAL_SPACING, gen1Y + ROW_HEIGHT, 1, false);
    edges.push({ id: "e-root-dam", source: "root", target: "dam", type: "smoothstep", style: edgeStyle });
  }

  // Generation 2: Grandparents (4 nodes)
  const grandparents = [
    { id: "sire-sire", animal: root.sire?.sire || null, parent: "sire", isSire: true, parentAnimal: root.sire },
    { id: "sire-dam", animal: root.sire?.dam || null, parent: "sire", isSire: false, parentAnimal: root.sire },
    { id: "dam-sire", animal: root.dam?.sire || null, parent: "dam", isSire: true, parentAnimal: root.dam },
    { id: "dam-dam", animal: root.dam?.dam || null, parent: "dam", isSire: false, parentAnimal: root.dam },
  ];

  grandparents.forEach((gp, i) => {
    // Only show if parent exists
    if (!gp.parentAnimal && !((i < 2 ? root.sire : root.dam))) return;

    const y = getVerticalOffset(2, i, 4);
    addNode(gp.id, gp.animal, HORIZONTAL_SPACING * 2, y, 2, gp.isSire);
    edges.push({
      id: `e-${gp.parent}-${gp.id}`,
      source: gp.parent,
      target: gp.id,
      type: "smoothstep",
      style: edgeStyle,
    });
  });

  // Generation 3: Great-grandparents (8 nodes)
  const greatGrandparents = [
    { id: "sire-sire-sire", animal: root.sire?.sire?.sire || null, parent: "sire-sire", parentAnimal: root.sire?.sire },
    { id: "sire-sire-dam", animal: root.sire?.sire?.dam || null, parent: "sire-sire", parentAnimal: root.sire?.sire },
    { id: "sire-dam-sire", animal: root.sire?.dam?.sire || null, parent: "sire-dam", parentAnimal: root.sire?.dam },
    { id: "sire-dam-dam", animal: root.sire?.dam?.dam || null, parent: "sire-dam", parentAnimal: root.sire?.dam },
    { id: "dam-sire-sire", animal: root.dam?.sire?.sire || null, parent: "dam-sire", parentAnimal: root.dam?.sire },
    { id: "dam-sire-dam", animal: root.dam?.sire?.dam || null, parent: "dam-sire", parentAnimal: root.dam?.sire },
    { id: "dam-dam-sire", animal: root.dam?.dam?.sire || null, parent: "dam-dam", parentAnimal: root.dam?.dam },
    { id: "dam-dam-dam", animal: root.dam?.dam?.dam || null, parent: "dam-dam", parentAnimal: root.dam?.dam },
  ];

  greatGrandparents.forEach((ggp, i) => {
    // Only show if grandparent exists
    if (!ggp.parentAnimal) return;

    const y = getVerticalOffset(3, i, 8);
    addNode(ggp.id, ggp.animal, HORIZONTAL_SPACING * 3, y, 3, i % 2 === 0);
    edges.push({
      id: `e-${ggp.parent}-${ggp.id}`,
      source: ggp.parent,
      target: ggp.id,
      type: "smoothstep",
      style: edgeStyle,
    });
  });

  return { nodes, edges };
}

/* ───────────────── Pedigree Tree Component ───────────────── */

interface PedigreeTreeProps {
  root: PedigreeNode;
  onSelectAnimal: (animal: PedigreeNode) => void;
  onExpandAnimal?: (animal: PedigreeNode) => void;
}

function PedigreeTree({ root, onSelectAnimal, onExpandAnimal }: PedigreeTreeProps) {
  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(
    () => buildTreeFromPedigree(root, onSelectAnimal, onExpandAnimal),
    [root, onSelectAnimal, onExpandAnimal]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update when root changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildTreeFromPedigree(root, onSelectAnimal, onExpandAnimal);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [root, onSelectAnimal, onExpandAnimal, setNodes, setEdges]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.4, maxZoom: 0.8 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 100, y: 200, zoom: 0.6 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#52525b", strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#1f1f23" gap={24} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-zinc-900 !border-zinc-700 !rounded-lg !shadow-lg [&>button]:!bg-zinc-900 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-800 [&>button:hover]:!text-white"
        />
        <MiniMap
          nodeColor={(node) => {
            const animal = (node.data as PedigreeNodeData).animal;
            if (!animal) return "#3f3f46";
            if (animal.sex === "MALE") return "#0ea5e9";
            if (animal.sex === "FEMALE") return "#ec4899";
            return "#f59e0b";
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-zinc-900 !border-zinc-700 !rounded-lg"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

/* ───────────────── Animal Search (Async) ───────────────── */

// Store for the animals cache to enable search
let animalsCache: AnimalBasic[] = [];

async function searchAnimals(query: string): Promise<AutocompleteOption[]> {
  // If cache is empty, fetch all animals
  if (animalsCache.length === 0) {
    try {
      animalsCache = await fetchAllAnimals();
    } catch (err) {
      console.error("Failed to fetch animals for search:", err);
      return [];
    }
  }

  const q = query.toLowerCase();
  const filtered = animalsCache.filter(a => {
    const name = (a.registeredName || a.name || "").toLowerCase();
    const breed = (a.breed || "").toLowerCase();
    return name.includes(q) || breed.includes(q);
  });

  return filtered.slice(0, 50).map(animal => ({
    id: animal.id,
    label: animal.registeredName || animal.name || `Animal #${animal.id}`,
  }));
}

/* ───────────────── Animal Details Panel ───────────────── */

interface AnimalPanelProps {
  animal: PedigreeNode;
  onClose: () => void;
  onViewPedigree: (animal: PedigreeNode) => void;
}

function AnimalPanel({ animal, onClose, onViewPedigree }: AnimalPanelProps) {
  const isMale = animal.sex === "MALE";
  const isFemale = animal.sex === "FEMALE";
  const ringColor = isMale ? "from-sky-400 to-sky-600" : isFemale ? "from-pink-400 to-pink-600" : "from-amber-400 to-amber-600";

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl z-50">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-full p-[2px] bg-gradient-to-br ${ringColor} flex-shrink-0`}>
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {(animal.registeredName || animal.name || "?")[0].toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {animal.titlePrefix && (
              <div className="text-xs font-bold text-amber-400">{animal.titlePrefix}</div>
            )}
            <h3 className="text-base font-semibold text-white truncate">
              {animal.registeredName || animal.name || "Unknown"}
            </h3>
            <div className="text-sm text-zinc-400">
              {animal.breed || animal.species}
              {animal.dateOfBirth && ` • ${new Date(animal.dateOfBirth).getFullYear()}`}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => animal.sire && onViewPedigree(animal.sire)}
            disabled={!animal.sire}
            className={`flex-1 p-2 rounded-lg border text-left text-xs ${
              animal.sire
                ? "border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10"
                : "border-zinc-700 bg-zinc-800/30 opacity-50"
            }`}
          >
            <div className="text-[10px] uppercase text-sky-400 font-medium">Sire</div>
            <div className="text-white truncate">
              {animal.sire?.registeredName || animal.sire?.name || "Unknown"}
            </div>
          </button>
          <button
            onClick={() => animal.dam && onViewPedigree(animal.dam)}
            disabled={!animal.dam}
            className={`flex-1 p-2 rounded-lg border text-left text-xs ${
              animal.dam
                ? "border-pink-400/30 bg-pink-400/5 hover:bg-pink-400/10"
                : "border-zinc-700 bg-zinc-800/30 opacity-50"
            }`}
          >
            <div className="text-[10px] uppercase text-pink-400 font-medium">Dam</div>
            <div className="text-white truncate">
              {animal.dam?.registeredName || animal.dam?.name || "Unknown"}
            </div>
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button className="flex-1" size="sm" onClick={() => onViewPedigree(animal)}>
            View Pedigree
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.history.pushState(null, "", `/animals/${animal.id}`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function ExplorePage() {
  const [selectedOption, setSelectedOption] = React.useState<AutocompleteOption | null>(null);
  const [focusAnimal, setFocusAnimal] = React.useState<PedigreeNode | null>(null);
  const [selectedAnimal, setSelectedAnimal] = React.useState<PedigreeNode | null>(null);
  const [loadingPedigree, setLoadingPedigree] = React.useState(false);

  // Preload animals cache on mount
  React.useEffect(() => {
    fetchAllAnimals()
      .then(animals => { animalsCache = animals; })
      .catch(console.error);
  }, []);

  const loadPedigreeById = React.useCallback(async (animalId: number) => {
    setLoadingPedigree(true);
    setSelectedAnimal(null);

    try {
      const pedigree = await fetchPedigree(animalId, 4);
      if (pedigree) {
        setFocusAnimal(pedigree);
      }
    } catch (err) {
      console.error("Failed to load pedigree:", err);
    } finally {
      setLoadingPedigree(false);
    }
  }, []);

  const handleAutocompleteChange = React.useCallback((option: AutocompleteOption | null) => {
    setSelectedOption(option);
    if (option) {
      loadPedigreeById(option.id as number);
    }
  }, [loadPedigreeById]);

  const handleSelectAnimal = React.useCallback((animal: PedigreeNode) => {
    setSelectedAnimal(animal);
  }, []);

  const handleViewPedigree = React.useCallback((animal: PedigreeNode) => {
    setSelectedAnimal(null);
    setSelectedOption({ id: animal.id, label: animal.registeredName || animal.name || `Animal #${animal.id}` });
    loadPedigreeById(animal.id);
  }, [loadPedigreeById]);

  // Handler for expanding a node (loading more ancestors)
  const handleExpandAnimal = React.useCallback(async (animal: PedigreeNode) => {
    // Navigate to this animal as the new root
    setSelectedOption({ id: animal.id, label: animal.registeredName || animal.name || `Animal #${animal.id}` });
    loadPedigreeById(animal.id);
  }, [loadPedigreeById]);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header with search */}
      <div className="flex items-start justify-between gap-6">
        <PageHeader
          title="Explore Pedigrees"
          subtitle="Interactive family tree - pan, zoom, and click to explore ancestry"
        />
        <div className="w-80 flex-shrink-0 pt-1">
          <AsyncAutocomplete
            value={selectedOption}
            onChange={handleAutocompleteChange}
            onSearch={searchAnimals}
            placeholder="Search animals..."
          />
        </div>
      </div>

      {/* Tree area - full width */}
      <div className="mt-4 flex-1 min-h-0 relative">
        {loadingPedigree ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
              <div className="text-zinc-400">Loading pedigree...</div>
            </div>
          </div>
        ) : focusAnimal ? (
          <>
            <PedigreeTree
              root={focusAnimal}
              onSelectAnimal={handleSelectAnimal}
              onExpandAnimal={handleExpandAnimal}
            />
            {selectedAnimal && (
              <AnimalPanel
                animal={selectedAnimal}
                onClose={() => setSelectedAnimal(null)}
                onViewPedigree={handleViewPedigree}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="text-center max-w-xs">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-amber-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Explore Ancestry</h3>
                <p className="text-sm text-zinc-500">
                  Select an animal from the dropdown above
                </p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
