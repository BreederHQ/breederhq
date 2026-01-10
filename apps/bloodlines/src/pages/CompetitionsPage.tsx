// apps/bloodlines/src/pages/CompetitionsPage.tsx
import * as React from "react";
import { PageHeader, Button, DatePicker } from "@bhq/ui";

/* ───────────────── Types ───────────────── */

interface Animal {
  id: number;
  name: string | null;
  registeredName: string | null;
  species: string;
  titlePrefix: string | null;
  titleSuffix: string | null;
}

interface CompetitionEntry {
  id: number;
  animalId: number;
  eventName: string;
  eventDate: string;
  location: string | null;
  organization: string | null;
  competitionType: string;
  className: string | null;
  placement: number | null;
  placementLabel: string | null;
  pointsEarned: number | null;
  isMajorWin: boolean;
  qualifyingScore: boolean;
  score: number | null;
  scoreMax: number | null;
  judgeName: string | null;
  notes: string | null;
  animal?: Animal;
}

/* ───────────────── Constants ───────────────── */

const COMPETITION_TYPES = [
  { value: "CONFORMATION_SHOW", label: "Conformation Show" },
  { value: "OBEDIENCE_TRIAL", label: "Obedience Trial" },
  { value: "AGILITY_TRIAL", label: "Agility Trial" },
  { value: "FIELD_TRIAL", label: "Field Trial" },
  { value: "HERDING_TRIAL", label: "Herding Trial" },
  { value: "TRACKING_TEST", label: "Tracking Test" },
  { value: "RALLY_TRIAL", label: "Rally Trial" },
  { value: "RACE", label: "Race" },
  { value: "PERFORMANCE_TEST", label: "Performance Test" },
  { value: "BREED_SPECIALTY", label: "Breed Specialty" },
  { value: "OTHER", label: "Other" },
];

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

