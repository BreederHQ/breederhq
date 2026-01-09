// apps/animals/src/components/TitlesTab.tsx
// Titles tab for animal detail view - shows earned titles and allows management

import React, { useEffect, useState, useCallback } from "react";
import { DatePicker } from "@bhq/ui";
import {
  makeApi,
  type AnimalTitle,
  type TitleDefinition,
  type TitleStatus,
  type TitleCategory,
} from "../api";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type AnimalRow = {
  id: number;
  name: string;
  species?: string;
  sex?: string;
  titlePrefix?: string | null;
  titleSuffix?: string | null;
};

type Mode = "view" | "edit";

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper Components
 * ───────────────────────────────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<TitleCategory, string> = {
  CONFORMATION: "Conformation",
  OBEDIENCE: "Obedience",
  AGILITY: "Agility",
  FIELD: "Field",
  HERDING: "Herding",
  TRACKING: "Tracking",
  RALLY: "Rally",
  PRODUCING: "Producing",
  BREED_SPECIFIC: "Breed Specific",
  PERFORMANCE: "Performance",
  OTHER: "Other",
};

const STATUS_LABELS: Record<TitleStatus, string> = {
  IN_PROGRESS: "In Progress",
  EARNED: "Earned",
  VERIFIED: "Verified",
};

