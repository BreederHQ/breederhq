// apps/animals/src/components/LineageTab.tsx
// Lineage tab for animal detail view - shows parents, pedigree tree, and COI

import React from "react";
import { makeApi, type PedigreeNode, type COIResult, type ParentsResult, type PrivacySettings } from "../api";
import { PrivacyBadge } from "./PrivacyTab";
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
  const isEditable = mode === "edit";

  // Different styles based on whether parent is set and if editable
  const baseClasses = isSire
    ? "border-blue-500/40 bg-blue-500/5"
    : "border-pink-500/40 bg-pink-500/5";

  const hoverClasses = isEditable
    ? isSire
      ? "hover:bg-blue-500/15 hover:border-blue-500/60"
      : "hover:bg-pink-500/15 hover:border-pink-500/60"
    : "";

  const emptyClasses = !parent
    ? "border-dashed border-2"
    : "";

  const iconBgClass = isSire ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400";

  return (
    <div>
      <div className={`text-xs font-semibold mb-2 ${isSire ? "text-blue-400" : "text-pink-400"}`}>{label}</div>
      <div
        className={`rounded-lg border p-3 transition-all ${baseClasses} ${hoverClasses} ${emptyClasses} ${isEditable ? "cursor-pointer" : ""}`}
        onClick={isEditable ? onSelect : undefined}
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
            {isEditable && (
              <div className="flex items-center gap-1">
                {/* Edit/Change button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="p-1.5 rounded hover:bg-white/10 text-secondary hover:text-accent transition-colors"
                  title="Change"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="p-1.5 rounded hover:bg-red-500/20 text-secondary hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-3 ${isEditable ? "" : "opacity-50"}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-dashed ${isSire ? "border-blue-500/30 text-blue-500/50" : "border-pink-500/30 text-pink-500/50"}`}>
              {isSire ? "♂" : "♀"}
            </div>
            <div className="flex-1">
              <div className={`text-sm ${isEditable ? "text-secondary" : "text-secondary/50"}`}>
                {isEditable ? "Click to select..." : "Not set"}
              </div>
              {isEditable && (
                <div className="text-xs text-secondary/70">
                  Search your animals or the network
                </div>
              )}
            </div>
            {isEditable && (
              <svg className={`w-5 h-5 ${isSire ? "text-blue-500/50" : "text-pink-500/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
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
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
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

type ParentPosition = "sire" | "dam";
type GrandparentPosition = "sire-sire" | "sire-dam" | "dam-sire" | "dam-dam";
type PedigreePosition = ParentPosition | GrandparentPosition;

interface PedigreeNodeData extends Record<string, unknown> {
  animal: PedigreeNode | null;
  isSire?: boolean;
  generation: number;
  isRoot?: boolean;
  hasParents?: boolean;
  // Edit mode props
  isEditable?: boolean;
  onEdit?: () => void;
  pedigreePosition?: PedigreePosition;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * React Flow Custom Node Component (matches ExplorePage style)
 * ───────────────────────────────────────────────────────────────────────────── */

function PedigreeNodeComponent({ data }: NodeProps<Node<PedigreeNodeData>>) {
  const { animal, generation, isRoot, isSire, isEditable, onEdit, pedigreePosition } = data;

  const isMale = animal?.sex === "MALE";
  const isFemale = animal?.sex === "FEMALE";

  // For parent nodes (generation 1) and grandparent nodes (generation 2), determine if they should show edit affordance
  const isParentNode = generation === 1;
  const isGrandparentNode = generation === 2;
  const canEdit = isEditable && (isParentNode || isGrandparentNode) && onEdit;

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

  // Empty editable state - show placeholder
  const isEmptyEditable = !animal && canEdit;
  const displayName = isEmptyEditable ? "Click to search..." : (animal?.name || "Unknown");

  // Click handler for editable grandparent nodes
  const handleClick = () => {
    if (canEdit && onEdit) {
      onEdit();
    }
  };

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
        className={`flex items-center gap-2 transition-all duration-200 ${canEdit ? "cursor-pointer" : ""}`}
        onClick={handleClick}
        style={{
          width: cardWidth,
          height: cardHeight,
          padding: generation === 0 ? "12px 14px" : generation === 1 ? "10px 12px" : "8px 10px",
          background: `linear-gradient(135deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
          border: canEdit
            ? `${borderWidth + 1}px dashed ${borderColor}`
            : `${borderWidth}px solid ${borderColor}`,
          borderRadius: generation === 0 ? 10 : generation === 1 ? 8 : 6,
          boxShadow: isRoot
            ? `0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.15)`
            : canEdit
            ? `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 8px ${borderColor}40`
            : `0 4px 12px rgba(0, 0, 0, 0.3)`,
        }}
        title={canEdit ? "Click to search for this ancestor" : undefined}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: isEmptyEditable ? "transparent" : colors.avatarBg,
            border: isEmptyEditable
              ? `${generation === 0 ? 2 : 1.5}px dashed ${colors.border}`
              : `${generation === 0 ? 2 : 1.5}px solid ${colors.border}`,
          }}
        >
          <span style={{
            color: colors.text,
            fontSize: generation === 0 ? 16 : generation === 1 ? 14 : 12,
            fontWeight: "bold"
          }}>
            {isEmptyEditable ? "+" : isMale ? "♂" : isFemale ? "♀" : "?"}
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

        {/* Edit indicator for editable grandparent nodes */}
        {canEdit && (
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: 18,
              height: 18,
              backgroundColor: `${borderColor}30`,
              marginLeft: 4,
            }}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke={borderColor}
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
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

interface BuildPedigreeOptions {
  isEditMode?: boolean;
  // Which positions are editable/searchable
  editablePositions?: {
    sire?: boolean;
    dam?: boolean;
    "sire-sire"?: boolean;
    "sire-dam"?: boolean;
    "dam-sire"?: boolean;
    "dam-dam"?: boolean;
  };
  onEditPosition?: (position: PedigreePosition) => void;
}

function buildPedigreeNodesAndEdges(
  root: PedigreeNode,
  options?: BuildPedigreeOptions
): { nodes: Node<PedigreeNodeData>[]; edges: Edge[] } {
  const nodes: Node<PedigreeNodeData>[] = [];
  const edges: Edge[] = [];

  const { isEditMode, editablePositions, onEditPosition } = options || {};

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
  const dashedEdgeStyle = { ...edgeStyle, strokeDasharray: "5,5", stroke: "#3f3f46" };

  // Helper to add a node
  const addNode = (
    id: string,
    animal: PedigreeNode | null,
    x: number,
    y: number,
    generation: number,
    isSire?: boolean,
    isRoot?: boolean,
    pedigreePosition?: PedigreePosition
  ) => {
    const hasParents = !!(animal?.sire || animal?.dam);
    const isEditable = isEditMode && pedigreePosition && editablePositions?.[pedigreePosition];
    nodes.push({
      id,
      type: "pedigree",
      position: { x, y },
      data: {
        animal,
        generation,
        isSire,
        isRoot,
        hasParents,
        isEditable,
        pedigreePosition,
        onEdit: isEditable && onEditPosition ? () => onEditPosition(pedigreePosition) : undefined,
      },
    });
  };

  // Generation 0: Root
  addNode("root", root, X_GEN0, Y_ROOT, 0, undefined, true);

  // Generation 1: Parents
  const hasSire = !!root.sire;
  const hasDam = !!root.dam;
  const canEditSire = isEditMode && editablePositions?.sire;
  const canEditDam = isEditMode && editablePositions?.dam;

  // Sire node - show if exists or if editable
  if (hasSire || canEditSire) {
    addNode("sire", root.sire || null, X_GEN1, Y_SIRE, 1, true, false, "sire");
    if (hasSire) {
      edges.push({ id: "e-root-sire", source: "root", target: "sire", type: "default", style: edgeStyle });
    } else if (canEditSire) {
      edges.push({ id: "e-root-sire", source: "root", target: "sire", type: "default", style: dashedEdgeStyle });
    }
  }
  // Dam node - show if exists or if editable
  if (hasDam || canEditDam) {
    addNode("dam", root.dam || null, X_GEN1, Y_DAM, 1, false, false, "dam");
    if (hasDam) {
      edges.push({ id: "e-root-dam", source: "root", target: "dam", type: "default", style: edgeStyle });
    } else if (canEditDam) {
      edges.push({ id: "e-root-dam", source: "root", target: "dam", type: "default", style: dashedEdgeStyle });
    }
  }

  // Generation 2: Grandparents
  // Add grandparent nodes only if they exist OR if we're in edit mode with editable positions
  if (root.sire) {
    const hasSireSire = !!root.sire.sire;
    const hasSireDam = !!root.sire.dam;
    const canEditSireSire = isEditMode && editablePositions?.["sire-sire"];
    const canEditSireDam = isEditMode && editablePositions?.["sire-dam"];

    // Paternal grandsire
    if (hasSireSire || canEditSireSire) {
      addNode("sire-sire", root.sire.sire || null, X_GEN2, Y_PATERNAL_GRANDSIRE, 2, true, false, "sire-sire");
      if (hasSireSire) {
        edges.push({ id: "e-sire-sire-sire", source: "sire", target: "sire-sire", type: "default", style: edgeStyle });
      } else if (canEditSireSire) {
        edges.push({ id: "e-sire-sire-sire", source: "sire", target: "sire-sire", type: "default", style: dashedEdgeStyle });
      }
    }
    // Paternal granddam
    if (hasSireDam || canEditSireDam) {
      addNode("sire-dam", root.sire.dam || null, X_GEN2, Y_PATERNAL_GRANDDAM, 2, false, false, "sire-dam");
      if (hasSireDam) {
        edges.push({ id: "e-sire-sire-dam", source: "sire", target: "sire-dam", type: "default", style: edgeStyle });
      } else if (canEditSireDam) {
        edges.push({ id: "e-sire-sire-dam", source: "sire", target: "sire-dam", type: "default", style: dashedEdgeStyle });
      }
    }
  }
  if (root.dam) {
    const hasDamSire = !!root.dam.sire;
    const hasDamDam = !!root.dam.dam;
    const canEditDamSire = isEditMode && editablePositions?.["dam-sire"];
    const canEditDamDam = isEditMode && editablePositions?.["dam-dam"];

    // Maternal grandsire
    if (hasDamSire || canEditDamSire) {
      addNode("dam-sire", root.dam.sire || null, X_GEN2, Y_MATERNAL_GRANDSIRE, 2, true, false, "dam-sire");
      if (hasDamSire) {
        edges.push({ id: "e-dam-dam-sire", source: "dam", target: "dam-sire", type: "default", style: edgeStyle });
      } else if (canEditDamSire) {
        edges.push({ id: "e-dam-dam-sire", source: "dam", target: "dam-sire", type: "default", style: dashedEdgeStyle });
      }
    }
    // Maternal granddam
    if (hasDamDam || canEditDamDam) {
      addNode("dam-dam", root.dam.dam || null, X_GEN2, Y_MATERNAL_GRANDDAM, 2, false, false, "dam-dam");
      if (hasDamDam) {
        edges.push({ id: "e-dam-dam-dam", source: "dam", target: "dam-dam", type: "default", style: edgeStyle });
      } else if (canEditDamDam) {
        edges.push({ id: "e-dam-dam-dam", source: "dam", target: "dam-dam", type: "default", style: dashedEdgeStyle });
      }
    }
  }

  return { nodes, edges };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * React Flow Pedigree Tree Component
 * ───────────────────────────────────────────────────────────────────────────── */

interface PedigreeTreeInnerProps {
  pedigree: PedigreeNode;
  options?: BuildPedigreeOptions;
}

function PedigreeTreeInner({ pedigree, options }: PedigreeTreeInnerProps) {
  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(
    () => buildPedigreeNodesAndEdges(pedigree, options),
    [pedigree, options]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update when pedigree or options change
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildPedigreeNodesAndEdges(pedigree, options);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [pedigree, options, setNodes, setEdges]);

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

interface SimplePedigreeTreeProps {
  pedigree: PedigreeNode | null;
  options?: BuildPedigreeOptions;
}

function SimplePedigreeTree({ pedigree, options }: SimplePedigreeTreeProps) {
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
    <div
      className="w-full rounded-lg overflow-hidden border border-amber-500/20 bg-zinc-950"
      style={{ height: 320 }}
    >
      <ReactFlowProvider>
        <div style={{ width: "100%", height: "100%" }}>
          <PedigreeTreeInner pedigree={pedigree} options={options} />
        </div>
      </ReactFlowProvider>
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

  // Picker modal state (for direct parents)
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerSex, setPickerSex] = React.useState<"FEMALE" | "MALE">("FEMALE");

  // Grandparent picker modal state
  const [grandparentPickerOpen, setGrandparentPickerOpen] = React.useState(false);
  const [editingGrandparentPosition, setEditingGrandparentPosition] = React.useState<GrandparentPosition | null>(null);

  // Pending link requests state
  const [pendingLinkRequests, setPendingLinkRequests] = React.useState<{
    sire?: { animalName: string; tenantName: string };
    dam?: { animalName: string; tenantName: string };
  }>({});

  // Privacy settings
  const [privacySettings, setPrivacySettings] = React.useState<Pick<PrivacySettings, "allowCrossTenantMatching"> | null>(null);

  // Load privacy settings
  React.useEffect(() => {
    api.animals.lineage.getPrivacySettings(animal.id)
      .then((s) => setPrivacySettings({ allowCrossTenantMatching: s.allowCrossTenantMatching }))
      .catch(() => {});
  }, [animal.id]);

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

  // Handlers for parent selection (direct, no confirmation needed for local animals)
  const handleSelectDam = (selected: AnimalOption) => {
    setDam(selected);
    saveParents(selected.id, sire?.id ?? null);
  };

  const handleSelectSire = (selected: AnimalOption) => {
    setSire(selected);
    saveParents(dam?.id ?? null, selected.id);
  };

  const handleClearDam = () => {
    if (!dam) return;
    setDam(null);
    saveParents(null, sire?.id ?? null);
  };

  const handleClearSire = () => {
    if (!sire) return;
    setSire(null);
    saveParents(dam?.id ?? null, null);
  };

  const openDamPicker = () => {
    setPickerSex("FEMALE");
    setPickerOpen(true);
  };

  const openSirePicker = () => {
    setPickerSex("MALE");
    setPickerOpen(true);
  };

  // Determine which pedigree positions can be searched/linked
  // Parent positions are always editable (for the root animal)
  // Grandparent positions are only editable if the parent exists
  const editablePositions = React.useMemo(() => {
    const result: Record<PedigreePosition, boolean> = {
      sire: true, // Always can search for sire
      dam: true,  // Always can search for dam
      "sire-sire": false,
      "sire-dam": false,
      "dam-sire": false,
      "dam-dam": false,
    };
    // If we have a sire, we can search for/link its parents (the paternal grandparents)
    if (pedigree?.sire) {
      result["sire-sire"] = true;
      result["sire-dam"] = true;
    }
    // Same for dam
    if (pedigree?.dam) {
      result["dam-sire"] = true;
      result["dam-dam"] = true;
    }
    return result;
  }, [pedigree]);

  // Handler for clicking on a node in the pedigree tree
  const handleEditPosition = React.useCallback((position: PedigreePosition) => {
    // Determine the sex based on the position
    const isSirePosition = position === "sire" || position === "sire-sire" || position === "dam-sire";
    setPickerSex(isSirePosition ? "MALE" : "FEMALE");

    if (position === "sire" || position === "dam") {
      // Opening picker for direct parent
      setPickerOpen(true);
    } else {
      // Opening picker for grandparent
      setEditingGrandparentPosition(position as GrandparentPosition);
      setGrandparentPickerOpen(true);
    }
  }, []);

  // Get the parent animal ID for a grandparent position
  const getParentAnimalIdForGrandparent = (position: GrandparentPosition): number | null => {
    switch (position) {
      case "sire-sire":
      case "sire-dam":
        return pedigree?.sire?.id ?? null;
      case "dam-sire":
      case "dam-dam":
        return pedigree?.dam?.id ?? null;
      default:
        return null;
    }
  };

  // Handler for selecting a grandparent (local animal)
  const handleSelectGrandparent = async (selected: AnimalOption) => {
    if (!editingGrandparentPosition) return;

    const parentAnimalId = getParentAnimalIdForGrandparent(editingGrandparentPosition);
    if (!parentAnimalId) {
      setError("Cannot set grandparent - parent animal not found");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Determine which parent of the parent we're setting
      const isSettingSire = editingGrandparentPosition === "sire-sire" || editingGrandparentPosition === "dam-sire";
      const parentNode = editingGrandparentPosition.startsWith("sire") ? pedigree?.sire : pedigree?.dam;

      // Set the parent's parents
      await api.animals.lineage.setParents(parentAnimalId, {
        damId: isSettingSire ? (parentNode?.dam?.id ?? null) : selected.id,
        sireId: isSettingSire ? selected.id : (parentNode?.sire?.id ?? null),
      });

      // Reload pedigree to reflect changes
      const pedigreeRes = await api.animals.lineage.getPedigree(animal.id, 3);
      setPedigree(pedigreeRes.pedigree);
      setCoi(pedigreeRes.coi);
    } catch (err: any) {
      console.error("Failed to save grandparent:", err);
      setError(err?.message || "Failed to save grandparent");
    } finally {
      setSaving(false);
      setGrandparentPickerOpen(false);
      setEditingGrandparentPosition(null);
    }
  };

  // Handler for network grandparent selection - creates a link request
  const handleNetworkGrandparentSelect = async (
    networkAnimal: NetworkAnimalResult | ShareableAnimal,
    method: string,
    targetTenantId?: number
  ) => {
    if (!editingGrandparentPosition) return;

    const parentAnimalId = getParentAnimalIdForGrandparent(editingGrandparentPosition);
    if (!parentAnimalId) {
      setError("Cannot link grandparent - parent animal not found");
      return;
    }

    const relationshipType: ParentType = pickerSex === "MALE" ? "SIRE" : "DAM";
    setSaving(true);
    setError(null);

    try {
      // Create link request for the parent animal (not the current animal)
      await api.animalLinking.createLinkRequest(parentAnimalId, {
        relationshipType,
        targetAnimalId: "animalId" in networkAnimal ? networkAnimal.animalId : networkAnimal.id,
        targetTenantId: targetTenantId || ("tenantId" in networkAnimal ? networkAnimal.tenantId : undefined),
        message: `Requesting to link ${networkAnimal.name || "this animal"} as ${relationshipType.toLowerCase()} (grandparent) via ${method}`,
      });

      // Show success feedback
      console.log(`Grandparent link request sent for ${networkAnimal.name || "animal"}`);
    } catch (err: any) {
      console.error("Failed to create grandparent link request:", err);
      setError(err?.message || "Failed to send link request");
    } finally {
      setSaving(false);
      setGrandparentPickerOpen(false);
      setEditingGrandparentPosition(null);
    }
  };

  // Get the title for the grandparent picker modal
  const getGrandparentPickerTitle = (): string => {
    if (!editingGrandparentPosition) return "Select Ancestor";
    const positionLabels: Record<GrandparentPosition, string> = {
      "sire-sire": "Select Paternal Grandsire",
      "sire-dam": "Select Paternal Granddam",
      "dam-sire": "Select Maternal Grandsire",
      "dam-dam": "Select Maternal Granddam",
    };
    return positionLabels[editingGrandparentPosition];
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
      {/* Header with privacy badge */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">Lineage</h3>
        {privacySettings && (
          <PrivacyBadge isPublic={privacySettings.allowCrossTenantMatching} />
        )}
      </div>

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Pedigree (3 Generations)</h3>
          <span className="text-xs text-secondary">Click nodes to search</span>
        </div>
        {loading ? (
          <div className="text-sm text-secondary py-4 animate-pulse">Loading pedigree...</div>
        ) : (
          <SimplePedigreeTree
            pedigree={pedigree}
            options={{
              isEditMode: true, // Always allow position searching
              editablePositions,
              onEditPosition: handleEditPosition,
            }}
          />
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

      {/* Animal Picker Modal (for direct parents) */}
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

      {/* Grandparent Picker Modal */}
      <AnimalPickerModal
        open={grandparentPickerOpen}
        onClose={() => {
          setGrandparentPickerOpen(false);
          setEditingGrandparentPosition(null);
        }}
        onSelect={handleSelectGrandparent}
        onNetworkSelect={handleNetworkGrandparentSelect}
        sex={pickerSex}
        species={animal.species}
        excludeId={editingGrandparentPosition ? (getParentAnimalIdForGrandparent(editingGrandparentPosition) ?? animal.id) : animal.id}
        title={getGrandparentPickerTitle()}
      />
    </div>
  );
}

export default LineageTab;
