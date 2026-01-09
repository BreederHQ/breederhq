// apps/animals/src/components/CompetitionsTab.tsx
// Competitions tab for animal detail view - shows competition entries and stats

import React, { useEffect, useState, useCallback } from "react";
import { DatePicker } from "@bhq/ui";
import {
  makeApi,
  type CompetitionEntry,
  type CompetitionStats,
  type CompetitionType,
} from "../api";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type AnimalRow = {
  id: number;
  name: string;
  species?: string;
};

type Mode = "view" | "edit";

/* ─────────────────────────────────────────────────────────────────────────────
 * Constants
 * ───────────────────────────────────────────────────────────────────────────── */

const COMPETITION_TYPE_LABELS: Record<CompetitionType, string> = {
  CONFORMATION_SHOW: "Conformation Show",
  OBEDIENCE_TRIAL: "Obedience Trial",
  AGILITY_TRIAL: "Agility Trial",
  FIELD_TRIAL: "Field Trial",
  HERDING_TRIAL: "Herding Trial",
  TRACKING_TEST: "Tracking Test",
  RALLY_TRIAL: "Rally Trial",
  RACE: "Race",
  PERFORMANCE_TEST: "Performance Test",
  BREED_SPECIALTY: "Breed Specialty",
  OTHER: "Other",
};