function StatusBadge({ status, verified }: { status: TitleStatus; verified: boolean }) {
  const baseClass = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";

  if (verified) {
    return (
      <span className={`${baseClass} bg-green-500/20 text-green-400 border border-green-500/30`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Verified
      </span>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <span className={`${baseClass} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`}>
        In Progress
      </span>
    );
  }

  return (
    <span className={`${baseClass} bg-blue-500/20 text-blue-400 border border-blue-500/30`}>
      Earned
    </span>
  );
}

function TitleCard({
  title,
  onEdit,
  onDelete,
  mode,
}: {
  title: AnimalTitle;
  onEdit: () => void;
  onDelete: () => void;
  mode: Mode;
}) {
  const def = title.titleDefinition;

  return (
    <div className="bg-surface border border-hairline rounded-lg p-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-[hsl(var(--brand-orange))]">
              {def.abbreviation}
            </span>
            <span className="text-sm text-secondary">
              {def.fullName}
            </span>
            <StatusBadge status={title.status} verified={title.verified} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
            {def.organization && (
              <span>{def.organization}</span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-white/5">
              {CATEGORY_LABELS[def.category]}
            </span>
            {title.dateEarned && (
              <span>
                Earned: {new Date(title.dateEarned).toLocaleDateString()}
              </span>
            )}
          </div>

          {(title.pointsEarned != null || title.majorWins != null) && (
            <div className="mt-2 flex gap-4 text-xs">
              {title.pointsEarned != null && (
                <span className="text-secondary">
                  <span className="font-medium text-primary">{title.pointsEarned}</span> points
                </span>
              )}
              {title.majorWins != null && title.majorWins > 0 && (
                <span className="text-secondary">
                  <span className="font-medium text-primary">{title.majorWins}</span> majors
                </span>
              )}
            </div>
          )}

          {(title.eventName || title.eventLocation || title.handlerName) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
              {title.eventName && (
                <span>Event: {title.eventName}</span>
              )}
              {title.eventLocation && (
                <span>Location: {title.eventLocation}</span>
              )}
              {title.handlerName && (
                <span>Handler: {title.handlerName}</span>
              )}
            </div>
          )}

          {title.registryRef && (
            <div className="mt-1 text-xs text-secondary">
              Ref: {title.registryRef}
            </div>
          )}

          {title.notes && (
            <div className="mt-2 text-xs text-secondary italic">
              {title.notes}
            </div>
          )}
        </div>

        {mode === "edit" && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded hover:bg-white/10 text-secondary hover:text-primary transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-500/20 text-secondary hover:text-red-400 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Add Title Modal
 * ───────────────────────────────────────────────────────────────────────────── */

function AddTitleModal({
  animal,
  definitions,
  existingTitleIds,
  onAdd,
  onClose,
}: {
  animal: AnimalRow;
  definitions: TitleDefinition[];
  existingTitleIds: Set<number>;
  onAdd: (payload: {
    titleDefinitionId: number;
    dateEarned?: string;
    status?: TitleStatus;
    pointsEarned?: number;
    majorWins?: number;
    eventName?: string;
    eventLocation?: string;
    handlerName?: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedDefId, setSelectedDefId] = useState<number | null>(null);
  const [dateEarned, setDateEarned] = useState("");
  const [status, setStatus] = useState<TitleStatus>("EARNED");
  const [pointsEarned, setPointsEarned] = useState("");
  const [majorWins, setMajorWins] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [handlerName, setHandlerName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TitleCategory | "">("");
  const [orgFilter, setOrgFilter] = useState("");

  // Filter definitions to exclude already-earned titles
  const availableDefinitions = definitions.filter(d => !existingTitleIds.has(d.id));

  // Get unique organizations for filter dropdown
  const availableOrgs = [...new Set(availableDefinitions.map(d => d.organization || "Other"))].sort();

  // Apply search, category, and organization filters
  const filteredDefinitions = availableDefinitions.filter(d => {
    if (categoryFilter && d.category !== categoryFilter) return false;
    if (orgFilter && (d.organization || "Other") !== orgFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.abbreviation.toLowerCase().includes(q) ||
        d.fullName.toLowerCase().includes(q) ||
        (d.organization?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Group filtered definitions by organization for better display
  const groupedByOrg = filteredDefinitions.reduce((acc, def) => {
    const org = def.organization || "Other";
    if (!acc[org]) acc[org] = [];
    acc[org].push(def);
    return acc;
  }, {} as Record<string, TitleDefinition[]>);

  // Sort organizations for consistent display
  const orgOrder: Record<string, number> = {
    "AQHA": 1, "AQHA Racing": 2, "APHA": 3,
    "USDF": 10, "USEA": 11, "USHJA": 12,
    "AHA": 20, "AMHA": 21,
    "Jockey Club": 30,
    "AKC": 40, "UKC": 41,
    "TICA": 50,
    "Breed Club": 90, "Other": 100,
  };
  const sortedOrgs = Object.keys(groupedByOrg).sort((a, b) =>
    (orgOrder[a] ?? 50) - (orgOrder[b] ?? 50)
  );

  const selectedDef = definitions.find(d => d.id === selectedDefId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDefId) return;

    setSaving(true);
    try {
      await onAdd({
        titleDefinitionId: selectedDefId,
        dateEarned: dateEarned || undefined,
        status,
        pointsEarned: pointsEarned ? parseFloat(pointsEarned) : undefined,
        majorWins: majorWins ? parseInt(majorWins, 10) : undefined,
        eventName: eventName || undefined,
        eventLocation: eventLocation || undefined,
        handlerName: handlerName || undefined,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(var(--surface))] border border-hairline rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
          <h3 className="font-semibold">Add Title</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-secondary hover:text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
          {/* Title Selection */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Select Title
            </label>

            <div className="flex flex-wrap gap-2 mb-2">
              <input
                type="text"
                placeholder="Search titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-1.5 bg-white/5 border border-hairline rounded-md text-sm placeholder:text-secondary/50 focus:outline-none focus:border-white/30"
              />
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="px-2 py-1.5 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              >
                <option value="">All Organizations</option>
                {availableOrgs.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TitleCategory | "")}
                className="px-2 py-1.5 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="max-h-48 overflow-y-auto border border-hairline rounded-md bg-white/5">
              {filteredDefinitions.length === 0 ? (
                <div className="p-4 text-center text-secondary text-sm">
                  {availableDefinitions.length === 0
                    ? "All available titles have been added"
                    : "No titles match your search"}
                </div>
              ) : (
                sortedOrgs.map(org => (
                  <div key={org}>
                    {/* Organization header */}
                    <div className="sticky top-0 px-3 py-1.5 bg-white/10 text-xs font-semibold text-secondary border-b border-hairline">
                      {org}
                    </div>
                    {/* Titles in this organization */}
                    {groupedByOrg[org].map(def => (
                      <button
                        key={def.id}
                        type="button"
                        onClick={() => setSelectedDefId(def.id)}
                        className={`w-full px-3 py-2 text-left hover:bg-white/5 transition-colors border-b border-hairline last:border-b-0 ${
                          selectedDefId === def.id ? "bg-white/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[hsl(var(--brand-orange))]">
                            {def.abbreviation}
                          </span>
                          <span className="text-sm text-secondary truncate">
                            {def.fullName}
                          </span>
                        </div>
                        <div className="text-xs text-secondary mt-0.5">
                          <span>{CATEGORY_LABELS[def.category]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {selectedDef && (
              <div className="mt-2 p-2 bg-white/5 rounded text-sm">
                Selected: <span className="font-bold text-[hsl(var(--brand-orange))]">{selectedDef.abbreviation}</span>
                {" "}{selectedDef.fullName}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TitleStatus)}
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            >
              <option value="EARNED">Earned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>

          {/* Date Earned */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Date Earned
            </label>
            <DatePicker
              value={dateEarned}
              onChange={(e) => setDateEarned(e.currentTarget.value)}
              inputClassName="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Points & Majors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Points Earned
              </label>
              <input
                type="number"
                step="0.5"
                value={pointsEarned}
                onChange={(e) => setPointsEarned(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Major Wins
              </label>
              <input
                type="number"
                value={majorWins}
                onChange={(e) => setMajorWins(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Westminster 2024"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Event Location
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., New York, NY"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Handler */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Handler Name
            </label>
            <input
              type="text"
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              placeholder="Person who handled/showed the animal"
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30 resize-none"
            />
          </div>
        </form>

        <div className="px-4 py-3 border-t border-hairline flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedDefId || saving}
            className="px-4 py-2 text-sm font-medium bg-[hsl(var(--brand-orange))] text-white rounded-md hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Adding..." : "Add Title"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Edit Title Modal
 * ───────────────────────────────────────────────────────────────────────────── */

function EditTitleModal({
  title,
  onSave,
  onClose,
}: {
  title: AnimalTitle;
  onSave: (payload: {
    dateEarned?: string | null;
    status?: TitleStatus;
    pointsEarned?: number | null;
    majorWins?: number | null;
    eventName?: string | null;
    eventLocation?: string | null;
    handlerName?: string | null;
    verified?: boolean;
    verifiedBy?: string | null;
    registryRef?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [dateEarned, setDateEarned] = useState(title.dateEarned?.split("T")[0] || "");
  const [status, setStatus] = useState<TitleStatus>(title.status);
  const [pointsEarned, setPointsEarned] = useState(title.pointsEarned?.toString() || "");
  const [majorWins, setMajorWins] = useState(title.majorWins?.toString() || "");
  const [eventName, setEventName] = useState(title.eventName || "");
  const [eventLocation, setEventLocation] = useState(title.eventLocation || "");
  const [handlerName, setHandlerName] = useState(title.handlerName || "");
  const [verified, setVerified] = useState(title.verified);
  const [verifiedBy, setVerifiedBy] = useState(title.verifiedBy || "");
  const [registryRef, setRegistryRef] = useState(title.registryRef || "");
  const [notes, setNotes] = useState(title.notes || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    try {
      await onSave({
        dateEarned: dateEarned || null,
        status,
        pointsEarned: pointsEarned ? parseFloat(pointsEarned) : null,
        majorWins: majorWins ? parseInt(majorWins, 10) : null,
        eventName: eventName || null,
        eventLocation: eventLocation || null,
        handlerName: handlerName || null,
        verified,
        verifiedBy: verifiedBy || null,
        registryRef: registryRef || null,
        notes: notes || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const def = title.titleDefinition;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(var(--surface))] border border-hairline rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Edit Title</h3>
            <div className="text-sm text-secondary">
              <span className="font-bold text-[hsl(var(--brand-orange))]">{def.abbreviation}</span>
              {" "}{def.fullName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-secondary hover:text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TitleStatus)}
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            >
              <option value="EARNED">Earned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>

          {/* Date Earned */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Date Earned
            </label>
            <DatePicker
              value={dateEarned}
              onChange={(e) => setDateEarned(e.currentTarget.value)}
              inputClassName="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Points & Majors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Points Earned
              </label>
              <input
                type="number"
                step="0.5"
                value={pointsEarned}
                onChange={(e) => setPointsEarned(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Major Wins
              </label>
              <input
                type="number"
                value={majorWins}
                onChange={(e) => setMajorWins(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Westminster 2024"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Event Location
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., New York, NY"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Handler */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Handler Name
            </label>
            <input
              type="text"
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              placeholder="Person who handled/showed the animal"
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Verification */}
          <div className="space-y-3 p-3 bg-white/5 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="w-4 h-4 rounded border-hairline bg-white/5"
              />
              <span className="text-sm font-medium">Verified</span>
            </label>

            {verified && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    Verified By
                  </label>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                    placeholder="e.g., AKC Registry"
                    className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    Registry Reference
                  </label>
                  <input
                    type="text"
                    value={registryRef}
                    onChange={(e) => setRegistryRef(e.target.value)}
                    placeholder="Reference number"
                    className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
                  />
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30 resize-none"
            />
          </div>
        </form>

        <div className="px-4 py-3 border-t border-hairline flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-[hsl(var(--brand-orange))] text-white rounded-md hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function TitlesTab({
  animal,
  mode,
}: {
  animal: AnimalRow;
  mode: Mode;
}) {
  const [titles, setTitles] = useState<AnimalTitle[]>([]);
  const [definitions, setDefinitions] = useState<TitleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState<AnimalTitle | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load titles and definitions
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [titlesData, defsData] = await Promise.all([
        api.animals.titles.list(animal.id),
        api.titleDefinitions.list({ species: (animal.species || "DOG") as any }),
      ]);
      setTitles(titlesData);
      setDefinitions(defsData);
    } catch (err: any) {
      setError(err.message || "Failed to load titles");
    } finally {
      setLoading(false);
    }
  }, [animal.id, animal.species]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group titles by category
  const titlesByCategory = titles.reduce((acc, title) => {
    const cat = title.titleDefinition.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(title);
    return acc;
  }, {} as Record<TitleCategory, AnimalTitle[]>);

  const existingTitleIds = new Set(titles.map(t => t.titleDefinitionId));

  // Handlers
  async function handleAddTitle(payload: Parameters<typeof api.animals.titles.add>[1]) {
    await api.animals.titles.add(animal.id, payload);
    await loadData();
  }

  async function handleUpdateTitle(
    titleId: number,
    payload: Parameters<typeof api.animals.titles.update>[2]
  ) {
    await api.animals.titles.update(animal.id, titleId, payload);
    await loadData();
  }

  async function handleDeleteTitle(titleId: number) {
    setDeletingId(titleId);
    try {
      await api.animals.titles.remove(animal.id, titleId);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  }

  // Title string display
  const titleString = [animal.titlePrefix, animal.name, animal.titleSuffix]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <div className="p-8 text-center text-secondary">
        <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" />
        Loading titles...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-2">Error loading titles</div>
        <div className="text-secondary text-sm">{error}</div>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 text-sm font-medium bg-white/10 rounded-md hover:bg-white/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title string */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Titles</h3>
          {titles.length > 0 && (
            <div className="text-sm text-secondary mt-1">
              Full name: <span className="text-[hsl(var(--brand-orange))] font-medium">{titleString}</span>
            </div>
          )}
        </div>

        {mode === "edit" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-sm font-medium bg-[hsl(var(--brand-orange))] text-white rounded-md hover:bg-[hsl(var(--brand-orange))]/90 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Title
          </button>
        )}
      </div>

      {/* Summary stats */}
      {titles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--brand-orange))]">
              {titles.length}
            </div>
            <div className="text-xs text-secondary">Total Titles</div>
          </div>
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {titles.filter(t => t.verified).length}
            </div>
            <div className="text-xs text-secondary">Verified</div>
          </div>
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {titles.filter(t => t.titleDefinition.prefixTitle).length}
            </div>
            <div className="text-xs text-secondary">Prefix Titles</div>
          </div>
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {titles.filter(t => t.titleDefinition.suffixTitle).length}
            </div>
            <div className="text-xs text-secondary">Suffix Titles</div>
          </div>
        </div>
      )}

      {/* Titles by category */}
      {titles.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <div className="text-4xl mb-3">🏆</div>
          <div className="font-medium">No titles yet</div>
          <div className="text-sm mt-1">
            {mode === "edit"
              ? "Click \"Add Title\" to record earned titles"
              : "This animal has no recorded titles"}
          </div>
        </div>
      ) : (
        Object.entries(titlesByCategory).map(([category, categoryTitles]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-secondary mb-3">
              {CATEGORY_LABELS[category as TitleCategory]}
            </h4>
            <div className="space-y-2">
              {categoryTitles.map(title => (
                <TitleCard
                  key={title.id}
                  title={title}
                  mode={mode}
                  onEdit={() => setEditingTitle(title)}
                  onDelete={() => {
                    if (confirm(`Remove ${title.titleDefinition.abbreviation} title?`)) {
                      handleDeleteTitle(title.id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modals */}
      {showAddModal && (
        <AddTitleModal
          animal={animal}
          definitions={definitions}
          existingTitleIds={existingTitleIds}
          onAdd={handleAddTitle}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingTitle && (
        <EditTitleModal
          title={editingTitle}
          onSave={(payload) => handleUpdateTitle(editingTitle.id, payload)}
          onClose={() => setEditingTitle(null)}
        />
      )}
    </div>
  );
}

export default TitlesTab;