async function fetchAnimals(): Promise<Animal[]> {
  const res = await fetch("/api/v1/animals?limit=500", {
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch animals");
  const data = await res.json();
  return data.items || [];
}

async function fetchAnimalCompetitions(animalId: number): Promise<CompetitionEntry[]> {
  const res = await fetch(`/api/v1/animals/${animalId}/competitions`, {
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch competitions");
  return res.json();
}

async function addCompetition(
  animalId: number,
  data: Partial<CompetitionEntry>
): Promise<CompetitionEntry> {
  const res = await fetch(`/api/v1/animals/${animalId}/competitions`, {
    method: "POST",
    credentials: "include",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to add competition");
  }
  return res.json();
}

async function deleteCompetition(animalId: number, entryId: number): Promise<void> {
  const res = await fetch(`/api/v1/animals/${animalId}/competitions/${entryId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete competition");
}

/* ───────────────── Type Badge ───────────────── */

function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    CONFORMATION_SHOW: "bg-purple-500/20 text-purple-400",
    OBEDIENCE_TRIAL: "bg-blue-500/20 text-blue-400",
    AGILITY_TRIAL: "bg-green-500/20 text-green-400",
    FIELD_TRIAL: "bg-amber-500/20 text-amber-400",
    HERDING_TRIAL: "bg-orange-500/20 text-orange-400",
    TRACKING_TEST: "bg-teal-500/20 text-teal-400",
    RALLY_TRIAL: "bg-pink-500/20 text-pink-400",
    RACE: "bg-red-500/20 text-red-400",
    PERFORMANCE_TEST: "bg-indigo-500/20 text-indigo-400",
    BREED_SPECIALTY: "bg-cyan-500/20 text-cyan-400",
  };
  const label = COMPETITION_TYPES.find((t) => t.value === type)?.label || type;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorMap[type] || "bg-gray-500/20 text-gray-400"}`}>
      {label}
    </span>
  );
}

/* ───────────────── Add Competition Modal ───────────────── */

interface AddCompetitionModalProps {
  animals: Animal[];
  onClose: () => void;
  onSave: (animalId: number, data: Partial<CompetitionEntry>) => Promise<void>;
}

function AddCompetitionModal({ animals, onClose, onSave }: AddCompetitionModalProps) {
  const [selectedAnimalId, setSelectedAnimalId] = React.useState<number | null>(null);
  const [eventName, setEventName] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [competitionType, setCompetitionType] = React.useState("CONFORMATION_SHOW");
  const [className, setClassName] = React.useState("");
  const [placement, setPlacement] = React.useState("");
  const [placementLabel, setPlacementLabel] = React.useState("");
  const [pointsEarned, setPointsEarned] = React.useState("");
  const [isMajorWin, setIsMajorWin] = React.useState(false);
  const [qualifyingScore, setQualifyingScore] = React.useState(false);
  const [judgeName, setJudgeName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalId || !eventName || !eventDate || !competitionType) return;

    setSaving(true);
    setError(null);

    try {
      await onSave(selectedAnimalId, {
        eventName,
        eventDate,
        location: location || null,
        organization: organization || null,
        competitionType,
        className: className || null,
        placement: placement ? parseInt(placement, 10) : null,
        placementLabel: placementLabel || null,
        pointsEarned: pointsEarned ? parseFloat(pointsEarned) : null,
        isMajorWin,
        qualifyingScore,
        judgeName: judgeName || null,
        notes: notes || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add competition");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface rounded-xl border border-hairline w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-primary mb-4">Add Competition Entry</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Animal *</label>
            <select
              className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
              value={selectedAnimalId || ""}
              onChange={(e) => setSelectedAnimalId(Number(e.target.value) || null)}
              required
            >
              <option value="">Select an animal...</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.registeredName || animal.name || `Animal #${animal.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Event Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Westminster Kennel Club"
                required
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Date *</label>
              <DatePicker
                value={eventDate}
                onChange={(e) => setEventDate(e.currentTarget.value)}
                inputClassName="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Type *</label>
              <select
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={competitionType}
                onChange={(e) => setCompetitionType(e.target.value)}
                required
              >
                {COMPETITION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Organization</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="AKC, UKC, etc."
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="New York, NY"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Class</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Open Dogs, Excellent B"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Placement</label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                placeholder="1"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Placement Label</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={placementLabel}
                onChange={(e) => setPlacementLabel(e.target.value)}
                placeholder="Best of Breed"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Points</label>
              <input
                type="number"
                step="0.5"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={pointsEarned}
                onChange={(e) => setPointsEarned(e.target.value)}
                placeholder="0"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMajorWin}
                onChange={(e) => setIsMajorWin(e.target.checked)}
                className="w-4 h-4 rounded border-hairline bg-surface-strong"
              />
              <span className="text-sm text-primary">Major Win</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={qualifyingScore}
                onChange={(e) => setQualifyingScore(e.target.checked)}
                className="w-4 h-4 rounded border-hairline bg-surface-strong"
              />
              <span className="text-sm text-primary">Qualifying Score</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Judge</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              placeholder="Judge name"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !selectedAnimalId || !eventName || !eventDate}>
              {saving ? "Adding..." : "Add Entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function CompetitionsPage() {
  const [animals, setAnimals] = React.useState<Animal[]>([]);
  const [allCompetitions, setAllCompetitions] = React.useState<(CompetitionEntry & { animal: Animal })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);

  // Filters
  const [filterType, setFilterType] = React.useState<string>("");
  const [filterOrg, setFilterOrg] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const animalsData = await fetchAnimals();
      setAnimals(animalsData);

      // Fetch competitions for all animals
      const competitionsPromises = animalsData.map(async (animal) => {
        try {
          const comps = await fetchAnimalCompetitions(animal.id);
          return comps.map((c) => ({ ...c, animal }));
        } catch {
          return [];
        }
      });

      const compsResults = await Promise.all(competitionsPromises);
      // Sort by date descending
      const sorted = compsResults.flat().sort((a, b) => {
        return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      });
      setAllCompetitions(sorted);
    } catch (err) {
      console.error("Failed to load competitions data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCompetition = async (animalId: number, data: Partial<CompetitionEntry>) => {
    await addCompetition(animalId, data);
    await loadData();
  };

  const handleDeleteCompetition = async (animalId: number, entryId: number) => {
    if (!confirm("Are you sure you want to remove this competition entry?")) return;
    await deleteCompetition(animalId, entryId);
    await loadData();
  };

  // Get unique types and organizations for filters
  const types = React.useMemo(() => {
    const t = new Set(allCompetitions.map((c) => c.competitionType));
    return Array.from(t).sort();
  }, [allCompetitions]);

  const organizations = React.useMemo(() => {
    const orgs = new Set(allCompetitions.map((c) => c.organization).filter(Boolean));
    return Array.from(orgs).sort() as string[];
  }, [allCompetitions]);

  // Filter competitions
  const filteredCompetitions = React.useMemo(() => {
    return allCompetitions.filter((c) => {
      if (filterType && c.competitionType !== filterType) return false;
      if (filterOrg && c.organization !== filterOrg) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const animalName = (c.animal.registeredName || c.animal.name || "").toLowerCase();
        const eventName = c.eventName.toLowerCase();
        if (!animalName.includes(q) && !eventName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allCompetitions, filterType, filterOrg, searchQuery]);

  // Stats
  const stats = React.useMemo(() => {
    const majorWins = allCompetitions.filter((c) => c.isMajorWin).length;
    const totalPoints = allCompetitions.reduce((sum, c) => sum + (c.pointsEarned || 0), 0);
    const qualifyingScores = allCompetitions.filter((c) => c.qualifyingScore).length;
    return { majorWins, totalPoints, qualifyingScores };
  }, [allCompetitions]);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Competitions" subtitle="Loading..." />
        <div className="mt-8 flex items-center justify-center py-12">
          <div className="animate-pulse text-secondary">Loading competitions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Competitions"
        subtitle={`${allCompetitions.length} entries across ${animals.length} animals`}
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            Add Entry
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="text-sm text-secondary">Total Points</div>
          <div className="text-2xl font-bold text-primary mt-1">{stats.totalPoints.toFixed(1)}</div>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="text-sm text-secondary">Major Wins</div>
          <div className="text-2xl font-bold text-[hsl(var(--brand-orange))] mt-1">{stats.majorWins}</div>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="text-sm text-secondary">Qualifying Scores</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{stats.qualifyingScores}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search events or animals..."
          className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary text-sm w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />

        <select
          className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {COMPETITION_TYPES.find((ct) => ct.value === t)?.label || t}
            </option>
          ))}
        </select>

        <select
          className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary text-sm"
          value={filterOrg}
          onChange={(e) => setFilterOrg(e.target.value)}
        >
          <option value="">All Organizations</option>
          {organizations.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>
      </div>

      {/* Competitions List */}
      <div className="mt-6">
        {filteredCompetitions.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface p-8 text-center">
            <p className="text-secondary">No competition entries found. Log your show results to track progress.</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              Add Your First Entry
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-hairline bg-surface overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-surface-strong">
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Animal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Points</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredCompetitions.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-strong/50">
                    <td className="px-4 py-3 text-sm text-primary whitespace-nowrap">
                      {new Date(c.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`/animals/${c.animal.id}`}
                        className="text-primary hover:text-[hsl(var(--brand-orange))]"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState(null, "", `/animals/${c.animal.id}`);
                          window.dispatchEvent(new PopStateEvent("popstate"));
                        }}
                      >
                        {c.animal.registeredName || c.animal.name || `Animal #${c.animal.id}`}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-primary">{c.eventName}</div>
                      {c.location && <div className="text-xs text-secondary">{c.location}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={c.competitionType} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.placementLabel && (
                          <span className="text-sm font-medium text-primary">{c.placementLabel}</span>
                        )}
                        {c.placement && !c.placementLabel && (
                          <span className="text-sm text-primary">#{c.placement}</span>
                        )}
                        {c.isMajorWin && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[hsl(var(--brand-orange))]/20 text-[hsl(var(--brand-orange))]">
                            MAJOR
                          </span>
                        )}
                        {c.qualifyingScore && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">
                            Q
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-primary">
                      {c.pointsEarned != null ? c.pointsEarned : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteCompetition(c.animal.id, c.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-secondary hover:text-red-400 transition-colors"
                        title="Remove entry"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Competition Modal */}
      {showAddModal && (
        <AddCompetitionModal
          animals={animals}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCompetition}
        />
      )}
    </div>
  );
}
