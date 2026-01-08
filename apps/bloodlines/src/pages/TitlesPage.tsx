// apps/bloodlines/src/pages/TitlesPage.tsx
import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Types ───────────────── */

interface TitleDefinition {
  id: number;
  abbreviation: string;
  fullName: string;
  category: string;
  organization: string | null;
  prefixTitle: boolean;
  suffixTitle: boolean;
  displayOrder: number;
  isProducingTitle: boolean;
}

interface AnimalTitle {
  id: number;
  animalId: number;
  titleDefinitionId: number;
  dateEarned: string | null;
  status: "IN_PROGRESS" | "EARNED" | "VERIFIED";
  pointsEarned: number | null;
  majorWins: number | null;
  verified: boolean;
  registryRef: string | null;
  notes: string | null;
  titleDefinition: TitleDefinition;
  animal?: {
    id: number;
    name: string | null;
    registeredName: string | null;
  };
}

interface Animal {
  id: number;
  name: string | null;
  registeredName: string | null;
  species: string;
  titlePrefix: string | null;
  titleSuffix: string | null;
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

async function fetchAnimals(): Promise<Animal[]> {
  const res = await fetch("/api/v1/animals?limit=500", {
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch animals");
  const data = await res.json();
  return data.items || [];
}

async function fetchTitleDefinitions(species?: string): Promise<TitleDefinition[]> {
  const params = species ? `?species=${species}` : "";
  const res = await fetch(`/api/v1/title-definitions${params}`, {
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch title definitions");
  return res.json();
}

async function fetchAnimalTitles(animalId: number): Promise<AnimalTitle[]> {
  const res = await fetch(`/api/v1/animals/${animalId}/titles`, {
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch animal titles");
  return res.json();
}

async function addAnimalTitle(
  animalId: number,
  data: {
    titleDefinitionId: number;
    dateEarned?: string;
    status?: string;
    eventName?: string;
    eventLocation?: string;
    handlerName?: string;
    notes?: string;
  }
): Promise<AnimalTitle> {
  const res = await fetch(`/api/v1/animals/${animalId}/titles`, {
    method: "POST",
    credentials: "include",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to add title");
  }
  return res.json();
}

async function deleteAnimalTitle(animalId: number, titleId: number): Promise<void> {
  const res = await fetch(`/api/v1/animals/${animalId}/titles/${titleId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete title");
}

/* ───────────────── Status Badge ───────────────── */

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
    EARNED: "bg-green-500/20 text-green-400",
    VERIFIED: "bg-blue-500/20 text-blue-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorMap[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

/* ───────────────── Category Badge ───────────────── */

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    CONFORMATION: "bg-purple-500/20 text-purple-400",
    OBEDIENCE: "bg-blue-500/20 text-blue-400",
    AGILITY: "bg-green-500/20 text-green-400",
    FIELD: "bg-amber-500/20 text-amber-400",
    HERDING: "bg-orange-500/20 text-orange-400",
    TRACKING: "bg-teal-500/20 text-teal-400",
    RALLY: "bg-pink-500/20 text-pink-400",
    PRODUCING: "bg-red-500/20 text-red-400",
    PERFORMANCE: "bg-indigo-500/20 text-indigo-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorMap[category] || "bg-gray-500/20 text-gray-400"}`}>
      {category}
    </span>
  );
}

/* ───────────────── Add Title Modal ───────────────── */

interface AddTitleModalProps {
  animals: Animal[];
  onClose: () => void;
  onSave: (animalId: number, data: {
    titleDefinitionId: number;
    dateEarned?: string;
    eventName?: string;
    eventLocation?: string;
    handlerName?: string;
    notes?: string;
  }) => Promise<void>;
  preSelectedAnimalId?: number | null;
}

function AddTitleModal({ animals, onClose, onSave, preSelectedAnimalId }: AddTitleModalProps) {
  const [selectedAnimalId, setSelectedAnimalId] = React.useState<number | null>(preSelectedAnimalId || null);
  const [selectedTitleId, setSelectedTitleId] = React.useState<number | null>(null);
  const [dateEarned, setDateEarned] = React.useState("");
  const [eventName, setEventName] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [handlerName, setHandlerName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [orgFilter, setOrgFilter] = React.useState("");

  // Species-specific title definitions - loaded when animal is selected
  const [titleDefinitions, setTitleDefinitions] = React.useState<TitleDefinition[]>([]);
  const [loadingTitles, setLoadingTitles] = React.useState(false);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

  // Load title definitions when animal changes
  React.useEffect(() => {
    if (!selectedAnimal) {
      setTitleDefinitions([]);
      setSelectedTitleId(null);
      return;
    }

    let cancelled = false;
    setLoadingTitles(true);
    setSelectedTitleId(null);

    fetchTitleDefinitions(selectedAnimal.species)
      .then((defs) => {
        if (!cancelled) {
          // Filter out producing titles - those are computed from offspring
          setTitleDefinitions(defs.filter((td) => td.category !== "PRODUCING"));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load title definitions:", err);
          setTitleDefinitions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTitles(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAnimal?.id, selectedAnimal?.species]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalId || !selectedTitleId) return;

    setSaving(true);
    setError(null);

    try {
      await onSave(selectedAnimalId, {
        titleDefinitionId: selectedTitleId,
        dateEarned: dateEarned || undefined,
        eventName: eventName || undefined,
        eventLocation: eventLocation || undefined,
        handlerName: handlerName || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add title");
    } finally {
      setSaving(false);
    }
  };

  // Get unique organizations for filter
  const availableOrgs = React.useMemo(() => {
    const orgs = new Set(titleDefinitions.map(td => td.organization || "Other"));
    return Array.from(orgs).sort();
  }, [titleDefinitions]);

  // Filter by org if filter is set
  const filteredTitleDefinitions = React.useMemo(() => {
    if (!orgFilter) return titleDefinitions;
    return titleDefinitions.filter(td => (td.organization || "Other") === orgFilter);
  }, [titleDefinitions, orgFilter]);

  // Group title definitions by organization, then by category within each org
  const titlesByOrgAndCategory = React.useMemo(() => {
    // First group by organization
    const byOrg = new Map<string, TitleDefinition[]>();
    for (const td of filteredTitleDefinitions) {
      const org = td.organization || "Other";
      const existing = byOrg.get(org) || [];
      existing.push(td);
      byOrg.set(org, existing);
    }

    // Then within each org, group by category
    const result = new Map<string, Map<string, TitleDefinition[]>>();
    for (const [org, defs] of byOrg.entries()) {
      const byCategory = new Map<string, TitleDefinition[]>();
      for (const td of defs) {
        const existing = byCategory.get(td.category) || [];
        existing.push(td);
        byCategory.set(td.category, existing);
      }
      result.set(org, byCategory);
    }

    return result;
  }, [filteredTitleDefinitions]);

  // Define organization display order for better UX
  const orgDisplayOrder: Record<string, number> = {
    // Stock breeds
    "AQHA": 1,
    "AQHA Racing": 2,
    "APHA": 3,
    // English disciplines
    "USDF": 10,
    "USEA": 11,
    "USHJA": 12,
    // Breed registries
    "AHA": 20,
    "AMHA": 21,
    // Racing
    "Jockey Club": 30,
    // Other
    "Other": 100,
  };

  const sortedOrgs = React.useMemo(() => {
    return Array.from(titlesByOrgAndCategory.keys()).sort((a, b) => {
      const orderA = orgDisplayOrder[a] ?? 50;
      const orderB = orgDisplayOrder[b] ?? 50;
      return orderA - orderB;
    });
  }, [titlesByOrgAndCategory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface rounded-xl border border-hairline w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-primary mb-4">Add Title</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Animal *</label>
            <select
              className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
              value={selectedAnimalId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedAnimalId(val ? Number(val) : null);
              }}
              required
            >
              <option value="">Select an animal...</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.registeredName || animal.name || `Animal #${animal.id}`} ({animal.species})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Title *</label>
            {!selectedAnimalId ? (
              <div className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-secondary text-sm">
                Select an animal first to see available titles
              </div>
            ) : loadingTitles ? (
              <div className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-secondary text-sm">
                Loading titles...
              </div>
            ) : titleDefinitions.length === 0 ? (
              <div className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-secondary text-sm">
                No title definitions found for {selectedAnimal?.species}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Organization filter */}
                <select
                  className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary text-sm"
                  value={orgFilter}
                  onChange={(e) => {
                    setOrgFilter(e.target.value);
                    setSelectedTitleId(null); // Reset title when org changes
                  }}
                >
                  <option value="">All Organizations</option>
                  {availableOrgs.map((org) => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>

                {/* Title select */}
                <select
                  className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                  value={selectedTitleId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTitleId(val ? Number(val) : null);
                  }}
                  required
                >
                  <option value="">Select a title...</option>
                  {sortedOrgs.map((org) => {
                    const categories = titlesByOrgAndCategory.get(org)!;
                    const categoryEntries = Array.from(categories.entries());

                  // If org has only one category, show as "Org - Category"
                  // If org has multiple categories, show nested structure
                  if (categoryEntries.length === 1) {
                    const [category, defs] = categoryEntries[0];
                    return (
                      <optgroup key={org} label={`${org} — ${category}`}>
                        {defs.map((td) => (
                          <option key={td.id} value={td.id}>
                            {td.abbreviation} — {td.fullName}
                          </option>
                        ))}
                      </optgroup>
                    );
                  }

                  // Multiple categories - create optgroup per category with org prefix
                  return categoryEntries.map(([category, defs]) => (
                    <optgroup key={`${org}-${category}`} label={`${org} — ${category}`}>
                      {defs.map((td) => (
                        <option key={td.id} value={td.id}>
                          {td.abbreviation} — {td.fullName}
                        </option>
                      ))}
                    </optgroup>
                  ));
                })}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Date Earned</label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
              value={dateEarned}
              onChange={(e) => setDateEarned(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Event Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Westminster 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Event Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Handler Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary"
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              placeholder="Person who handled/showed the animal"
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
            <Button type="submit" disabled={saving || !selectedAnimalId || !selectedTitleId}>
              {saving ? "Adding..." : "Add Title"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────────── Main Component ───────────────── */

export default function TitlesPage() {
  const [animals, setAnimals] = React.useState<Animal[]>([]);
  const [titleDefinitions, setTitleDefinitions] = React.useState<TitleDefinition[]>([]);
  const [allTitles, setAllTitles] = React.useState<(AnimalTitle & { animal: Animal })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = React.useState<string>("");
  const [filterOrg, setFilterOrg] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [animalsData, titleDefsData] = await Promise.all([
        fetchAnimals(),
        fetchTitleDefinitions(),
      ]);

      setAnimals(animalsData);
      setTitleDefinitions(titleDefsData);

      // Fetch titles for all animals
      const titlesPromises = animalsData.map(async (animal) => {
        try {
          const titles = await fetchAnimalTitles(animal.id);
          return titles.map((t) => ({ ...t, animal }));
        } catch {
          return [];
        }
      });

      const titlesResults = await Promise.all(titlesPromises);
      setAllTitles(titlesResults.flat());
    } catch (err) {
      console.error("Failed to load titles data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTitle = async (
    animalId: number,
    data: {
      titleDefinitionId: number;
      dateEarned?: string;
      eventName?: string;
      eventLocation?: string;
      handlerName?: string;
      notes?: string;
    }
  ) => {
    await addAnimalTitle(animalId, data);
    await loadData();
  };

  const handleDeleteTitle = async (animalId: number, titleId: number) => {
    if (!confirm("Are you sure you want to remove this title?")) return;
    await deleteAnimalTitle(animalId, titleId);
    await loadData();
  };

  // Get unique categories and organizations for filters
  const categories = React.useMemo(() => {
    const cats = new Set(allTitles.map((t) => t.titleDefinition.category));
    return Array.from(cats).sort();
  }, [allTitles]);

  const organizations = React.useMemo(() => {
    const orgs = new Set(allTitles.map((t) => t.titleDefinition.organization).filter(Boolean));
    return Array.from(orgs).sort() as string[];
  }, [allTitles]);

  // Filter titles
  const filteredTitles = React.useMemo(() => {
    return allTitles.filter((t) => {
      if (filterCategory && t.titleDefinition.category !== filterCategory) return false;
      if (filterOrg && t.titleDefinition.organization !== filterOrg) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const animalName = (t.animal.registeredName || t.animal.name || "").toLowerCase();
        const titleAbbr = t.titleDefinition.abbreviation.toLowerCase();
        const titleFull = t.titleDefinition.fullName.toLowerCase();
        if (!animalName.includes(q) && !titleAbbr.includes(q) && !titleFull.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allTitles, filterCategory, filterOrg, searchQuery]);

  // Group by animal for display
  const titlesByAnimal = React.useMemo(() => {
    const grouped = new Map<number, (AnimalTitle & { animal: Animal })[]>();
    for (const t of filteredTitles) {
      const existing = grouped.get(t.animal.id) || [];
      existing.push(t);
      grouped.set(t.animal.id, existing);
    }
    return grouped;
  }, [filteredTitles]);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Titles" subtitle="Loading..." />
        <div className="mt-8 flex items-center justify-center py-12">
          <div className="animate-pulse text-secondary">Loading titles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Titles"
        subtitle={`${allTitles.length} titles across ${animals.length} animals`}
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            Add Title
          </Button>
        }
      />

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search animals or titles..."
          className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary text-sm w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="px-3 py-2 bg-surface-strong border border-hairline rounded-lg text-primary text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
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

      {/* Titles List */}
      <div className="mt-6 space-y-6">
        {titlesByAnimal.size === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface p-8 text-center">
            <p className="text-secondary">No titles found. Add titles to your animals to track their achievements.</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              Add Your First Title
            </Button>
          </div>
        ) : (
          Array.from(titlesByAnimal.entries()).map(([animalId, titles]) => {
            const animal = titles[0].animal;
            return (
              <div key={animalId} className="rounded-xl border border-hairline bg-surface overflow-hidden">
                {/* Animal Header */}
                <div className="px-4 py-3 border-b border-hairline bg-surface-strong">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-primary">
                        {animal.titlePrefix && (
                          <span className="text-[hsl(var(--brand-orange))] mr-1">{animal.titlePrefix}</span>
                        )}
                        {animal.registeredName || animal.name || `Animal #${animal.id}`}
                        {animal.titleSuffix && (
                          <span className="text-[hsl(var(--brand-orange))] ml-1">{animal.titleSuffix}</span>
                        )}
                      </h3>
                      <p className="text-xs text-secondary mt-0.5">{titles.length} title{titles.length !== 1 ? "s" : ""}</p>
                    </div>
                    <a
                      href={`/animals/${animal.id}`}
                      className="text-sm text-secondary hover:text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(null, "", `/animals/${animal.id}`);
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }}
                    >
                      View Animal
                    </a>
                  </div>
                </div>

                {/* Titles Table */}
                <div className="divide-y divide-hairline">
                  {titles.map((t) => (
                    <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-center">
                          <span className="text-lg font-bold text-[hsl(var(--brand-orange))]">
                            {t.titleDefinition.abbreviation}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-primary">{t.titleDefinition.fullName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <CategoryBadge category={t.titleDefinition.category} />
                            {t.titleDefinition.organization && (
                              <span className="text-xs text-secondary">{t.titleDefinition.organization}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <StatusBadge status={t.status} />
                          {t.dateEarned && (
                            <div className="text-xs text-secondary mt-1">
                              {new Date(t.dateEarned).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTitle(animal.id, t.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-secondary hover:text-red-400 transition-colors"
                          title="Remove title"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Title Modal */}
      {showAddModal && (
        <AddTitleModal
          animals={animals}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTitle}
        />
      )}
    </div>
  );
}
