// apps/bloodlines/src/pages/ExplorePage.tsx
// Interactive pedigree tree using React Flow - FamilySearch/Geni style
import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
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
  // Fetch all animals (increase limit to get all, sorted by name ascending)
  const res = await fetch(`/api/v1/animals?limit=500&sort=name`, {
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
  const data = await res.json();
  // API returns { pedigree, coi } - we just need the pedigree
  return data.pedigree || null;
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
    <div className="relative" style={{ pointerEvents: "auto" }}>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      {/* FamilySearch-style card */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (animal && onSelect) onSelect(animal);
        }}
        disabled={!animal}
        className="group relative flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-100 cursor-pointer"
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

  // Generation 2: Grandparents - only show if we have actual data
  const grandparents = [
    { id: "sire-sire", animal: root.sire?.sire, parent: "sire", isSire: true, parentAnimal: root.sire },
    { id: "sire-dam", animal: root.sire?.dam, parent: "sire", isSire: false, parentAnimal: root.sire },
    { id: "dam-sire", animal: root.dam?.sire, parent: "dam", isSire: true, parentAnimal: root.dam },
    { id: "dam-dam", animal: root.dam?.dam, parent: "dam", isSire: false, parentAnimal: root.dam },
  ];

  grandparents.forEach((gp, i) => {
    // Only show if parent exists AND this grandparent has data
    if (!gp.parentAnimal || !gp.animal) return;

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

  // Generation 3: Great-grandparents - only show if we have actual data
  const greatGrandparents = [
    { id: "sire-sire-sire", animal: root.sire?.sire?.sire, parent: "sire-sire", parentAnimal: root.sire?.sire },
    { id: "sire-sire-dam", animal: root.sire?.sire?.dam, parent: "sire-sire", parentAnimal: root.sire?.sire },
    { id: "sire-dam-sire", animal: root.sire?.dam?.sire, parent: "sire-dam", parentAnimal: root.sire?.dam },
    { id: "sire-dam-dam", animal: root.sire?.dam?.dam, parent: "sire-dam", parentAnimal: root.sire?.dam },
    { id: "dam-sire-sire", animal: root.dam?.sire?.sire, parent: "dam-sire", parentAnimal: root.dam?.sire },
    { id: "dam-sire-dam", animal: root.dam?.sire?.dam, parent: "dam-sire", parentAnimal: root.dam?.sire },
    { id: "dam-dam-sire", animal: root.dam?.dam?.sire, parent: "dam-dam", parentAnimal: root.dam?.dam },
    { id: "dam-dam-dam", animal: root.dam?.dam?.dam, parent: "dam-dam", parentAnimal: root.dam?.dam },
  ];

  greatGrandparents.forEach((ggp, i) => {
    // Only show if grandparent exists AND this great-grandparent has data
    if (!ggp.parentAnimal || !ggp.animal) return;

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

/* ───────────────── Custom Zoom Controls ───────────────── */

function CustomControlsOverlay() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "#27272a",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    padding: "4px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  };

  const buttonStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    backgroundColor: "transparent",
    border: "none",
    color: "#a1a1aa",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={() => zoomIn()}
        style={buttonStyle}
        title="Zoom in"
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#3f3f46"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
        </svg>
      </button>
      <button
        onClick={() => zoomOut()}
        style={buttonStyle}
        title="Zoom out"
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#3f3f46"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
        </svg>
      </button>
      <button
        onClick={() => fitView({ padding: 0.2 })}
        style={buttonStyle}
        title="Fit view"
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#3f3f46"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
      </button>
    </div>
  );
}

/* ───────────────── Pedigree Tree Component ───────────────── */

interface PedigreeTreeProps {
  root: PedigreeNode;
  onSelectAnimal: (animal: PedigreeNode) => void;
  onExpandAnimal?: (animal: PedigreeNode) => void;
}

function PedigreeTreeInner({ root, onSelectAnimal, onExpandAnimal }: PedigreeTreeProps) {
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
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const animal = (node.data as PedigreeNodeData).animal;
          if (animal) onSelectAnimal(animal);
        }}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.6, maxZoom: 1.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 100, y: 200, zoom: 0.85 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#52525b", strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#27272a" gap={20} size={1} />
      </ReactFlow>
    </>
  );
}

