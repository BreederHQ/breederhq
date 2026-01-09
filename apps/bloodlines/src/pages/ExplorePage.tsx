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
  const { animal, generation, isRoot, hasParents, onSelect, onExpand, isSire } = data;

  const isMale = animal?.sex === "MALE";
  const isFemale = animal?.sex === "FEMALE";

  // Card dimensions - SCALED UP to match rendered demo appearance
  // The SVG viewbox (800x400) is scaled ~1.5x when rendered to screen
  // Root: 255x165, Parents: 150x105, Grandparents: 180x90, Great-grandparents: 150x75
  const cardWidth = generation === 0 ? 255 : generation === 1 ? 150 : generation === 2 ? 180 : 150;
  const cardHeight = generation === 0 ? 165 : generation === 1 ? 105 : generation === 2 ? 90 : 75;
  const avatarSize = generation === 0 ? 60 : generation === 1 ? 42 : generation === 2 ? 36 : 30;

  // Role labels for nodes (matching demo)
  const roleLabel = isRoot
    ? "YOUR ANIMAL"
    : generation === 1
    ? (isSire ? "SIRE" : "DAM")
    : generation === 2
    ? (isSire ? "GRANDSIRE" : "GRANDDAM")
    : "";

  // Colors matching the SVG illustration gradients
  const colors = isMale
    ? {
        border: "#0ea5e9",
        gradientFrom: "rgba(14, 165, 233, 0.2)",
        gradientTo: "rgba(2, 132, 199, 0.1)",
        text: "#0ea5e9",
        avatarBg: "#27272a"
      }
    : isFemale
    ? {
        border: "#ec4899",
        gradientFrom: "rgba(236, 72, 153, 0.2)",
        gradientTo: "rgba(219, 39, 119, 0.1)",
        text: "#ec4899",
        avatarBg: "#27272a"
      }
    : {
        border: "#f59e0b",
        gradientFrom: "rgba(245, 158, 11, 0.2)",
        gradientTo: "rgba(217, 119, 6, 0.1)",
        text: "#f59e0b",
        avatarBg: "#27272a"
      };

  // Root node gets amber/orange border like the illustration
  // SVG strokeWidth: Root=2, Parents=1.5, Grandparents=1
  const borderColor = isRoot ? "#f59e0b" : colors.border;
  const borderWidth = generation === 0 ? 2 : generation === 1 ? 1.5 : 1;

  const displayName = animal?.registeredName || animal?.name || "Unknown";
  const birthYear = animal?.dateOfBirth
    ? new Date(animal.dateOfBirth).getFullYear().toString()
    : null;

  // Check if this node can be expanded (has parent IDs but no loaded parent data)
  const canExpand = animal && (animal.sireId || animal.damId) && !hasParents;

  return (
    <div className="relative" style={{ pointerEvents: "auto" }}>
      {/* Connection handles - invisible, no dots */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, width: 1, height: 1 }}
      />

      {/* Card matching demo illustration - SCALED for screen render */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (animal && onSelect) onSelect(animal);
        }}
        disabled={!animal}
        className="group relative flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-100 cursor-pointer"
        style={{
          width: cardWidth,
          height: cardHeight,
          padding: generation === 0 ? "18px 20px" : generation === 1 ? "14px 16px" : "12px 14px",
          background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: generation === 0 ? 12 : generation === 1 ? 10 : 8,
          boxShadow: isRoot
            ? `0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(245, 158, 11, 0.2)`
            : `0 4px 20px rgba(0, 0, 0, 0.4)`,
        }}
      >
        {/* Circular avatar with gender symbol - scaled up */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: colors.avatarBg,
            border: `${generation === 0 ? 3 : generation === 1 ? 2 : 2}px solid ${colors.border}`,
          }}
        >
          <span style={{
            color: colors.text,
            fontSize: generation === 0 ? 24 : generation === 1 ? 18 : 15,
            fontWeight: "bold"
          }}>
            {isMale ? "♂" : isFemale ? "♀" : "?"}
          </span>
        </div>

        {/* Info section - text sizes scaled up for readability */}
        <div className="flex-1 min-w-0 text-left">
          {/* Role label (SIRE, DAM, GRANDSIRE, etc.) */}
          {roleLabel && (
            <div
              className="leading-tight mb-0.5"
              style={{
                fontSize: generation === 0 ? 13 : generation === 1 ? 11 : 10,
                color: generation === 0 ? "#a1a1aa" : generation === 1 ? "#71717a" : "#52525b",
                letterSpacing: "0.02em",
              }}
            >
              {roleLabel}
            </div>
          )}
          {/* Title prefix */}
          {animal?.titlePrefix && (
            <div className="text-[11px] font-bold text-amber-400 leading-tight truncate mb-0.5">
              {animal.titlePrefix}
            </div>
          )}
          {/* Name - scaled up for readability */}
          <div
            className="leading-tight truncate group-hover:brightness-110 transition-all"
            style={{
              fontSize: generation === 0 ? 18 : generation === 1 ? 16 : 14,
              fontWeight: generation === 0 ? 500 : 400,
              color: generation === 0 ? "#fafafa" : generation === 1 ? "#d4d4d8" : "#a1a1aa",
            }}
          >
            {displayName}
          </div>
          {/* Year */}
          {birthYear && (
            <div
              className="leading-tight mt-1"
              style={{
                fontSize: generation === 0 ? 14 : generation === 1 ? 13 : 12,
                color: generation === 0 ? "#71717a" : "#52525b",
              }}
            >
              {birthYear}
            </div>
          )}
        </div>

        {/* Deceased indicator */}
        {animal?.dateOfDeath && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 rounded-full border border-zinc-600 flex items-center justify-center shadow-md">
            <span className="text-[10px] text-zinc-400">†</span>
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
        style={{ opacity: 0, width: 1, height: 1 }}
      />
    </div>
  );
}