const COMPETITION_TYPE_EMOJIS: Record<CompetitionType, string> = {
  CONFORMATION_SHOW: "🏆",
  OBEDIENCE_TRIAL: "🎓",
  AGILITY_TRIAL: "🏃",
  FIELD_TRIAL: "🦆",
  HERDING_TRIAL: "🐑",
  TRACKING_TEST: "👃",
  RALLY_TRIAL: "🎯",
  RACE: "🏇",
  PERFORMANCE_TEST: "⭐",
  BREED_SPECIALTY: "🎖️",
  OTHER: "📋",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper Components
 * ───────────────────────────────────────────────────────────────────────────── */

function PlacementBadge({ placement, label }: { placement: number | null; label: string | null }) {
  if (!placement && !label) return null;

  const baseClass = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold";

  if (placement === 1) {
    return (
      <span className={`${baseClass} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`}>
        🥇 {label || "1st Place"}
      </span>
    );
  }
  if (placement === 2) {
    return (
      <span className={`${baseClass} bg-gray-300/20 text-gray-300 border border-gray-300/30`}>
        🥈 {label || "2nd Place"}
      </span>
    );
  }
  if (placement === 3) {
    return (
      <span className={`${baseClass} bg-orange-600/20 text-orange-400 border border-orange-600/30`}>
        🥉 {label || "3rd Place"}
      </span>
    );
  }
  if (placement === 4) {
    return (
      <span className={`${baseClass} bg-blue-500/20 text-blue-400 border border-blue-500/30`}>
        4th {label ? `- ${label}` : "Place"}
      </span>
    );
  }

  if (label) {
    return (
      <span className={`${baseClass} bg-purple-500/20 text-purple-400 border border-purple-500/30`}>
        {label}
      </span>
    );
  }

  return null;
}

function CompetitionCard({
  entry,
  onEdit,
  onDelete,
  mode,
}: {
  entry: CompetitionEntry;
  onEdit: () => void;
  onDelete: () => void;
  mode: Mode;
}) {
  const eventDate = new Date(entry.eventDate);

  return (
    <div className="bg-surface border border-hairline rounded-lg p-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">
              {COMPETITION_TYPE_EMOJIS[entry.competitionType]}
            </span>
            <span className="font-semibold">{entry.eventName}</span>
            <PlacementBadge placement={entry.placement} label={entry.placementLabel} />
            {entry.isMajorWin && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                MAJOR
              </span>
            )}
            {entry.qualifyingScore && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                Q
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
            <span>{eventDate.toLocaleDateString()}</span>
            {entry.location && <span>{entry.location}</span>}
            {entry.organization && <span>{entry.organization}</span>}
            <span className="px-1.5 py-0.5 rounded bg-white/5">
              {COMPETITION_TYPE_LABELS[entry.competitionType]}
            </span>
          </div>

          {entry.className && (
            <div className="mt-1 text-xs text-secondary">
              Class: {entry.className}
            </div>
          )}

          <div className="mt-2 flex gap-4 text-xs">
            {entry.pointsEarned != null && entry.pointsEarned > 0 && (
              <span className="text-secondary">
                <span className="font-medium text-[hsl(var(--brand-orange))]">{entry.pointsEarned}</span> points
              </span>
            )}
            {entry.score != null && (
              <span className="text-secondary">
                Score: <span className="font-medium text-primary">{entry.score}</span>
                {entry.scoreMax != null && <span>/{entry.scoreMax}</span>}
              </span>
            )}
          </div>

          {entry.judgeName && (
            <div className="mt-1 text-xs text-secondary">
              Judge: {entry.judgeName}
            </div>
          )}

          {entry.notes && (
            <div className="mt-2 text-xs text-secondary italic">
              {entry.notes}
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
 * Add/Edit Modal
 * ───────────────────────────────────────────────────────────────────────────── */

function CompetitionModal({
  entry,
  onSave,
  onClose,
}: {
  entry: CompetitionEntry | null;
  onSave: (payload: Omit<CompetitionEntry, "id" | "animalId">) => Promise<void>;
  onClose: () => void;
}) {
  const isNew = !entry;

  const [eventName, setEventName] = useState(entry?.eventName || "");
  const [eventDate, setEventDate] = useState(entry?.eventDate?.split("T")[0] || "");
  const [competitionType, setCompetitionType] = useState<CompetitionType>(entry?.competitionType || "CONFORMATION_SHOW");
  const [location, setLocation] = useState(entry?.location || "");
  const [organization, setOrganization] = useState(entry?.organization || "");
  const [className, setClassName] = useState(entry?.className || "");
  const [placement, setPlacement] = useState(entry?.placement?.toString() || "");
  const [placementLabel, setPlacementLabel] = useState(entry?.placementLabel || "");
  const [pointsEarned, setPointsEarned] = useState(entry?.pointsEarned?.toString() || "");
  const [isMajorWin, setIsMajorWin] = useState(entry?.isMajorWin || false);
  const [qualifyingScore, setQualifyingScore] = useState(entry?.qualifyingScore || false);
  const [score, setScore] = useState(entry?.score?.toString() || "");
  const [scoreMax, setScoreMax] = useState(entry?.scoreMax?.toString() || "");
  const [judgeName, setJudgeName] = useState(entry?.judgeName || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName || !eventDate || !competitionType) return;

    setSaving(true);
    try {
      await onSave({
        eventName,
        eventDate,
        competitionType,
        location: location || null,
        organization: organization || null,
        className: className || null,
        placement: placement ? parseInt(placement, 10) : null,
        placementLabel: placementLabel || null,
        pointsEarned: pointsEarned ? parseFloat(pointsEarned) : null,
        isMajorWin,
        qualifyingScore,
        score: score ? parseFloat(score) : null,
        scoreMax: scoreMax ? parseFloat(scoreMax) : null,
        judgeName: judgeName || null,
        notes: notes || null,
        // Racing-specific fields (default to null for non-racing entries)
        prizeMoneyCents: null,
        trackName: null,
        trackSurface: null,
        distanceFurlongs: null,
        distanceMeters: null,
        raceGrade: null,
        finishTime: null,
        speedFigure: null,
        // Handler/rider info
        handlerName: null,
        trainerName: null,
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
          <h3 className="font-semibold">{isNew ? "Add Competition Entry" : "Edit Competition Entry"}</h3>
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
          {/* Event Name */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Event Name *
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Westminster Kennel Club"
              required
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Date and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Event Date *
              </label>
              <DatePicker
                value={eventDate}
                onChange={(e) => setEventDate(e.currentTarget.value)}
                inputClassName="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Competition Type *
              </label>
              <select
                value={competitionType}
                onChange={(e) => setCompetitionType(e.target.value as CompetitionType)}
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              >
                {Object.entries(COMPETITION_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location and Organization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="New York, NY"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="AKC"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Class Name */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Class
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g., Open Dogs, Excellent B Standard"
              className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Placement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Placement
              </label>
              <input
                type="number"
                min="1"
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                placeholder="1, 2, 3..."
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Placement Label
              </label>
              <input
                type="text"
                value={placementLabel}
                onChange={(e) => setPlacementLabel(e.target.value)}
                placeholder="Best of Breed, Winners Dog"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Points and Major/Q */}
          <div className="grid grid-cols-3 gap-4">
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
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isMajorWin}
                  onChange={(e) => setIsMajorWin(e.target.checked)}
                  className="w-4 h-4 rounded border-hairline bg-white/5"
                />
                <span className="text-sm font-medium">Major Win</span>
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={qualifyingScore}
                  onChange={(e) => setQualifyingScore(e.target.checked)}
                  className="w-4 h-4 rounded border-hairline bg-white/5"
                />
                <span className="text-sm font-medium">Qualifying (Q)</span>
              </label>
            </div>
          </div>

          {/* Score (for performance events) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Score
              </label>
              <input
                type="number"
                step="0.01"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="For agility time, obedience score"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Max Score
              </label>
              <input
                type="number"
                step="0.01"
                value={scoreMax}
                onChange={(e) => setScoreMax(e.target.value)}
                placeholder="e.g., 200"
                className="w-full px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Judge */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Judge
            </label>
            <input
              type="text"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              placeholder="Judge name"
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
            disabled={!eventName || !eventDate || saving}
            className="px-4 py-2 text-sm font-medium bg-[hsl(var(--brand-orange))] text-white rounded-md hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : isNew ? "Add Entry" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function CompetitionsTab({
  animal,
  mode,
}: {
  animal: AnimalRow;
  mode: Mode;
}) {
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [stats, setStats] = useState<CompetitionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CompetitionEntry | null>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<CompetitionType | "">("");
  const [yearFilter, setYearFilter] = useState<number | "">("");

  // Load entries and stats
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesData, statsData] = await Promise.all([
        api.animals.competitions.list(animal.id, {
          type: typeFilter || undefined,
          year: yearFilter || undefined,
        }),
        api.animals.competitions.stats(animal.id),
      ]);
      setEntries(entriesData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || "Failed to load competition data");
    } finally {
      setLoading(false);
    }
  }, [animal.id, typeFilter, yearFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  async function handleAddEntry(payload: Omit<CompetitionEntry, "id" | "animalId">) {
    await api.animals.competitions.add(animal.id, payload as any);
    await loadData();
  }

  async function handleUpdateEntry(entryId: number, payload: Omit<CompetitionEntry, "id" | "animalId">) {
    await api.animals.competitions.update(animal.id, entryId, payload);
    await loadData();
  }

  async function handleDeleteEntry(entryId: number) {
    await api.animals.competitions.remove(animal.id, entryId);
    await loadData();
  }

  // Group entries by year
  const entriesByYear = entries.reduce((acc, entry) => {
    const year = new Date(entry.eventDate).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {} as Record<number, CompetitionEntry[]>);

  const years = Object.keys(entriesByYear)
    .map(Number)
    .sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="p-8 text-center text-secondary">
        <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" />
        Loading competitions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-2">Error loading competitions</div>
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
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Competition Record</h3>
          {stats && stats.totalEntries > 0 && (
            <div className="text-sm text-secondary mt-1">
              {stats.totalEntries} entries · {stats.totalPoints} total points · {stats.wins} wins
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
            Add Entry
          </button>
        )}
      </div>

      {/* Stats summary */}
      {stats && stats.totalEntries > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--brand-orange))]">
              {stats.totalEntries}
            </div>
            <div className="text-xs text-secondary">Total Entries</div>
          </div>
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {stats.wins}
            </div>
            <div className="text-xs text-secondary">Wins</div>
          </div>
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">
              {stats.majorWins}
            </div>
            <div className="text-xs text-secondary">Major Wins</div>
          </div>
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {stats.qualifyingScores}
            </div>
            <div className="text-xs text-secondary">Q Scores</div>
          </div>
          <div className="bg-surface border border-hairline rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {stats.totalPoints.toFixed(1)}
            </div>
            <div className="text-xs text-secondary">Total Points</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {entries.length > 0 && (
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CompetitionType | "")}
            className="px-3 py-1.5 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
          >
            <option value="">All Types</option>
            {Object.entries(COMPETITION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {stats && stats.yearsActive.length > 1 && (
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value, 10) : "")}
              className="px-3 py-1.5 bg-white/5 border border-hairline rounded-md text-sm focus:outline-none focus:border-white/30"
            >
              <option value="">All Years</option>
              {stats.yearsActive.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Entries by year */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <div className="text-4xl mb-3">🏅</div>
          <div className="font-medium">No competition entries yet</div>
          <div className="text-sm mt-1">
            {mode === "edit"
              ? "Click \"Add Entry\" to log shows, trials, and races"
              : "This animal has no recorded competition entries"}
          </div>
        </div>
      ) : (
        years.map(year => (
          <div key={year}>
            <h4 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
              <span>{year}</span>
              <span className="text-xs font-normal">
                ({entriesByYear[year].length} {entriesByYear[year].length === 1 ? "entry" : "entries"})
              </span>
            </h4>
            <div className="space-y-2">
              {entriesByYear[year].map(entry => (
                <CompetitionCard
                  key={entry.id}
                  entry={entry}
                  mode={mode}
                  onEdit={() => setEditingEntry(entry)}
                  onDelete={() => {
                    if (confirm(`Delete "${entry.eventName}" entry?`)) {
                      handleDeleteEntry(entry.id);
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
        <CompetitionModal
          entry={null}
          onSave={handleAddEntry}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingEntry && (
        <CompetitionModal
          entry={editingEntry}
          onSave={(payload) => handleUpdateEntry(editingEntry.id, payload)}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

export default CompetitionsTab;
