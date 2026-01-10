// apps/animals/src/components/LineageTab.tsx
// Lineage tab for animal detail view - shows parents, pedigree tree, and COI

import React from "react";
import { makeApi, type PedigreeNode, type COIResult, type ParentsResult, type PrivacySettings } from "../api";
import { NetworkAnimalPicker } from "./NetworkAnimalPicker";
import { LinkRequestsPanel } from "./LinkRequestsPanel";
import type { NetworkAnimalResult, ShareableAnimal, ParentType } from "@bhq/api";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Position,
  Handle,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type AnimalRow = {
  id: number;
  name: string;
  species?: string;
  sex?: string;
  breed?: string;
  photoUrl?: string;
};

type AnimalOption = {
  id: number;
  name: string;
  breed?: string | null;
  photoUrl?: string | null;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: COI Risk Badge
 * ───────────────────────────────────────────────────────────────────────────── */

function COIBadge({ coi }: { coi: COIResult | null }) {
  if (!coi) return null;

  const percent = (coi.coefficient * 100).toFixed(2);
  const colorClass = {
    LOW: "bg-green-500/20 text-green-400 border-green-500/30",
    MODERATE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
  }[coi.riskLevel];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${colorClass}`}>
      <span>COI: {percent}%</span>
      <span className="opacity-70">({coi.riskLevel.toLowerCase()})</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Parent Card
 * ───────────────────────────────────────────────────────────────────────────── */

function ParentCard({
  label,
  parent,
  onSelect,
  onClear,
  mode,
  loading,
}: {
  label: string;
  parent: AnimalOption | null;
  onSelect: () => void;
  onClear: () => void;
  mode: "view" | "edit";
  loading?: boolean;
}) {
  const isSire = label.includes("Sire") || label.includes("SIRE");
  const colorClass = isSire
    ? "border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10"
    : "border-pink-500/40 bg-pink-500/5 hover:bg-pink-500/10";
  const iconBgClass = isSire ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400";

  return (
    <div>
      <div className={`text-xs font-semibold mb-2 ${isSire ? "text-blue-400" : "text-pink-400"}`}>{label}</div>
      <div
        className={`rounded-lg border p-3 transition-colors cursor-pointer ${colorClass}`}
        onClick={onSelect}
      >
        {loading ? (
          <div className="text-sm text-secondary animate-pulse">Loading...</div>
        ) : parent ? (
          <div className="flex items-center gap-3">
            {parent.photoUrl ? (
              <img
                src={parent.photoUrl}
                alt={parent.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${iconBgClass}`}>
                {isSire ? "♂" : "♀"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{parent.name}</div>
              {parent.breed && (
                <div className="text-xs text-secondary truncate">{parent.breed}</div>
              )}
            </div>
            {mode === "edit" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 rounded hover:bg-white/10 text-secondary hover:text-primary transition-colors"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-secondary">
            Click to select...
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Animal Picker Modal (Enhanced with Network Search)
 * ───────────────────────────────────────────────────────────────────────────── */

function AnimalPickerModal({
  open,
  onClose,
  onSelect,
  onNetworkSelect,
  sex,
  species,
  excludeId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (animal: AnimalOption) => void;
  onNetworkSelect: (animal: NetworkAnimalResult | ShareableAnimal, method: string, targetTenantId?: number) => void;
  sex: "FEMALE" | "MALE";
  species?: string;
  excludeId: number;
  title: string;
}) {
  const [searchScope, setSearchScope] = React.useState<"local" | "network">("local");
  const [search, setSearch] = React.useState("");
  const [animals, setAnimals] = React.useState<AnimalOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Derive relationship type from sex
  const relationshipType: ParentType = sex === "MALE" ? "SIRE" : "DAM";

  React.useEffect(() => {
    if (!open || searchScope !== "local") return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.animals.list({
          q: search || undefined,
          limit: 50,
        });
        const items = (res as any)?.items || [];
        // Filter by sex and exclude self
        const filtered = items.filter(
          (a: any) =>
            a.id !== excludeId &&
            (a.sex || "").toUpperCase() === sex &&
            (!species || (a.species || "").toUpperCase() === species.toUpperCase())
        );
        setAnimals(
          filtered.map((a: any) => ({
            id: a.id,
            name: a.name,
            breed: a.breed,
            photoUrl: a.photoUrl,
          }))
        );
      } catch (err) {
        console.error("Failed to load animals:", err);
        setAnimals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, search, sex, species, excludeId, searchScope]);

  // Reset search when scope changes
  React.useEffect(() => {
    setSearch("");
  }, [searchScope]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-hairline rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-hairline">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-secondary hover:text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scope tabs */}
          <div className="flex rounded-lg border border-hairline overflow-hidden">
            <button
              onClick={() => setSearchScope("local")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                searchScope === "local"
                  ? "bg-accent text-white"
                  : "bg-surface hover:bg-white/5 text-secondary"
              }`}
            >
              🏠 My Animals
            </button>
            <button
              onClick={() => setSearchScope("network")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                searchScope === "network"
                  ? "bg-accent text-white"
                  : "bg-surface hover:bg-white/5 text-secondary"
              }`}
            >
              🌐 Network Search
            </button>
          </div>
        </div>

        {/* Local search content */}
        {searchScope === "local" && (
          <>
            <div className="px-4 py-3 border-b border-hairline">
              <input
                type="text"
                placeholder="Search your animals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-hairline bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="text-center py-8 text-secondary">Loading...</div>
              ) : animals.length === 0 ? (
                <div className="text-center py-8 text-secondary">
                  <p>No {sex.toLowerCase()}s found in your account</p>
                  <button
                    onClick={() => setSearchScope("network")}
                    className="mt-3 text-accent hover:underline text-sm"
                  >
                    Search the network instead →
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {animals.map((animal) => (
                    <button
                      key={animal.id}
                      onClick={() => {
                        onSelect(animal);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                    >
                      {animal.photoUrl ? (
                        <img
                          src={animal.photoUrl}
                          alt={animal.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                          {sex === "MALE" ? "♂" : "♀"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{animal.name}</div>
                        {animal.breed && (
                          <div className="text-xs text-secondary truncate">{animal.breed}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Network search content */}
        {searchScope === "network" && (
          <div className="flex-1 overflow-hidden">
            <NetworkAnimalPicker
              sex={sex}
              species={species}
              sourceAnimalId={excludeId}
              relationshipType={relationshipType}
              onSelect={(animal, method, targetTenantId) => {
                onNetworkSelect(animal, method, targetTenantId);
                onClose();
              }}
              onBack={() => setSearchScope("local")}
            />
          </div>
        )}

        {/* Footer (only for local mode) */}
        {searchScope === "local" && (
          <div className="p-3 border-t border-hairline">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm rounded-md border border-hairline hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Format animal name with titles
 * ───────────────────────────────────────────────────────────────────────────── */

function formatNameWithTitles(node: PedigreeNode): React.ReactNode {
  const hasPrefix = node.titlePrefix && node.titlePrefix.trim();
  const hasSuffix = node.titleSuffix && node.titleSuffix.trim();

  if (!hasPrefix && !hasSuffix) {
    return node.name;
  }

  return (
    <>
      {hasPrefix && (
        <span className="text-[hsl(var(--brand-orange))] font-semibold">{node.titlePrefix} </span>
      )}
      <span>{node.name}</span>
      {hasSuffix && (
        <span className="text-[hsl(var(--brand-orange))] font-semibold"> {node.titleSuffix}</span>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * React Flow Pedigree Types
 * ───────────────────────────────────────────────────────────────────────────── */

interface PedigreeNodeData extends Record<string, unknown> {
  animal: PedigreeNode | null;
  isSire?: boolean;
  generation: number;
  isRoot?: boolean;
  hasParents?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * React Flow Custom Node Component (matches ExplorePage style)
 * ───────────────────────────────────────────────────────────────────────────── */

function PedigreeNodeComponent({ data }: NodeProps<Node<PedigreeNodeData>>) {
  const { animal, generation, isRoot, isSire } = data;

  const isMale = animal?.sex === "MALE";
  const isFemale = animal?.sex === "FEMALE";

  // Card dimensions scaled for LineageTab (smaller than ExplorePage since we show 3 gens)
  const cardWidth = generation === 0 ? 180 : generation === 1 ? 140 : 120;
  const cardHeight = generation === 0 ? 80 : generation === 1 ? 70 : 60;
  const avatarSize = generation === 0 ? 36 : generation === 1 ? 28 : 24;

  // Role labels
  const roleLabel = isRoot
    ? "SUBJECT"
    : generation === 1
    ? (isSire ? "SIRE" : "DAM")
    : generation === 2
    ? (isSire ? "GRANDSIRE" : "GRANDDAM")
    : "";

  // Colors matching Bloodlines - blue for male, pink for female, amber for root/unknown
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

  // Root node gets amber border
  const borderColor = isRoot ? "#f59e0b" : colors.border;
  const borderWidth = generation === 0 ? 2 : generation === 1 ? 1.5 : 1;

  const displayName = animal?.name || "Unknown";

  return (
    <div className="relative" style={{ pointerEvents: "auto" }}>
      {/* Connection handles - invisible */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, width: 1, height: 1 }}
      />

      {/* Card */}
      <div
        className="flex items-center gap-2 transition-all duration-200"
        style={{
          width: cardWidth,
          height: cardHeight,
          padding: generation === 0 ? "12px 14px" : generation === 1 ? "10px 12px" : "8px 10px",
          background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: generation === 0 ? 10 : generation === 1 ? 8 : 6,
          boxShadow: isRoot
            ? `0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.15)`
            : `0 4px 12px rgba(0, 0, 0, 0.3)`,
        }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: colors.avatarBg,
            border: `${generation === 0 ? 2 : 1.5}px solid ${colors.border}`,
          }}
        >
          <span style={{
            color: colors.text,
            fontSize: generation === 0 ? 16 : generation === 1 ? 14 : 12,
            fontWeight: "bold"
          }}>
            {isMale ? "♂" : isFemale ? "♀" : "?"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          {roleLabel && (
            <div
              className="leading-tight mb-0.5"
              style={{
                fontSize: generation === 0 ? 10 : generation === 1 ? 9 : 8,
                color: generation === 0 ? "#a1a1aa" : "#71717a",
                letterSpacing: "0.02em",
              }}
            >
              {roleLabel}
            </div>
          )}
          {animal?.titlePrefix && (
            <div className="text-[9px] font-bold text-amber-400 leading-tight truncate">
              {animal.titlePrefix}
            </div>
          )}
          <div
            className="leading-tight truncate"
            style={{
              fontSize: generation === 0 ? 13 : generation === 1 ? 11 : 10,
              fontWeight: generation === 0 ? 500 : 400,
              color: generation === 0 ? "#fafafa" : generation === 1 ? "#d4d4d8" : "#a1a1aa",
            }}
          >
            {displayName}
          </div>
          {animal?.breed && generation <= 1 && (
            <div
              className="leading-tight mt-0.5 truncate"
              style={{
                fontSize: generation === 0 ? 10 : 9,
                color: "#71717a",
              }}
            >
              {animal.breed}
            </div>
          )}
        </div>
      </div>

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

/* ─────────────────────────────────────────────────────────────────────────────
 * Build React Flow nodes and edges from pedigree data
 * ───────────────────────────────────────────────────────────────────────────── */

function buildPedigreeNodesAndEdges(
  root: PedigreeNode
): { nodes: Node<PedigreeNodeData>[]; edges: Edge[] } {
  const nodes: Node<PedigreeNodeData>[] = [];
  const edges: Edge[] = [];

  // Card dimensions for layout
  const CARD_HEIGHTS = [80, 70, 60]; // gen 0, 1, 2

  // X positions
  const X_GEN0 = 0;
  const X_GEN1 = 220;
  const X_GEN2 = 400;

  // Y positions - center vertically
  const Y_ROOT = 80;
  const Y_SIRE = 0;
  const Y_DAM = 160;

  // Grandparent Y positions
  const Y_PATERNAL_GRANDSIRE = -50;
  const Y_PATERNAL_GRANDDAM = 40;
  const Y_MATERNAL_GRANDSIRE = 130;
  const Y_MATERNAL_GRANDDAM = 220;

  // Edge style
  const edgeStyle = { stroke: "#52525b", strokeWidth: 2 };

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
      data: { animal, generation, isSire, isRoot, hasParents },
    });
  };

  // Generation 0: Root
  addNode("root", root, X_GEN0, Y_ROOT, 0, undefined, true);

  // Generation 1: Parents
  if (root.sire) {
    addNode("sire", root.sire, X_GEN1, Y_SIRE, 1, true);
    edges.push({ id: "e-root-sire", source: "root", target: "sire", type: "default", style: edgeStyle });
  }
  if (root.dam) {
    addNode("dam", root.dam, X_GEN1, Y_DAM, 1, false);
    edges.push({ id: "e-root-dam", source: "root", target: "dam", type: "default", style: edgeStyle });
  }

  // Generation 2: Grandparents
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

  return { nodes, edges };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * React Flow Pedigree Tree Component
 * ───────────────────────────────────────────────────────────────────────────── */

function PedigreeTreeInner({ pedigree }: { pedigree: PedigreeNode }) {
  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(
    () => buildPedigreeNodesAndEdges(pedigree),
    [pedigree]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update when pedigree changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildPedigreeNodesAndEdges(pedigree);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [pedigree, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3, minZoom: 0.8, maxZoom: 1.5 }}
      minZoom={0.5}
      maxZoom={2}
      defaultEdgeOptions={{
        type: "default",
        style: { stroke: "#52525b", strokeWidth: 2 },
      }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={true}
      zoomOnScroll={true}
    >
      <Background color="#27272a" gap={20} size={1} />
    </ReactFlow>
  );
}

function SimplePedigreeTree({ pedigree }: { pedigree: PedigreeNode | null }) {
  if (!pedigree) {
    return (
      <div className="text-sm text-secondary py-4 text-center">
        No pedigree data available. Set parents to build the family tree.
      </div>
    );
  }

  const hasAnyAncestors = pedigree.dam || pedigree.sire;
  if (!hasAnyAncestors) {
    return (
      <div className="text-sm text-secondary py-4 text-center">
        No ancestors recorded. Set the dam and sire to start building the pedigree.
      </div>
    );
  }

  return (
    <div className="w-full h-[320px] rounded-lg overflow-hidden border border-amber-500/20 bg-zinc-950">
      <ReactFlowProvider>
        <PedigreeTreeInner pedigree={pedigree} />
      </ReactFlowProvider>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Privacy Settings Panel - Controls what's shared with other breeders
 * ───────────────────────────────────────────────────────────────────────────── */

function PrivacyToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 py-2 cursor-pointer ${disabled ? "opacity-50" : ""}`}>
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-hairline bg-surface text-accent focus:ring-accent/50"
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-secondary">{description}</div>
      </div>
    </label>
  );
}

function PrivacySettingsPanel({
  animalId,
  mode,
}: {
  animalId: number;
  mode: "view" | "edit";
}) {
  const [settings, setSettings] = React.useState<PrivacySettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    api.animals.lineage.getPrivacySettings(animalId)
      .then(setSettings)
      .catch((err) => console.error("Failed to load privacy settings:", err))
      .finally(() => setLoading(false));
  }, [animalId]);

  const updateSetting = async (key: keyof Omit<PrivacySettings, "animalId">, value: boolean) => {
    if (!settings || mode !== "edit") return;
    setSaving(true);
    try {
      const updated = await api.animals.lineage.updatePrivacySettings(animalId, { [key]: value });
      setSettings(updated);
    } catch (err) {
      console.error("Failed to update privacy setting:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <div className="text-sm text-secondary animate-pulse">Loading privacy settings...</div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="rounded-lg border border-hairline bg-surface overflow-hidden">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-hairline/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <h3 className="text-sm font-semibold">Sharing & Privacy</h3>
          {saving && <span className="text-xs text-secondary">(saving...)</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            settings.allowCrossTenantMatching
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}>
            {settings.allowCrossTenantMatching ? "Discoverable" : "Private"}
          </span>
          <svg
            className={`w-4 h-4 text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-hairline">
          <p className="text-xs text-secondary py-3">
            Control what information about this animal is visible to other breeders in the BreederHQ network.
            This affects how your animal appears in pedigrees shared across programs.
          </p>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
              Network Visibility
            </div>

            <PrivacyToggle
              label="Allow cross-tenant matching"
              description="Let BreederHQ match this animal with records from other breeders (via microchip, registry number, etc.)"
              checked={settings.allowCrossTenantMatching}
              onChange={(v) => updateSetting("allowCrossTenantMatching", v)}
              disabled={mode !== "edit"}
            />

            <PrivacyToggle
              label="Show name"
              description="Display this animal's name to other breeders viewing their pedigrees"
              checked={settings.showName}
              onChange={(v) => updateSetting("showName", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show photo"
              description="Display this animal's photo in shared pedigrees"
              checked={settings.showPhoto}
              onChange={(v) => updateSetting("showPhoto", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show full birth date"
              description="Show complete DOB (otherwise only year is shown)"
              checked={settings.showFullDob}
              onChange={(v) => updateSetting("showFullDob", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show full registry numbers"
              description="Show complete AKC/UKC/etc. numbers (otherwise only last 4 digits)"
              checked={settings.showRegistryFull}
              onChange={(v) => updateSetting("showRegistryFull", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show health test results"
              description="Share detailed health testing results with other breeders"
              checked={settings.showHealthResults}
              onChange={(v) => updateSetting("showHealthResults", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show genetic data"
              description="Share coat color genetics and other genetic test results"
              checked={settings.showGeneticData}
              onChange={(v) => updateSetting("showGeneticData", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <div className="text-xs font-semibold text-secondary uppercase tracking-wide mt-4 mb-2">
              Achievements Visibility
            </div>

            <PrivacyToggle
              label="Show titles"
              description="Display earned titles (CH, GCH, etc.) in shared pedigrees"
              checked={(settings as any).showTitles ?? true}
              onChange={(v) => updateSetting("showTitles" as any, v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show title details"
              description="Include event name, location, and date where titles were earned"
              checked={(settings as any).showTitleDetails ?? false}
              onChange={(v) => updateSetting("showTitleDetails" as any, v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching || !(settings as any).showTitles}
            />

            <PrivacyToggle
              label="Show competitions"
              description="Display competition entry count and aggregate placement stats"
              checked={(settings as any).showCompetitions ?? false}
              onChange={(v) => updateSetting("showCompetitions" as any, v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show competition details"
              description="Include individual competition results and scores"
              checked={(settings as any).showCompetitionDetails ?? false}
              onChange={(v) => updateSetting("showCompetitionDetails" as any, v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching || !(settings as any).showCompetitions}
            />

            <div className="text-xs font-semibold text-secondary uppercase tracking-wide mt-4 mb-2">
              Contact Preferences
            </div>

            <PrivacyToggle
              label="Allow info requests"
              description="Let other breeders request additional information about this animal"
              checked={settings.allowInfoRequests}
              onChange={(v) => updateSetting("allowInfoRequests", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Allow direct contact"
              description="Show your contact information directly (otherwise they must send a request)"
              checked={settings.allowDirectContact}
              onChange={(v) => updateSetting("allowDirectContact", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />
          </div>

          {!settings.allowCrossTenantMatching && (
            <div className="mt-4 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
              Cross-tenant matching is disabled. This animal won't appear in other breeders' pedigrees
              and COI calculations across programs won't include this animal's lineage.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component: LineageTab
 * ───────────────────────────────────────────────────────────────────────────── */

export function LineageTab({
  animal,
  mode,
}: {
  animal: AnimalRow;
  mode: "view" | "edit";
}) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Parent data
  const [dam, setDam] = React.useState<AnimalOption | null>(null);
  const [sire, setSire] = React.useState<AnimalOption | null>(null);
  const [coi, setCoi] = React.useState<COIResult | null>(null);
  const [pedigree, setPedigree] = React.useState<PedigreeNode | null>(null);

  // Picker modal state
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerSex, setPickerSex] = React.useState<"FEMALE" | "MALE">("FEMALE");

  // Pending link requests state
  const [pendingLinkRequests, setPendingLinkRequests] = React.useState<{
    sire?: { animalName: string; tenantName: string };
    dam?: { animalName: string; tenantName: string };
  }>({});

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = React.useState<{
    type: "select" | "clear" | "replace";
    role: "dam" | "sire";
    animal?: AnimalOption;
    existingParent?: AnimalOption | null;
  } | null>(null);

  // Load parents and pedigree
  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load pedigree (includes COI)
        const pedigreeRes = await api.animals.lineage.getPedigree(animal.id, 3);
        setPedigree(pedigreeRes.pedigree);
        setCoi(pedigreeRes.coi);

        // Extract dam/sire from pedigree
        if (pedigreeRes.pedigree) {
          setDam(pedigreeRes.pedigree.dam ? {
            id: pedigreeRes.pedigree.dam.id,
            name: pedigreeRes.pedigree.dam.name,
            breed: pedigreeRes.pedigree.dam.breed,
            photoUrl: pedigreeRes.pedigree.dam.photoUrl,
          } : null);
          setSire(pedigreeRes.pedigree.sire ? {
            id: pedigreeRes.pedigree.sire.id,
            name: pedigreeRes.pedigree.sire.name,
            breed: pedigreeRes.pedigree.sire.breed,
            photoUrl: pedigreeRes.pedigree.sire.photoUrl,
          } : null);
        }
      } catch (err) {
        console.error("Failed to load lineage:", err);
        setError("Failed to load lineage data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [animal.id]);

  // Save parents
  const saveParents = React.useCallback(
    async (newDamId: number | null, newSireId: number | null) => {
      setSaving(true);
      setError(null);
      try {
        await api.animals.lineage.setParents(animal.id, {
          damId: newDamId,
          sireId: newSireId,
        });
        // Reload pedigree
        const pedigreeRes = await api.animals.lineage.getPedigree(animal.id, 3);
        setPedigree(pedigreeRes.pedigree);
        setCoi(pedigreeRes.coi);
      } catch (err: any) {
        console.error("Failed to save parents:", err);
        setError(err?.message || "Failed to save parents");
      } finally {
        setSaving(false);
      }
    },
    [animal.id]
  );

  // Handlers with confirmation
  const handleSelectDam = (selected: AnimalOption) => {
    if (dam) {
      // Replacing existing - show confirmation
      setConfirmAction({ type: "replace", role: "dam", animal: selected, existingParent: dam });
    } else {
      // No existing dam - show simple confirmation
      setConfirmAction({ type: "select", role: "dam", animal: selected });
    }
  };

  const handleSelectSire = (selected: AnimalOption) => {
    if (sire) {
      // Replacing existing - show confirmation
      setConfirmAction({ type: "replace", role: "sire", animal: selected, existingParent: sire });
    } else {
      // No existing sire - show simple confirmation
      setConfirmAction({ type: "select", role: "sire", animal: selected });
    }
  };

  const handleClearDam = () => {
    setConfirmAction({ type: "clear", role: "dam", existingParent: dam });
  };

  const handleClearSire = () => {
    setConfirmAction({ type: "clear", role: "sire", existingParent: sire });
  };

  // Execute confirmed action
  const executeConfirmedAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "clear") {
      if (confirmAction.role === "dam") {
        setDam(null);
        saveParents(null, sire?.id ?? null);
      } else {
        setSire(null);
        saveParents(dam?.id ?? null, null);
      }
    } else if (confirmAction.type === "select" || confirmAction.type === "replace") {
      if (confirmAction.animal) {
        if (confirmAction.role === "dam") {
          setDam(confirmAction.animal);
          saveParents(confirmAction.animal.id, sire?.id ?? null);
        } else {
          setSire(confirmAction.animal);
          saveParents(dam?.id ?? null, confirmAction.animal.id);
        }
      }
    }

    setConfirmAction(null);
  };

  const openDamPicker = () => {
    setPickerSex("FEMALE");
    setPickerOpen(true);
  };

  const openSirePicker = () => {
    setPickerSex("MALE");
    setPickerOpen(true);
  };

  // Handler for network animal selection - creates a link request
  const handleNetworkSelect = async (
    networkAnimal: NetworkAnimalResult | ShareableAnimal,
    method: string,
    targetTenantId?: number
  ) => {
    const relationshipType: ParentType = pickerSex === "MALE" ? "SIRE" : "DAM";
    setSaving(true);
    setError(null);

    try {
      // Create link request
      await api.animalLinking.createLinkRequest(animal.id, {
        relationshipType,
        targetAnimalId: "animalId" in networkAnimal ? networkAnimal.animalId : networkAnimal.id,
        targetTenantId: targetTenantId || ("tenantId" in networkAnimal ? networkAnimal.tenantId : undefined),
        message: `Requesting to link ${networkAnimal.name || "this animal"} as ${relationshipType.toLowerCase()} via ${method}`,
      });

      // Show pending state
      const animalName = networkAnimal.name || "Unknown";
      const tenantName = "tenantName" in networkAnimal ? networkAnimal.tenantName : "another breeder";

      setPendingLinkRequests((prev) => ({
        ...prev,
        [relationshipType.toLowerCase()]: {
          animalName,
          tenantName: tenantName || "another breeder",
        },
      }));

      // Show success feedback - this could be a toast in a real app
      console.log(`Link request sent for ${animalName} as ${relationshipType}`);
    } catch (err: any) {
      console.error("Failed to create link request:", err);
      setError(err?.message || "Failed to send link request");
    } finally {
      setSaving(false);
    }
  };

  // Callback when a link is changed (approved/denied/revoked)
  const handleLinkChange = () => {
    // Reload pedigree data to reflect any changes
    api.animals.lineage.getPedigree(animal.id, 3)
      .then((pedigreeRes) => {
        setPedigree(pedigreeRes.pedigree);
        setCoi(pedigreeRes.coi);
        if (pedigreeRes.pedigree) {
          setDam(pedigreeRes.pedigree.dam ? {
            id: pedigreeRes.pedigree.dam.id,
            name: pedigreeRes.pedigree.dam.name,
            breed: pedigreeRes.pedigree.dam.breed,
            photoUrl: pedigreeRes.pedigree.dam.photoUrl,
          } : null);
          setSire(pedigreeRes.pedigree.sire ? {
            id: pedigreeRes.pedigree.sire.id,
            name: pedigreeRes.pedigree.sire.name,
            breed: pedigreeRes.pedigree.sire.breed,
            photoUrl: pedigreeRes.pedigree.sire.photoUrl,
          } : null);
        }
      })
      .catch((err) => console.error("Failed to reload pedigree:", err));

    // Clear any pending request state
    setPendingLinkRequests({});
  };

  return (
    <div className="space-y-4 p-4">
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Parents Section */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span>Parents</span>
            {saving && <span className="text-xs text-secondary">(saving...)</span>}
          </h3>
          {coi && coi.coefficient > 0 && <COIBadge coi={coi} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ParentCard
            label="SIRE (Father)"
            parent={sire}
            onSelect={openSirePicker}
            onClear={handleClearSire}
            mode={mode}
            loading={loading}
          />
          <ParentCard
            label="DAM (Mother)"
            parent={dam}
            onSelect={openDamPicker}
            onClear={handleClearDam}
            mode={mode}
            loading={loading}
          />
        </div>
      </div>

      {/* Pedigree Tree */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <h3 className="text-sm font-semibold mb-4">Pedigree (3 Generations)</h3>
        {loading ? (
          <div className="text-sm text-secondary py-4 animate-pulse">Loading pedigree...</div>
        ) : (
          <SimplePedigreeTree pedigree={pedigree} />
        )}
      </div>

      {/* COI Details */}
      {coi && coi.commonAncestors.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3">Inbreeding Analysis</h3>
          <div className="text-sm text-secondary mb-3">
            Coefficient of Inbreeding (COI) calculated over {coi.generationsAnalyzed} generations.
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-secondary">Common Ancestors</div>
            {coi.commonAncestors.slice(0, 5).map((ancestor) => (
              <div
                key={ancestor.id}
                className="flex items-center justify-between py-1.5 border-b border-hairline last:border-0"
              >
                <span className="text-sm">{ancestor.name}</span>
                <span className="text-xs text-secondary">
                  {(ancestor.contribution * 100).toFixed(2)}% contribution
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <PrivacySettingsPanel animalId={animal.id} mode={mode} />

      {/* Link Requests Panel - manage incoming/outgoing cross-tenant link requests */}
      <LinkRequestsPanel animalId={animal.id} onLinkChange={handleLinkChange} />

      {/* Pending link request indicators */}
      {(pendingLinkRequests.sire || pendingLinkRequests.dam) && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">Pending Link Requests</h3>
          <div className="space-y-2">
            {pendingLinkRequests.sire && (
              <div className="text-sm text-yellow-300">
                <span className="font-medium">Sire:</span> Awaiting approval from{" "}
                <span className="font-medium">{pendingLinkRequests.sire.tenantName}</span> for{" "}
                <span className="italic">{pendingLinkRequests.sire.animalName}</span>
              </div>
            )}
            {pendingLinkRequests.dam && (
              <div className="text-sm text-yellow-300">
                <span className="font-medium">Dam:</span> Awaiting approval from{" "}
                <span className="font-medium">{pendingLinkRequests.dam.tenantName}</span> for{" "}
                <span className="italic">{pendingLinkRequests.dam.animalName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animal Picker Modal */}
      <AnimalPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={pickerSex === "FEMALE" ? handleSelectDam : handleSelectSire}
        onNetworkSelect={handleNetworkSelect}
        sex={pickerSex}
        species={animal.species}
        excludeId={animal.id}
        title={pickerSex === "FEMALE" ? "Select Dam (Mother)" : "Select Sire (Father)"}
      />
    </div>
  );
}

export default LineageTab;
