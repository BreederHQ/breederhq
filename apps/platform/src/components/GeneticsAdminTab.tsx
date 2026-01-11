// apps/platform/src/components/GeneticsAdminTab.tsx
// Admin tab for reviewing and managing genetic markers

import * as React from "react";
import { Button, SectionCard, Input, Dialog } from "@bhq/ui";
import { Search, Check, X, Merge, AlertTriangle, Dna, ChevronDown, ChevronUp } from "lucide-react";
import type { GeneticMarker, GeneticMarkerCategory, GeneticSpecies } from "@bhq/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GeneticsAdminTabProps {
  api: any; // API client with genetics resource
}

type ActionMode = "approve" | "reject" | "merge";

// Category display config
const CATEGORY_CONFIG: Record<GeneticMarkerCategory, { label: string; color: string }> = {
  coat_color: { label: "Coat Color", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  coat_type: { label: "Coat Type", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  health: { label: "Health", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  physical_traits: { label: "Physical", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  eye_color: { label: "Eye Color", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  other: { label: "Other", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

const SPECIES_OPTIONS: { value: GeneticSpecies; label: string }[] = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "HORSE", label: "Horse" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_OPTIONS: { value: GeneticMarkerCategory; label: string }[] = [
  { value: "coat_color", label: "Coat Color" },
  { value: "coat_type", label: "Coat Type" },
  { value: "health", label: "Health" },
  { value: "physical_traits", label: "Physical Traits" },
  { value: "eye_color", label: "Eye Color" },
  { value: "other", label: "Other" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function GeneticsAdminTab({ api }: GeneticsAdminTabProps) {
  const [pendingMarkers, setPendingMarkers] = React.useState<GeneticMarker[]>([]);
  const [allMarkers, setAllMarkers] = React.useState<GeneticMarker[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterSpecies, setFilterSpecies] = React.useState<GeneticSpecies | "">("");
  const [filterCategory, setFilterCategory] = React.useState<GeneticMarkerCategory | "">("");
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  // Action modal state
  const [actionMarker, setActionMarker] = React.useState<GeneticMarker | null>(null);
  const [actionMode, setActionMode] = React.useState<ActionMode>("approve");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Approve form state
  const [editCode, setEditCode] = React.useState("");
  const [editCommonName, setEditCommonName] = React.useState("");
  const [editCategory, setEditCategory] = React.useState<GeneticMarkerCategory>("other");
  const [editSpecies, setEditSpecies] = React.useState<GeneticSpecies>("DOG");
  const [editDescription, setEditDescription] = React.useState("");
  const [editGene, setEditGene] = React.useState("");
  const [editIsCommon, setEditIsCommon] = React.useState(false);

  // Merge state
  const [mergeTargetId, setMergeTargetId] = React.useState<number | null>(null);
  const [mergeSearch, setMergeSearch] = React.useState("");

  // Load markers
  React.useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    setLoading(true);
    try {
      // Load pending markers
      const pendingRes = await api.genetics?.markers?.getPendingReview({ limit: 100 });
      setPendingMarkers(pendingRes?.markers || []);

      // Load all approved markers for merge targets
      const allRes = await api.genetics?.markers?.list({ pendingReview: false, limit: 500 });
      setAllMarkers(allRes?.markers || []);
    } catch (err) {
      console.error("Failed to load markers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter pending markers
  const filteredPending = React.useMemo(() => {
    return pendingMarkers.filter((m) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          m.code.toLowerCase().includes(q) ||
          m.commonName.toLowerCase().includes(q) ||
          m.gene?.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Species filter
      if (filterSpecies && m.species !== filterSpecies) return false;
      // Category filter
      if (filterCategory && m.category !== filterCategory) return false;
      return true;
    });
  }, [pendingMarkers, searchQuery, filterSpecies, filterCategory]);

  // Filter merge targets
  const mergeTargets = React.useMemo(() => {
    if (!mergeSearch.trim()) return allMarkers.slice(0, 20);
    const q = mergeSearch.toLowerCase();
    return allMarkers
      .filter(
        (m) =>
          m.code.toLowerCase().includes(q) ||
          m.commonName.toLowerCase().includes(q) ||
          m.gene?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [allMarkers, mergeSearch]);

  // Open action modal
  const openAction = (marker: GeneticMarker, mode: ActionMode) => {
    setActionMarker(marker);
    setActionMode(mode);
    // Pre-fill approve form
    setEditCode(marker.code);
    setEditCommonName(marker.commonName);
    setEditCategory(marker.category);
    setEditSpecies(marker.species);
    setEditDescription(marker.description);
    setEditGene(marker.gene || "");
    setEditIsCommon(marker.isCommon);
    // Reset merge state
    setMergeTargetId(null);
    setMergeSearch("");
  };

  const closeAction = () => {
    setActionMarker(null);
    setActionLoading(false);
  };

  // Handle approve
  const handleApprove = async () => {
    if (!actionMarker) return;
    setActionLoading(true);
    try {
      await api.genetics?.markers?.approve(actionMarker.id, {
        code: editCode,
        commonName: editCommonName,
        category: editCategory,
        species: editSpecies,
        description: editDescription,
        gene: editGene || undefined,
        isCommon: editIsCommon,
      });
      // Remove from pending list
      setPendingMarkers((prev) => prev.filter((m) => m.id !== actionMarker.id));
      closeAction();
      // Reload all markers
      loadMarkers();
    } catch (err) {
      console.error("Failed to approve marker:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!actionMarker) return;
    setActionLoading(true);
    try {
      await api.genetics?.markers?.reject(actionMarker.id);
      setPendingMarkers((prev) => prev.filter((m) => m.id !== actionMarker.id));
      closeAction();
    } catch (err) {
      console.error("Failed to reject marker:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle merge
  const handleMerge = async () => {
    if (!actionMarker || !mergeTargetId) return;
    setActionLoading(true);
    try {
      await api.genetics?.markers?.merge(actionMarker.id, mergeTargetId);
      setPendingMarkers((prev) => prev.filter((m) => m.id !== actionMarker.id));
      closeAction();
    } catch (err) {
      console.error("Failed to merge marker:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-secondary">Loading genetic markers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Dna className="w-5 h-5" />
          Genetic Markers Admin
        </h2>
        <p className="text-sm text-secondary mt-1">
          Review and categorize genetic markers from lab imports
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="text-2xl font-bold text-amber-600">{pendingMarkers.length}</div>
          <div className="text-sm text-amber-700 dark:text-amber-400">Pending Review</div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600">{allMarkers.length}</div>
          <div className="text-sm text-green-700 dark:text-green-400">Approved Markers</div>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">
            {new Set(allMarkers.map((m) => m.species)).size}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-400">Species Covered</div>
        </div>
      </div>

      {/* Pending Review Section */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Pending Review ({filteredPending.length})</span>
          </div>
        }
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <Input
                placeholder="Search markers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value as GeneticSpecies | "")}
            className="px-3 py-2 border border-hairline rounded-md bg-surface text-sm"
          >
            <option value="">All Species</option>
            {SPECIES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as GeneticMarkerCategory | "")}
            className="px-3 py-2 border border-hairline rounded-md bg-surface text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pending list */}
        {filteredPending.length === 0 ? (
          <div className="text-center py-8 text-secondary">
            {pendingMarkers.length === 0 ? (
              <p>No markers pending review</p>
            ) : (
              <p>No markers match your filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPending.map((marker) => (
              <div
                key={marker.id}
                className="border border-hairline rounded-lg overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-surface-hover"
                  onClick={() => setExpandedId(expandedId === marker.id ? null : marker.id)}
                >
                  <button className="text-secondary">
                    {expandedId === marker.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <span className="font-mono text-sm px-2 py-0.5 bg-surface-alt rounded">
                    {marker.code}
                  </span>
                  <span className="font-medium flex-1">{marker.commonName}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${CATEGORY_CONFIG[marker.category].color}`}
                  >
                    {CATEGORY_CONFIG[marker.category].label}
                  </span>
                  <span className="text-xs text-secondary">{marker.species}</span>
                  <span className="text-xs text-secondary bg-surface-alt px-2 py-0.5 rounded">
                    {marker.source}
                  </span>
                </div>

                {/* Expanded details */}
                {expandedId === marker.id && (
                  <div className="border-t border-hairline p-4 bg-surface-alt space-y-3">
                    <div>
                      <div className="text-xs text-secondary mb-1">Description</div>
                      <p className="text-sm">{marker.description || "No description"}</p>
                    </div>
                    {marker.gene && (
                      <div>
                        <div className="text-xs text-secondary mb-1">Gene</div>
                        <p className="text-sm font-mono">{marker.gene}</p>
                      </div>
                    )}
                    {marker.breedSpecific && marker.breedSpecific.length > 0 && (
                      <div>
                        <div className="text-xs text-secondary mb-1">Breed-Specific</div>
                        <div className="flex flex-wrap gap-1">
                          {marker.breedSpecific.map((breed) => (
                            <span
                              key={breed}
                              className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {breed}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => openAction(marker, "approve")}
                        className="gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(marker, "merge")}
                        className="gap-1"
                      >
                        <Merge className="w-3.5 h-3.5" />
                        Merge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(marker, "reject")}
                        className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Action Modal */}
      {actionMarker && (
        <Dialog
          open={!!actionMarker}
          onClose={closeAction}
          title={
            actionMode === "approve"
              ? "Approve Marker"
              : actionMode === "reject"
              ? "Reject Marker"
              : "Merge Marker"
          }
          size="md"
        >
          <div className="space-y-4">
            {/* Approve form */}
            {actionMode === "approve" && (
              <>
                <p className="text-sm text-secondary">
                  Review and update the marker details before approving.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-secondary block mb-1">Code</label>
                    <Input
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary block mb-1">Gene</label>
                    <Input
                      value={editGene}
                      onChange={(e) => setEditGene(e.target.value)}
                      placeholder="e.g., ASIP, SOD1"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">Common Name</label>
                  <Input
                    value={editCommonName}
                    onChange={(e) => setEditCommonName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-secondary block mb-1">Species</label>
                    <select
                      value={editSpecies}
                      onChange={(e) => setEditSpecies(e.target.value as GeneticSpecies)}
                      className="w-full px-3 py-2 border border-hairline rounded-md bg-surface text-sm"
                    >
                      {SPECIES_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-secondary block mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as GeneticMarkerCategory)}
                      className="w-full px-3 py-2 border border-hairline rounded-md bg-surface text-sm"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-hairline rounded-md bg-surface text-sm resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editIsCommon}
                    onChange={(e) => setEditIsCommon(e.target.checked)}
                    className="rounded"
                  />
                  Show in default UI (common marker)
                </label>
              </>
            )}

            {/* Reject confirmation */}
            {actionMode === "reject" && (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Are you sure you want to reject this marker? This will delete it from the
                  pending queue.
                </p>
                <div className="mt-3 p-3 bg-surface rounded border border-hairline">
                  <div className="font-mono text-sm">{actionMarker.code}</div>
                  <div className="font-medium">{actionMarker.commonName}</div>
                  <div className="text-xs text-secondary">Source: {actionMarker.source}</div>
                </div>
              </div>
            )}

            {/* Merge selector */}
            {actionMode === "merge" && (
              <>
                <p className="text-sm text-secondary">
                  Merge this pending marker into an existing approved marker. The pending marker
                  will be deleted and any animal results will be linked to the target.
                </p>
                <div className="p-3 bg-surface-alt rounded-lg mb-3">
                  <div className="text-xs text-secondary mb-1">Merging:</div>
                  <div className="font-mono text-sm">{actionMarker.code}</div>
                  <div className="font-medium">{actionMarker.commonName}</div>
                </div>
                <div>
                  <label className="text-xs text-secondary block mb-1">Search target marker</label>
                  <Input
                    value={mergeSearch}
                    onChange={(e) => setMergeSearch(e.target.value)}
                    placeholder="Search by code, name, or gene..."
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-hairline rounded-md">
                  {mergeTargets.length === 0 ? (
                    <div className="p-4 text-center text-secondary text-sm">
                      No approved markers found
                    </div>
                  ) : (
                    mergeTargets.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMergeTargetId(m.id)}
                        className={`w-full p-3 text-left hover:bg-surface-hover border-b border-hairline last:border-b-0 ${
                          mergeTargetId === m.id ? "bg-brand/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-1.5 py-0.5 bg-surface-alt rounded">
                            {m.code}
                          </span>
                          <span className="font-medium text-sm">{m.commonName}</span>
                          {m.gene && (
                            <span className="text-xs text-secondary">({m.gene})</span>
                          )}
                        </div>
                        <div className="text-xs text-secondary mt-1">{m.species} - {CATEGORY_CONFIG[m.category].label}</div>
                      </button>
                    ))
                  )}
                </div>
                {mergeTargetId && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-sm text-green-700 dark:text-green-300">
                    Will merge into: {mergeTargets.find((m) => m.id === mergeTargetId)?.commonName}
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-hairline">
              <Button variant="outline" onClick={closeAction} disabled={actionLoading}>
                Cancel
              </Button>
              {actionMode === "approve" && (
                <Button onClick={handleApprove} disabled={actionLoading || !editCode || !editCommonName}>
                  {actionLoading ? "Approving..." : "Approve Marker"}
                </Button>
              )}
              {actionMode === "reject" && (
                <Button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {actionLoading ? "Rejecting..." : "Reject Marker"}
                </Button>
              )}
              {actionMode === "merge" && (
                <Button onClick={handleMerge} disabled={actionLoading || !mergeTargetId}>
                  {actionLoading ? "Merging..." : "Merge Marker"}
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default GeneticsAdminTab;