function PedigreeTree(props: PedigreeTreeProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-amber-500/30 bg-zinc-950 relative">
      <ReactFlowProvider>
        <PedigreeTreeInner {...props} />
        <CustomControlsOverlay />
      </ReactFlowProvider>
    </div>
  );
}

/* ───────────────── Animal Details Panel ───────────────── */

interface AnimalPanelProps {
  animal: PedigreeNode;
  onClose: () => void;
  onViewPedigree: (animal: PedigreeNode) => void;
  isLocalAnimal?: boolean; // Whether this animal belongs to the current tenant
  isCurrentRoot?: boolean; // Whether this is the animal currently at the center of the tree
}

function AnimalPanel({ animal, onClose, onViewPedigree, isLocalAnimal = false, isCurrentRoot = false }: AnimalPanelProps) {
  const isMale = animal.sex === "MALE";
  const isFemale = animal.sex === "FEMALE";
  const ringColor = isMale ? "from-sky-400 to-sky-600" : isFemale ? "from-pink-400 to-pink-600" : "from-amber-400 to-amber-600";

  // Format dates nicely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const birthDate = formatDate(animal.dateOfBirth);
  const deathDate = formatDate(animal.dateOfDeath);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[420px] bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl z-50">
      <div className="p-4">
        {/* Header with avatar and name */}
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
            {animal.titleSuffix && (
              <div className="text-xs text-amber-400">{animal.titleSuffix}</div>
            )}
            <div className="flex items-center gap-2 text-sm text-zinc-400 mt-0.5">
              <span className={isMale ? "text-sky-400" : isFemale ? "text-pink-400" : "text-zinc-500"}>
                {isMale ? "♂ Male" : isFemale ? "♀ Female" : "Unknown"}
              </span>
              {animal.breed && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{animal.breed}</span>
                </>
              )}
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

        {/* Details grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {birthDate && (
            <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
              <div className="text-[10px] uppercase text-zinc-500 font-medium">Born</div>
              <div className="text-zinc-200">{birthDate}</div>
            </div>
          )}
          {deathDate && (
            <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
              <div className="text-[10px] uppercase text-zinc-500 font-medium">Died</div>
              <div className="text-zinc-200">{deathDate}</div>
            </div>
          )}
          {!birthDate && !deathDate && (
            <div className="col-span-2 bg-zinc-800/30 rounded-lg px-3 py-2 text-center text-zinc-500 text-xs">
              No date information available
            </div>
          )}
        </div>

        {/* Parent buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => animal.sire && onViewPedigree(animal.sire)}
            disabled={!animal.sire}
            className={`flex-1 p-2 rounded-lg border text-left text-xs ${
              animal.sire
                ? "border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 cursor-pointer"
                : "border-zinc-700 bg-zinc-800/30 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="text-[10px] uppercase text-sky-400 font-medium">Sire</div>
            <div className="text-white truncate">
              {animal.sire?.registeredName || animal.sire?.name || (animal.sireId ? "Not loaded" : "Unknown")}
            </div>
          </button>
          <button
            onClick={() => animal.dam && onViewPedigree(animal.dam)}
            disabled={!animal.dam}
            className={`flex-1 p-2 rounded-lg border text-left text-xs ${
              animal.dam
                ? "border-pink-400/30 bg-pink-400/5 hover:bg-pink-400/10 cursor-pointer"
                : "border-zinc-700 bg-zinc-800/30 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="text-[10px] uppercase text-pink-400 font-medium">Dam</div>
            <div className="text-white truncate">
              {animal.dam?.registeredName || animal.dam?.name || (animal.damId ? "Not loaded" : "Unknown")}
            </div>
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          {/* Only show "Explore Ancestors" if this animal has parents and isn't already the root */}
          {!isCurrentRoot && (animal.sire || animal.dam || animal.sireId || animal.damId) && (
            <Button className="flex-1" size="sm" onClick={() => onViewPedigree(animal)}>
              Explore Ancestors
            </Button>
          )}
          {isLocalAnimal && (
            <Button
              variant={isCurrentRoot || !(animal.sire || animal.dam || animal.sireId || animal.damId) ? "default" : "ghost"}
              className={isCurrentRoot || !(animal.sire || animal.dam || animal.sireId || animal.damId) ? "flex-1" : ""}
              size="sm"
              onClick={() => {
                window.history.pushState(null, "", `/animals/${animal.id}`);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              Full Profile
            </Button>
          )}
          {/* If no actions available, show a message */}
          {isCurrentRoot && !isLocalAnimal && (
            <div className="flex-1 text-center text-sm text-zinc-500 py-2">
              Currently viewing this animal's pedigree
            </div>
          )}
        </div>

        {/* Cross-tenant indicator */}
        {!isLocalAnimal && (
          <div className="mt-2 text-center text-[11px] text-zinc-500">
            Shared from another breeder's records
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Custom Animal Select ───────────────── */

interface AnimalSelectProps {
  animals: AnimalBasic[];
  animalsBySpecies: Record<string, AnimalBasic[]>;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  loading?: boolean;
}

function AnimalSelect({ animalsBySpecies, selectedId, onSelect, loading }: AnimalSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Find selected animal
  const selectedAnimal = React.useMemo(() => {
    if (!selectedId) return null;
    for (const animals of Object.values(animalsBySpecies)) {
      const found = animals.find(a => a.id === selectedId);
      if (found) return found;
    }
    return null;
  }, [selectedId, animalsBySpecies]);

  // Filter animals by search
  const filteredBySpecies = React.useMemo(() => {
    if (!search.trim()) return animalsBySpecies;
    const lower = search.toLowerCase();
    const result: Record<string, AnimalBasic[]> = {};
    for (const [species, animals] of Object.entries(animalsBySpecies)) {
      const filtered = animals.filter(a =>
        (a.name || "").toLowerCase().includes(lower) ||
        (a.registeredName || "").toLowerCase().includes(lower)
      );
      if (filtered.length > 0) result[species] = filtered;
    }
    return result;
  }, [search, animalsBySpecies]);

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="w-96 flex-shrink-0 relative">
      {/* Input styled like BreedSelect */}
      <input
        readOnly
        onClick={() => !loading && setIsOpen(!isOpen)}
        value={loading ? "Loading animals..." : selectedAnimal ? (selectedAnimal.name || `Animal #${selectedAnimal.id}`) : ""}
        placeholder="Search animals..."
        className="w-full h-[42px] rounded-md border border-hairline bg-surface px-3 pr-8 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--hairline))] cursor-pointer"
      />
      {/* Chevron */}
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M5.5 7.5l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface-strong max-h-72 overflow-hidden shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-hairline">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter..."
              className="w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--hairline))]"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {Object.entries(filteredBySpecies).map(([species, animals]) => (
              <div key={species}>
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-500 bg-zinc-800 border-b border-hairline">
                  {species}
                </div>
                {animals.map(animal => (
                  <button
                    key={animal.id}
                    onClick={() => {
                      onSelect(animal.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-surface/60 ${
                      selectedId === animal.id ? "bg-surface/60" : ""
                    }`}
                  >
                    <span className={animal.sex === "MALE" ? "text-sky-400" : animal.sex === "FEMALE" ? "text-pink-400" : "text-secondary"}>
                      {animal.sex === "MALE" ? "♂" : animal.sex === "FEMALE" ? "♀" : "•"}
                    </span>
                    <span className="truncate text-primary">{animal.name || `Animal #${animal.id}`}</span>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(filteredBySpecies).length === 0 && (
              <div className="px-3 py-4 text-sm text-secondary text-center">No animals found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function ExplorePage() {
  const [allAnimals, setAllAnimals] = React.useState<AnimalBasic[]>([]);
  const [loadingAnimals, setLoadingAnimals] = React.useState(true);
  const [selectedAnimalId, setSelectedAnimalId] = React.useState<number | null>(null);
  const [focusAnimal, setFocusAnimal] = React.useState<PedigreeNode | null>(null);
  const [selectedAnimal, setSelectedAnimal] = React.useState<PedigreeNode | null>(null);
  const [loadingPedigree, setLoadingPedigree] = React.useState(false);

  // Load animals on mount
  React.useEffect(() => {
    fetchAllAnimals()
      .then(animals => {
        setAllAnimals(animals);
        setLoadingAnimals(false);
      })
      .catch(err => {
        console.error("Failed to load animals:", err);
        setLoadingAnimals(false);
      });
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

  const handleSelectAnimal = React.useCallback((animal: PedigreeNode) => {
    setSelectedAnimal(animal);
  }, []);

  const handleViewPedigree = React.useCallback((animal: PedigreeNode) => {
    setSelectedAnimal(null);
    setSelectedAnimalId(animal.id);
    loadPedigreeById(animal.id);
  }, [loadPedigreeById]);

  // Handler for expanding a node (loading more ancestors)
  const handleExpandAnimal = React.useCallback(async (animal: PedigreeNode) => {
    setSelectedAnimalId(animal.id);
    loadPedigreeById(animal.id);
  }, [loadPedigreeById]);

  // Group animals by species for the dropdown
  const animalsBySpecies = React.useMemo(() => {
    const grouped: Record<string, AnimalBasic[]> = {};
    allAnimals.forEach(animal => {
      const species = animal.species || "Other";
      if (!grouped[species]) grouped[species] = [];
      grouped[species].push(animal);
    });
    // Sort each group by name
    Object.values(grouped).forEach(list => {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
    return grouped;
  }, [allAnimals]);

  // Use viewport height minus header/footer/padding (~180px total for shell chrome)
  return (
    <div className="p-4 flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
      {/* Header with search - compact */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0 mb-3">
        <PageHeader
          title="Explore Pedigrees"
          subtitle="Pan, zoom, and click to explore ancestry"
        />
        <AnimalSelect
          animals={allAnimals}
          animalsBySpecies={animalsBySpecies}
          selectedId={selectedAnimalId}
          onSelect={(id) => {
            setSelectedAnimalId(id);
            if (id) loadPedigreeById(id);
          }}
          loading={loadingAnimals}
        />
      </div>

      {/* Tree area - fill remaining space */}
      <div className="flex-1 min-h-0 relative" style={{ minHeight: "400px" }}>
        {loadingPedigree ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-xl border border-amber-500/30">
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
                isLocalAnimal={allAnimals.some(a => a.id === selectedAnimal.id)}
                isCurrentRoot={focusAnimal?.id === selectedAnimal.id}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-zinc-900 rounded-xl border border-amber-500/30 overflow-hidden relative">
            {/* Sample pedigree illustration */}
            <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="sampleMaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="sampleFemaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#db2777" stopOpacity="0.1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting lines - curved paths */}
              <g stroke="#3f3f46" strokeWidth="2" fill="none" opacity="0.6">
                {/* Root to parents */}
                <path d="M 200 250 C 280 250, 280 150, 360 150" />
                <path d="M 200 250 C 280 250, 280 350, 360 350" />
                {/* Sire to grandparents */}
                <path d="M 460 150 C 520 150, 520 90, 580 90" />
                <path d="M 460 150 C 520 150, 520 210, 580 210" />
                {/* Dam to grandparents */}
                <path d="M 460 350 C 520 350, 520 290, 580 290" />
                <path d="M 460 350 C 520 350, 520 410, 580 410" />
              </g>

              {/* Root node - "Your Animal" */}
              <g transform="translate(80, 210)" filter="url(#glow)">
                <rect width="120" height="80" rx="8" fill="url(#sampleMaleGrad)" stroke="#f59e0b" strokeWidth="2" opacity="0.9" />
                <circle cx="25" cy="40" r="18" fill="#27272a" stroke="#0ea5e9" strokeWidth="2" />
                <text x="25" y="45" textAnchor="middle" fill="#0ea5e9" fontSize="14" fontWeight="bold">♂</text>
                <text x="70" y="32" textAnchor="start" fill="#a1a1aa" fontSize="10">Your Animal</text>
                <text x="70" y="48" textAnchor="start" fill="#fafafa" fontSize="13" fontWeight="500">Select Above</text>
                <text x="70" y="64" textAnchor="start" fill="#71717a" fontSize="10">to begin</text>
              </g>

              {/* Sire */}
              <g transform="translate(360, 115)">
                <rect width="100" height="70" rx="6" fill="url(#sampleMaleGrad)" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.7" />
                <circle cx="22" cy="35" r="14" fill="#27272a" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x="22" y="40" textAnchor="middle" fill="#0ea5e9" fontSize="12" fontWeight="bold">♂</text>
                <text x="55" y="28" textAnchor="start" fill="#71717a" fontSize="9">SIRE</text>
                <text x="55" y="42" textAnchor="start" fill="#d4d4d8" fontSize="11">Father</text>
                <text x="55" y="56" textAnchor="start" fill="#52525b" fontSize="9">2018</text>
              </g>

              {/* Dam */}
              <g transform="translate(360, 315)">
                <rect width="100" height="70" rx="6" fill="url(#sampleFemaleGrad)" stroke="#ec4899" strokeWidth="1.5" opacity="0.7" />
                <circle cx="22" cy="35" r="14" fill="#27272a" stroke="#ec4899" strokeWidth="1.5" />
                <text x="22" y="40" textAnchor="middle" fill="#ec4899" fontSize="12" fontWeight="bold">♀</text>
                <text x="55" y="28" textAnchor="start" fill="#71717a" fontSize="9">DAM</text>
                <text x="55" y="42" textAnchor="start" fill="#d4d4d8" fontSize="11">Mother</text>
                <text x="55" y="56" textAnchor="start" fill="#52525b" fontSize="9">2019</text>
              </g>

              {/* Paternal Grandsire */}
              <g transform="translate(580, 60)" opacity="0.5">
                <rect width="90" height="60" rx="5" fill="url(#sampleMaleGrad)" stroke="#0ea5e9" strokeWidth="1" />
                <circle cx="18" cy="30" r="11" fill="#27272a" stroke="#0ea5e9" strokeWidth="1" />
                <text x="18" y="34" textAnchor="middle" fill="#0ea5e9" fontSize="10">♂</text>
                <text x="48" y="26" textAnchor="start" fill="#52525b" fontSize="8">GRANDSIRE</text>
                <text x="48" y="40" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandfather</text>
              </g>

              {/* Paternal Granddam */}
              <g transform="translate(580, 180)" opacity="0.5">
                <rect width="90" height="60" rx="5" fill="url(#sampleFemaleGrad)" stroke="#ec4899" strokeWidth="1" />
                <circle cx="18" cy="30" r="11" fill="#27272a" stroke="#ec4899" strokeWidth="1" />
                <text x="18" y="34" textAnchor="middle" fill="#ec4899" fontSize="10">♀</text>
                <text x="48" y="26" textAnchor="start" fill="#52525b" fontSize="8">GRANDDAM</text>
                <text x="48" y="40" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandmother</text>
              </g>

              {/* Maternal Grandsire */}
              <g transform="translate(580, 260)" opacity="0.5">
                <rect width="90" height="60" rx="5" fill="url(#sampleMaleGrad)" stroke="#0ea5e9" strokeWidth="1" />
                <circle cx="18" cy="30" r="11" fill="#27272a" stroke="#0ea5e9" strokeWidth="1" />
                <text x="18" y="34" textAnchor="middle" fill="#0ea5e9" fontSize="10">♂</text>
                <text x="48" y="26" textAnchor="start" fill="#52525b" fontSize="8">GRANDSIRE</text>
                <text x="48" y="40" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandfather</text>
              </g>

              {/* Maternal Granddam */}
              <g transform="translate(580, 380)" opacity="0.5">
                <rect width="90" height="60" rx="5" fill="url(#sampleFemaleGrad)" stroke="#ec4899" strokeWidth="1" />
                <circle cx="18" cy="30" r="11" fill="#27272a" stroke="#ec4899" strokeWidth="1" />
                <text x="18" y="34" textAnchor="middle" fill="#ec4899" fontSize="10">♀</text>
                <text x="48" y="26" textAnchor="start" fill="#52525b" fontSize="8">GRANDDAM</text>
                <text x="48" y="40" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandmother</text>
              </g>

              {/* Fade-out indicators for more generations */}
              <g transform="translate(700, 90)" opacity="0.25">
                <rect width="60" height="40" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
                <text x="30" y="24" textAnchor="middle" fill="#52525b" fontSize="8">...</text>
              </g>
              <g transform="translate(700, 210)" opacity="0.25">
                <rect width="60" height="40" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
                <text x="30" y="24" textAnchor="middle" fill="#52525b" fontSize="8">...</text>
              </g>
              <g transform="translate(700, 290)" opacity="0.25">
                <rect width="60" height="40" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
                <text x="30" y="24" textAnchor="middle" fill="#52525b" fontSize="8">...</text>
              </g>
              <g transform="translate(700, 410)" opacity="0.25">
                <rect width="60" height="40" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
                <text x="30" y="24" textAnchor="middle" fill="#52525b" fontSize="8">...</text>
              </g>
            </svg>

            {/* Overlay with call to action */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Explore Ancestry</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Select an animal from the dropdown to explore their pedigree
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Males
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span> Females
                  </span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
    </div>
  );
}