const nodeTypes = {
  pedigree: PedigreeNodeComponent,
};

/* ───────────────── Build Tree Layout ───────────────── */

// FamilySearch-style horizontal layout: root on left, ancestors to the right
// EXACT layout matching the SVG demo illustration
function buildTreeFromPedigree(
  root: PedigreeNode,
  onSelect: (animal: PedigreeNode) => void,
  onExpand?: (animal: PedigreeNode) => void
): { nodes: Node<PedigreeNodeData>[]; edges: Edge[] } {
  const nodes: Node<PedigreeNodeData>[] = [];
  const edges: Edge[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT SCALED 1.5x from SVG to match rendered demo appearance
  // Original SVG viewBox: 800x400, but rendered larger on screen
  // ═══════════════════════════════════════════════════════════════════════════

  // Card dimensions SCALED 1.5x to match rendered appearance
  const CARD_WIDTHS = [255, 150, 180, 150];   // gen 0, 1, 2, 3
  const CARD_HEIGHTS = [165, 105, 90, 75];    // gen 0, 1, 2, 3

  // X positions SCALED 1.5x
  // Original: Root=0, Parents=290, Grandparents=510
  // Scaled: Root=0, Parents=435, Grandparents=765, Great-grandparents=1020
  const X_GEN0 = 0;
  const X_GEN1 = 435;
  const X_GEN2 = 765;
  const X_GEN3 = 1020;

  // Y positions SCALED 1.5x
  // Original: Sire=0, Dam=160, Root=60
  // Scaled: Sire=0, Dam=240, Root=90
  const Y_ROOT = 90;
  const Y_SIRE = 0;
  const Y_DAM = 240;

  // Grandparent Y positions SCALED 1.5x
  // Original: PGS=-60, PGD=15, MGS=155, MGD=230
  // Scaled: PGS=-90, PGD=22, MGS=232, MGD=345
  const Y_PATERNAL_GRANDSIRE = -90;
  const Y_PATERNAL_GRANDDAM = 22;
  const Y_MATERNAL_GRANDSIRE = 232;
  const Y_MATERNAL_GRANDDAM = 345;

  // Great-grandparent positions
  const gpHeight = CARD_HEIGHTS[2];
  const ggpHeight = CARD_HEIGHTS[3];
  const ggpGap = 12;  // Gap between great-grandparent pairs

  // Helper to add a node
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

  // Edge style - smooth bezier curves matching SVG
  const edgeStyle = { stroke: "#52525b", strokeWidth: 2 };

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD NODES AND EDGES (using EXACT SVG positions)
  // ═══════════════════════════════════════════════════════════════════════════

  // Generation 0: Root (center of tree)
  addNode("root", root, X_GEN0, Y_ROOT, 0, undefined, true);

  // Generation 1: Parents (Sire above, Dam below)
  if (root.sire || root.sireId) {
    addNode("sire", root.sire || null, X_GEN1, Y_SIRE, 1, true);
    edges.push({ id: "e-root-sire", source: "root", target: "sire", type: "default", style: edgeStyle });
  }
  if (root.dam || root.damId) {
    addNode("dam", root.dam || null, X_GEN1, Y_DAM, 1, false);
    edges.push({ id: "e-root-dam", source: "root", target: "dam", type: "default", style: edgeStyle });
  }

  // Generation 2: Grandparents (EXACT positions from SVG)
  if (root.sire?.sire) {
    addNode("sire-sire", root.sire.sire, X_GEN2, Y_PATERNAL_GRANDSIRE, 2, true);
    edges.push({ id: "e-sire-sire-sire", source: "sire", target: "sire-sire", type: "default", style: edgeStyle });
  }
  if (root.sire?.dam) {
    addNode("sire-dam", root.sire.dam, X_GEN2, Y_PATERNAL_GRANDDAM, 2, false);
    edges.push({ id: "e-sire-sire-dam", source: "sire", target: "sire-dam", type: "default", style: edgeStyle });
  }
  if (root.dam?.sire) {
    addNode("dam-sire", root.dam.sire, X_GEN2, Y_MATERNAL_GRANDSIRE, 2, true);
    edges.push({ id: "e-dam-dam-sire", source: "dam", target: "dam-sire", type: "default", style: edgeStyle });
  }
  if (root.dam?.dam) {
    addNode("dam-dam", root.dam.dam, X_GEN2, Y_MATERNAL_GRANDDAM, 2, false);
    edges.push({ id: "e-dam-dam-dam", source: "dam", target: "dam-dam", type: "default", style: edgeStyle });
  }

  // Generation 3: Great-grandparents (calculated from grandparent positions)
  // Each grandparent has 2 great-grandparents stacked vertically
  const calcGGP = (gpY: number, isSire: boolean) => {
    const gpCenter = gpY + gpHeight / 2;
    return isSire
      ? gpCenter - ggpHeight - ggpGap / 2
      : gpCenter + ggpGap / 2;
  };

  if (root.sire?.sire?.sire) {
    addNode("sire-sire-sire", root.sire.sire.sire, X_GEN3, calcGGP(Y_PATERNAL_GRANDSIRE, true), 3, true);
    edges.push({ id: "e-ss-sss", source: "sire-sire", target: "sire-sire-sire", type: "default", style: edgeStyle });
  }
  if (root.sire?.sire?.dam) {
    addNode("sire-sire-dam", root.sire.sire.dam, X_GEN3, calcGGP(Y_PATERNAL_GRANDSIRE, false), 3, false);
    edges.push({ id: "e-ss-ssd", source: "sire-sire", target: "sire-sire-dam", type: "default", style: edgeStyle });
  }
  if (root.sire?.dam?.sire) {
    addNode("sire-dam-sire", root.sire.dam.sire, X_GEN3, calcGGP(Y_PATERNAL_GRANDDAM, true), 3, true);
    edges.push({ id: "e-sd-sds", source: "sire-dam", target: "sire-dam-sire", type: "default", style: edgeStyle });
  }
  if (root.sire?.dam?.dam) {
    addNode("sire-dam-dam", root.sire.dam.dam, X_GEN3, calcGGP(Y_PATERNAL_GRANDDAM, false), 3, false);
    edges.push({ id: "e-sd-sdd", source: "sire-dam", target: "sire-dam-dam", type: "default", style: edgeStyle });
  }
  if (root.dam?.sire?.sire) {
    addNode("dam-sire-sire", root.dam.sire.sire, X_GEN3, calcGGP(Y_MATERNAL_GRANDSIRE, true), 3, true);
    edges.push({ id: "e-ds-dss", source: "dam-sire", target: "dam-sire-sire", type: "default", style: edgeStyle });
  }
  if (root.dam?.sire?.dam) {
    addNode("dam-sire-dam", root.dam.sire.dam, X_GEN3, calcGGP(Y_MATERNAL_GRANDSIRE, false), 3, false);
    edges.push({ id: "e-ds-dsd", source: "dam-sire", target: "dam-sire-dam", type: "default", style: edgeStyle });
  }
  if (root.dam?.dam?.sire) {
    addNode("dam-dam-sire", root.dam.dam.sire, X_GEN3, calcGGP(Y_MATERNAL_GRANDDAM, true), 3, true);
    edges.push({ id: "e-dd-dds", source: "dam-dam", target: "dam-dam-sire", type: "default", style: edgeStyle });
  }
  if (root.dam?.dam?.dam) {
    addNode("dam-dam-dam", root.dam.dam.dam, X_GEN3, calcGGP(Y_MATERNAL_GRANDDAM, false), 3, false);
    edges.push({ id: "e-dd-ddd", source: "dam-dam", target: "dam-dam-dam", type: "default", style: edgeStyle });
  }

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
        fitViewOptions={{ padding: 0.2, minZoom: 0.8, maxZoom: 1.5 }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={{
          type: "default",
          style: { stroke: "#52525b", strokeWidth: 2 },
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
            <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="sampleMaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="sampleFemaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#db2777" stopOpacity="0.1" />
                </linearGradient>
                {/* Animated glow filter for root node */}
                <filter id="rootGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur">
                    <animate attributeName="stdDeviation" values="3;6;3" dur="2s" repeatCount="indefinite" />
                  </feGaussianBlur>
                  <feFlood floodColor="#f59e0b" result="color">
                    <animate attributeName="floodOpacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                  </feFlood>
                  <feComposite in="color" in2="blur" operator="in" result="glow"/>
                  <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting lines - draw outward from root */}
              <g stroke="#52525b" strokeWidth="2" fill="none">
                {/* Root to Sire - draws first */}
                <path d="M 205 200 C 275 200, 275 120, 345 120" strokeDasharray="200" strokeDashoffset="200">
                  <animate attributeName="stroke-dashoffset" from="200" to="0" dur="0.8s" begin="0.3s" fill="freeze" />
                </path>
                {/* Root to Dam - draws first */}
                <path d="M 205 200 C 275 200, 275 280, 345 280" strokeDasharray="200" strokeDashoffset="200">
                  <animate attributeName="stroke-dashoffset" from="200" to="0" dur="0.8s" begin="0.3s" fill="freeze" />
                </path>
                {/* Sire to Paternal Grandsire */}
                <path d="M 445 120 C 505 120, 505 55, 565 55" strokeDasharray="150" strokeDashoffset="150">
                  <animate attributeName="stroke-dashoffset" from="150" to="0" dur="0.6s" begin="1.2s" fill="freeze" />
                </path>
                {/* Sire to Paternal Granddam */}
                <path d="M 445 120 C 505 120, 505 130, 565 130" strokeDasharray="150" strokeDashoffset="150">
                  <animate attributeName="stroke-dashoffset" from="150" to="0" dur="0.6s" begin="1.2s" fill="freeze" />
                </path>
                {/* Dam to Maternal Grandsire */}
                <path d="M 445 280 C 505 280, 505 270, 565 270" strokeDasharray="150" strokeDashoffset="150">
                  <animate attributeName="stroke-dashoffset" from="150" to="0" dur="0.6s" begin="1.2s" fill="freeze" />
                </path>
                {/* Dam to Maternal Granddam */}
                <path d="M 445 280 C 505 280, 505 345, 565 345" strokeDasharray="150" strokeDashoffset="150">
                  <animate attributeName="stroke-dashoffset" from="150" to="0" dur="0.6s" begin="1.2s" fill="freeze" />
                </path>
              </g>

              {/* Root node - "Your Animal" - fades in first */}
              <g transform="translate(55, 145)" filter="url(#rootGlow)" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0s" fill="freeze" />
                <rect width="170" height="110" rx="8" fill="url(#sampleMaleGrad)" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="38" cy="55" r="20" fill="#27272a" stroke="#0ea5e9" strokeWidth="2" />
                <text x="38" y="61" textAnchor="middle" fill="#0ea5e9" fontSize="16" fontWeight="bold">♂</text>
                <text x="68" y="35" textAnchor="start" fill="#a1a1aa" fontSize="9">YOUR ANIMAL</text>
                <text x="68" y="53" textAnchor="start" fill="#fafafa" fontSize="12" fontWeight="500">Select Above</text>
                <text x="68" y="71" textAnchor="start" fill="#71717a" fontSize="10">to begin exploring</text>
              </g>

              {/* Sire - fades in when line reaches it */}
              <g transform="translate(345, 85)" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.1s" fill="freeze" />
                <rect width="100" height="70" rx="6" fill="url(#sampleMaleGrad)" stroke="#0ea5e9" strokeWidth="1.5" />
                <circle cx="22" cy="35" r="14" fill="#27272a" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x="22" y="40" textAnchor="middle" fill="#0ea5e9" fontSize="12" fontWeight="bold">♂</text>
                <text x="44" y="24" textAnchor="start" fill="#71717a" fontSize="8">SIRE</text>
                <text x="44" y="38" textAnchor="start" fill="#d4d4d8" fontSize="11">Father</text>
                <text x="44" y="52" textAnchor="start" fill="#52525b" fontSize="9">2018</text>
              </g>

              {/* Dam - fades in when line reaches it */}
              <g transform="translate(345, 245)" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.1s" fill="freeze" />
                <rect width="100" height="70" rx="6" fill="url(#sampleFemaleGrad)" stroke="#ec4899" strokeWidth="1.5" />
                <circle cx="22" cy="35" r="14" fill="#27272a" stroke="#ec4899" strokeWidth="1.5" />
                <text x="22" y="40" textAnchor="middle" fill="#ec4899" fontSize="12" fontWeight="bold">♀</text>
                <text x="44" y="24" textAnchor="start" fill="#71717a" fontSize="8">DAM</text>
                <text x="44" y="38" textAnchor="start" fill="#d4d4d8" fontSize="11">Mother</text>
                <text x="44" y="52" textAnchor="start" fill="#52525b" fontSize="9">2019</text>
              </g>

              {/* Paternal Grandsire - fades in when line reaches it */}
              <g transform="translate(565, 25)" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.8s" fill="freeze" />
                <rect width="120" height="60" rx="5" fill="url(#sampleMaleGrad)" stroke="#0ea5e9" strokeWidth="1" />
                <circle cx="20" cy="30" r="12" fill="#27272a" stroke="#0ea5e9" strokeWidth="1" />
                <text x="20" y="34" textAnchor="middle" fill="#0ea5e9" fontSize="10">♂</text>
                <text x="40" y="22" textAnchor="start" fill="#52525b" fontSize="7">GRANDSIRE</text>
                <text x="40" y="38" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandfather</text>
              </g>

              {/* Paternal Granddam - fades in when line reaches it */}
              <g transform="translate(565, 100)" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.85s" fill="freeze" />
                <rect width="120" height="60" rx="5" fill="url(#sampleFemaleGrad)" stroke="#ec4899" strokeWidth="1" />
                <circle cx="20" cy="30" r="12" fill="#27272a" stroke="#ec4899" strokeWidth="1" />
                <text x="20" y="34" textAnchor="middle" fill="#ec4899" fontSize="10">♀</text>
                <text x="40" y="22" textAnchor="start" fill="#52525b" fontSize="7">GRANDDAM</text>
                <text x="40" y="38" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandmother</text>
              </g>

              {/* Maternal Grandsire - fades in when line reaches it */}
              <g transform="translate(565, 240)" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.9s" fill="freeze" />
                <rect width="120" height="60" rx="5" fill="url(#sampleMaleGrad)" stroke="#0ea5e9" strokeWidth="1" />
                <circle cx="20" cy="30" r="12" fill="#27272a" stroke="#0ea5e9" strokeWidth="1" />
                <text x="20" y="34" textAnchor="middle" fill="#0ea5e9" fontSize="10">♂</text>
                <text x="40" y="22" textAnchor="start" fill="#52525b" fontSize="7">GRANDSIRE</text>
                <text x="40" y="38" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandfather</text>
              </g>

              {/* Maternal Granddam - fades in when line reaches it */}
              <g transform="translate(565, 315)" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.95s" fill="freeze" />
                <rect width="120" height="60" rx="5" fill="url(#sampleFemaleGrad)" stroke="#ec4899" strokeWidth="1" />
                <circle cx="20" cy="30" r="12" fill="#27272a" stroke="#ec4899" strokeWidth="1" />
                <text x="20" y="34" textAnchor="middle" fill="#ec4899" fontSize="10">♀</text>
                <text x="40" y="22" textAnchor="start" fill="#52525b" fontSize="7">GRANDDAM</text>
                <text x="40" y="38" textAnchor="start" fill="#a1a1aa" fontSize="10">Grandmother</text>
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
